// Based on docs/Buddy-ReactEffect-Design.md

import { Effect } from "effect";

/**
 * Represents a single message in the chat.
 */
export interface Message {
  id: string; // Unique message ID
  text: string; // Content of the message
  sender: "user" | "agent" | "system"; // Originator of the message
  timestamp: string; // ISO 8601 date string
}

/**
 * Represents the complete snapshot of a chat instance's UI-relevant state.
 */
export interface ChatState {
  chatId: string; // Unique ID for this chat session instance
  messages: ReadonlyArray<Message>; // Immutable list of messages
  status:
    | "initializing" // Hook is setting up
    | "connecting" // Attempting WebSocket connection
    | "connected" // WebSocket connected and active
    | "disconnected" // WebSocket intentionally closed or unrecoverable error after retries
    | "reconnecting" // Actively retrying a dropped connection
    | "error"; // Unrecoverable error state / Max retries reached
  agentName: string; // Display name of the agent
  error?: string; // Optional error message for UI display
}

/**
 * Defines commands that the React UI can dispatch to the Effect program.
 */
export type ChatAction =
  | { _tag: "sendMessage"; text: string }
  | { _tag: "tryReconnect" }; // User-initiated attempt to reconnect

/**
 * Structure of messages sent from Client to Agent over WebSocket.
 */
export interface ClientMessagePayload {
  type: "userMessage";
  // chatId and agentId are assumed to be known by the agent via connection params (e.g., WebSocket URL query params).
  message: Omit<Message, "id" | "sender" | "timestamp">; // Agent typically fills id, sender, timestamp upon receipt/processing
}

/**
 * Structure of messages/events received from the Agent via WebSocket.
 */
export type AgentEvent =
  | { type: "newMessage"; payload: Message }
  | { type: "statusUpdate"; status: ChatState["status"]; agentName?: string }
  | { type: "fullState"; payload: ChatState } // For initial sync or recovery
  | { type: "error"; message: string } // Agent-side error to display to user
  | { type: "pong" }; // Response to a client ping (if keep-alive is implemented)

/**
 * Data structure for agent configuration.
 */
export interface AgentConfigData {
  readonly agentId: string; // Logical ID of the agent (e.g., "weatherAgentV1")
  readonly agentWsUrl: string; // Full WebSocket URL (e.g., "wss://example.com/chat")
  readonly initialAgentName: string; // Default display name for the agent
}

/**
 * Service definition for AgentConfig.
 * The service itself holds the AgentConfigData.
 */
export class AgentConfig extends Effect.Tag("AgentConfig")<
  AgentConfig, // The service type itself
  AgentConfigData // The data the service holds
>() {}
