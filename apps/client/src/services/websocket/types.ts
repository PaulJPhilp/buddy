// Re-export types from protocol
export type { WebSocketMessage } from "@buddy/protocol";

// Type aliases for compatibility
export type ProtocolMessage = import("@buddy/protocol").WebSocketMessage;
export type WebSocketEnvelope = import("@buddy/protocol").WebSocketMessage;

export interface UserMessage {
  readonly text: string;
  readonly attachments?: Array<{ name: string }>;
}

export interface MessageValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly sanitized: string;
}

// Message callback type for pub/sub pattern
export type MessageCallback = (message: ProtocolMessage) => void;

// WebSocket service options
export interface WebSocketServiceOptions {
  readonly timeout?: string;
  readonly reconnectAttempts?: number;
  readonly reconnectDelay?: number;
}
