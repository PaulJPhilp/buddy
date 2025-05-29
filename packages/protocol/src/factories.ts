import { nanoid } from 'nanoid';
import type {
    AcknowledgmentMessage,
    ConnectionMessage,
    ErrorMessage,
    LLMResponseMessage,
    LLMStreamMessage,
    ThinkingStateMessage,
    UserMessage,
    WebSocketEnvelope,
    WelcomeMessage
} from './types.js';

/**
 * Creates a properly formatted timestamp
 */
function createTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Creates a unique message ID
 */
function createMessageId(): string {
    return nanoid();
}

// Client Message Factories

/**
 * Creates a user message
 */
export function createUserMessage(
    text: string,
    options?: {
        id?: string;
        timestamp?: string;
        metadata?: {
            userId?: string;
            sessionId?: string;
            attachments?: readonly string[];
            chatId?: string;
        };
    }
): UserMessage {
    return {
        type: 'USER_MESSAGE',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        text: text.trim(),
        metadata: options?.metadata
    };
}

/**
 * Creates a connection message
 */
export function createConnectionMessage(
    action: 'CONNECT' | 'DISCONNECT' | 'PING',
    options?: {
        id?: string;
        timestamp?: string;
        clientInfo?: {
            userAgent?: string;
            version?: string;
        };
    }
): ConnectionMessage {
    return {
        type: 'CONNECTION',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        action,
        clientInfo: options?.clientInfo
    };
}

// Server Message Factories

/**
 * Creates an acknowledgment message
 */
export function createAckMessage(
    status: 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'ERROR',
    options?: {
        id?: string;
        timestamp?: string;
        originalMessageId?: string;
        message?: string;
    }
): AcknowledgmentMessage {
    return {
        type: 'ACK',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        status,
        originalMessageId: options?.originalMessageId,
        message: options?.message
    };
}

/**
 * Creates an LLM response message
 */
export function createLLMResponseMessage(
    content: string,
    options?: {
        id?: string;
        timestamp?: string;
        finishReason?: string;
        metadata?: {
            model?: string;
            usage?: {
                promptTokens?: number;
                completionTokens?: number;
                totalTokens?: number;
            };
            processingTime?: number;
        };
    }
): LLMResponseMessage {
    return {
        type: 'LLM_RESPONSE',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        content,
        finishReason: options?.finishReason,
        metadata: options?.metadata
    };
}

/**
 * Creates an LLM stream message
 */
export function createLLMStreamMessage(
    content: string,
    isComplete: boolean,
    options?: {
        id?: string;
        timestamp?: string;
        streamId?: string;
        metadata?: {
            model?: string;
            chunkIndex?: number;
            totalChunks?: number;
            chatId?: string;
        };
    }
): LLMStreamMessage {
    return {
        type: 'LLM_STREAM',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        content,
        isComplete,
        streamId: options?.streamId,
        metadata: options?.metadata
    };
}

/**
 * Creates a thinking state message
 */
export function createThinkingMessage(
    isThinking: boolean,
    options?: {
        id?: string;
        timestamp?: string;
        message?: string;
    }
): ThinkingStateMessage {
    return {
        type: 'THINKING',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        isThinking,
        message: options?.message
    };
}

/**
 * Creates an error message
 */
export function createErrorMessage(
    code: string,
    message: string,
    options?: {
        id?: string;
        timestamp?: string;
        details?: string;
        recoverable?: boolean;
    }
): ErrorMessage {
    return {
        type: 'ERROR',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        code,
        message,
        details: options?.details,
        recoverable: options?.recoverable
    };
}

/**
 * Creates a welcome message
 */
export function createWelcomeMessage(
    message: string,
    options?: {
        id?: string;
        timestamp?: string;
        serverInfo?: {
            version?: string;
            capabilities?: readonly string[];
        };
    }
): WelcomeMessage {
    return {
        type: 'WELCOME',
        id: options?.id ?? createMessageId(),
        timestamp: options?.timestamp ?? createTimestamp(),
        message,
        serverInfo: options?.serverInfo
    };
}

// WebSocket Envelope Factories

/**
 * Creates a WebSocket envelope from a protocol message
 */
export function createWebSocketEnvelope(
    message: object,
    options?: {
        timestamp?: string;
        binary?: boolean;
    }
): WebSocketEnvelope {
    return {
        text: JSON.stringify(message),
        timestamp: options?.timestamp ?? createTimestamp(),
        binary: options?.binary ?? false
    };
}

/**
 * Creates a WebSocket envelope from raw text
 */
export function createRawWebSocketEnvelope(
    text: string,
    options?: {
        timestamp?: string;
        binary?: boolean;
    }
): WebSocketEnvelope {
    return {
        text,
        timestamp: options?.timestamp ?? createTimestamp(),
        binary: options?.binary ?? false
    };
}

// Convenience functions for common patterns

/**
 * Creates a user message and wraps it in a WebSocket envelope
 */
export function createUserMessageEnvelope(text: string): WebSocketEnvelope {
    const message = createUserMessage(text);
    return createWebSocketEnvelope(message);
}

/**
 * Creates an LLM response and wraps it in a WebSocket envelope
 */
export function createLLMResponseEnvelope(
    content: string,
    finishReason?: string
): WebSocketEnvelope {
    const message = createLLMResponseMessage(content, { finishReason });
    return createWebSocketEnvelope(message);
}

/**
 * Creates an error message and wraps it in a WebSocket envelope
 */
export function createErrorEnvelope(
    code: string,
    message: string,
    details?: string
): WebSocketEnvelope {
    const errorMessage = createErrorMessage(code, message, { details });
    return createWebSocketEnvelope(errorMessage);
} 