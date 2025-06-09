import type { Message } from "@/features/chat/types";

// Chat Instance State Types
export type ChatStatus =
    | "initializing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "error";

export interface ChatInstanceState {
    readonly chatId: string;
    readonly messages: ReadonlyArray<Message>;
    readonly status: ChatStatus;
    readonly agentName: string;
    readonly isTyping: boolean;
    readonly error?: string;
}

// Agent Communication State Types
export interface AgentState {
    readonly activeStreams: ReadonlyMap<string, string>; // streamId -> accumulated text
    readonly pendingMessages: ReadonlyArray<Message>;
}

// Connection State Types
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export interface ConnectionState {
    readonly status: ConnectionStatus;
    readonly reconnectAttempts: number;
    readonly lastError?: Error;
    readonly maxReconnectAttempts: number;
}

// Event Types for Chat Instance Store
export type ChatInstanceEvent =
    | { type: "initialize"; chatId: string; agentName: string }
    | { type: "statusChanged"; status: ChatStatus }
    | { type: "messageAdded"; message: Message }
    | { type: "messagesCleared" }
    | { type: "typingChanged"; isTyping: boolean }
    | { type: "errorOccurred"; error: string }
    | { type: "errorCleared" }
    | { type: "agentNameChanged"; agentName: string };

// Event Types for Agent Store
export type AgentEvent =
    | { type: "streamStarted"; streamId: string; initialText?: string }
    | { type: "streamChunk"; streamId: string; chunk: string }
    | { type: "streamCompleted"; streamId: string; finalMessage: Message }
    | { type: "streamAborted"; streamId: string; reason?: string }
    | { type: "streamsCleared" };

// Event Types for Connection Store
export type ConnectionEvent =
    | { type: "connect"; chatId: string; agentId: string }
    | { type: "connected" }
    | { type: "disconnect"; reason?: string }
    | { type: "disconnected"; reason?: string }
    | { type: "reconnect" }
    | { type: "reconnectAttempted"; attempt: number }
    | { type: "reconnectSucceeded" }
    | { type: "reconnectFailed"; error: Error; attempt: number }
    | { type: "reconnectAbandoned"; finalAttempt: number }
    | { type: "errorOccurred"; error: Error }
    | { type: "reset" };

// Combined state for the hook
export interface UseChatInstanceState {
    readonly chat: ChatInstanceState;
    readonly agent: AgentState;
    readonly connection: ConnectionState;
} 