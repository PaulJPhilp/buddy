// Simplified protocol types - matching the server implementation
export interface SimpleMessage {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly timestamp: number;
}

// Type aliases for compatibility
export type ProtocolMessage = SimpleMessage;
export type WebSocketEnvelope = SimpleMessage;
export type WebSocketMessage = SimpleMessage;

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
