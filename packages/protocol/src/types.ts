/**
 * Core protocol types for Buddy chat application
 * This ensures consistent message formats between client and server
 */

// Base message interface
export interface BaseMessage {
    readonly timestamp: string;
    readonly id?: string;
}

// Client-to-Server Messages
export interface UserMessage extends BaseMessage {
    readonly type: "USER_MESSAGE";
    readonly text: string;
    readonly metadata?: {
        readonly userId?: string;
        readonly sessionId?: string;
        readonly attachments?: readonly string[];
        readonly chatId?: string;
    };
}

export interface ConnectionMessage extends BaseMessage {
    readonly type: "CONNECTION";
    readonly action: "CONNECT" | "DISCONNECT" | "PING";
    readonly clientInfo?: {
        readonly userAgent?: string;
        readonly version?: string;
    };
}

export type ClientMessage = UserMessage | ConnectionMessage;

// Server-to-Client Messages
export interface AcknowledgmentMessage extends BaseMessage {
    readonly type: "ACK";
    readonly originalMessageId?: string;
    readonly status: "RECEIVED" | "PROCESSING" | "COMPLETED" | "ERROR";
    readonly message?: string;
}

export interface LLMResponseMessage extends BaseMessage {
    readonly type: "LLM_RESPONSE";
    readonly content: string;
    readonly finishReason?: string;
    readonly metadata?: {
        readonly model?: string;
        readonly usage?: {
            readonly promptTokens?: number;
            readonly completionTokens?: number;
            readonly totalTokens?: number;
        };
        readonly processingTime?: number;
    };
}

export interface LLMStreamMessage extends BaseMessage {
    readonly type: "LLM_STREAM";
    readonly content: string;
    readonly isComplete: boolean;
    readonly streamId?: string;
    readonly metadata?: {
        readonly model?: string;
        readonly chunkIndex?: number;
        readonly totalChunks?: number;
        readonly chatId?: string;
    };
}

export interface ThinkingStateMessage extends BaseMessage {
    readonly type: "THINKING";
    readonly isThinking: boolean;
    readonly message?: string;
}

export interface ErrorMessage extends BaseMessage {
    readonly type: "ERROR";
    readonly code: string;
    readonly message: string;
    readonly details?: string;
    readonly recoverable?: boolean;
}

export interface WelcomeMessage extends BaseMessage {
    readonly type: "WELCOME";
    readonly message: string;
    readonly serverInfo?: {
        readonly version?: string;
        readonly capabilities?: readonly string[];
    };
}

export type ServerMessage =
    | AcknowledgmentMessage
    | LLMResponseMessage
    | LLMStreamMessage
    | ThinkingStateMessage
    | ErrorMessage
    | WelcomeMessage;

// Union of all possible messages
export type ProtocolMessage = ClientMessage | ServerMessage;

// WebSocket wrapper for raw message transport
export interface WebSocketEnvelope {
    readonly text: string;
    readonly timestamp: string;
    readonly binary?: boolean;
}

// Error types
export interface ProtocolError {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
    readonly timestamp: string;
}

// Connection states
export type ConnectionState =
    | "DISCONNECTED"
    | "CONNECTING"
    | "CONNECTED"
    | "RECONNECTING"
    | "ERROR";

// Message validation result
export interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: readonly string[];
    readonly warnings?: readonly string[];
} 