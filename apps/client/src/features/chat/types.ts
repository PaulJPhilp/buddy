import { Effect } from "effect";
import type { Agent } from "./components/UserArea";

export interface DisplayFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export type Theme = "blue" | "rose";

export interface MessageValidation {
  isValid: boolean;
  errors: string[];
}

export const MIN_MESSAGE_LENGTH = 1;
export const MAX_MESSAGE_LENGTH = 32000;

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  attachments?: FileAttachment[];
  metadata?: Record<string, unknown>;
}

export type MessageApi = {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  attachments?: FileAttachment[];
  metadata?: Record<string, unknown>;
};

export interface ChatHistoryPage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatState {
  id: string;
  messages: Message[];
  isTyping: boolean;
  error?: string;
  metadata?: {
    messageCount: number;
    lastMessageAt?: number;
    totalAttachments: number;
  };
}

export interface ChatStateApi {
  readonly state: ChatState;
  getState(): Effect.Effect<ChatState, never, never>;
  setState(newState: ChatState): Effect.Effect<ChatState, never, never>;
  setTyping(isTyping: boolean): Effect.Effect<ChatState, never, never>;
  sendMessage(message: MessageApi): Effect.Effect<void, Error, never>;
  validateMessage(text: string): MessageValidation;
  loadMoreHistory(): Effect.Effect<ChatHistoryPage, Error, never>;
  clearHistory(): Effect.Effect<void, Error, never>;
}

// Types for useChatInstance hook (inspired by Buddy-ReactEffect-Design.md)

/**
 * Represents the payload sent from the client to the agent
 * when a user sends a message.
 */
export interface ClientMessagePayload {
  type: "userMessage";
  message: {
    text: string;
    attachments?: FileAttachment[]; // Added for file attachments
  };
  // chatId and agentId are typically sent as part of the WebSocket URL query params.
}

/**
 * Represents the state managed by the useChatInstance hook.
 * This is distinct from the ChatState defined above for ChatStateApi.
 */
export interface ChatInstanceHookState {
  chatId: string;
  messages: ReadonlyArray<Message>; // Uses the Message interface defined above
  status:
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";
  agentName: string;
  error?: string;
  isTyping?: boolean;
}

/**
 * Defines actions that can be dispatched to the useChatInstance hook's Effect program.
 */
export type ChatInstanceAction =
  | { _tag: "sendMessage"; text: string; attachments?: FileAttachment[] } // Added attachments
  | { _tag: "tryReconnect" };

/**
 * Represents events received from the agent via WebSocket.
 */
export type AgentEvent =
  | { type: "newMessage"; payload: Message } // Uses the Message interface defined above
  | { type: "statusUpdate"; status: ChatInstanceHookState["status"]; agentName?: string }
  | { type: "fullState"; payload: ChatInstanceHookState } // Uses the hook's state
  | { type: "error"; message: string }
  | { type: "pong" }
  | { type: "agentTyping"; isTyping: boolean };

// Renamed from AgentConfigData to ChatAgentConfig
export interface ChatAgentConfig {
  agentId: string;
  initialAgentName: string;
  agents?: Agent[]; // Optional array of available agents
}
