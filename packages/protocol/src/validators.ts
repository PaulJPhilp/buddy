import type {
    ClientMessage,
    ProtocolMessage,
    ServerMessage,
    UserMessage,
    ValidationResult,
    WebSocketEnvelope
} from './types.js';

/**
 * Validates that a message conforms to the protocol
 */
export function validateMessage(message: unknown): ValidationResult {
    const errors: string[] = [];

    if (!message || typeof message !== 'object') {
        errors.push('Message must be an object');
        return { isValid: false, errors };
    }

    const msg = message as Record<string, unknown>;

    // Check required fields
    if (!msg.type || typeof msg.type !== 'string') {
        errors.push('Message must have a valid type field');
    }

    if (!msg.timestamp || typeof msg.timestamp !== 'string') {
        errors.push('Message must have a valid timestamp field');
    }

    // Validate timestamp format
    if (msg.timestamp && typeof msg.timestamp === 'string') {
        const date = new Date(msg.timestamp);
        if (isNaN(date.getTime())) {
            errors.push('Timestamp must be a valid ISO date string');
        }
    }

    // Type-specific validation
    if (msg.type === 'USER_MESSAGE') {
        if (!msg.text || typeof msg.text !== 'string') {
            errors.push('USER_MESSAGE must have a valid text field');
        }
        if (msg.text && typeof msg.text === 'string' && msg.text.trim().length === 0) {
            errors.push('USER_MESSAGE text cannot be empty');
        }
    }

    if (msg.type === 'LLM_RESPONSE') {
        if (!msg.content || typeof msg.content !== 'string') {
            errors.push('LLM_RESPONSE must have a valid content field');
        }
    }

    if (msg.type === 'LLM_STREAM') {
        if (typeof msg.content !== 'string') {
            errors.push('LLM_STREAM must have a valid content field');
        }
        if (typeof msg.isComplete !== 'boolean') {
            errors.push('LLM_STREAM must have a valid isComplete field');
        }
        // Allow empty content only for completion messages
        if (msg.content === '' && msg.isComplete !== true) {
            errors.push('LLM_STREAM content cannot be empty unless it is a completion message');
        }
    }

    if (msg.type === 'ERROR') {
        if (!msg.code || typeof msg.code !== 'string') {
            errors.push('ERROR message must have a valid code field');
        }
        if (!msg.message || typeof msg.message !== 'string') {
            errors.push('ERROR message must have a valid message field');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Type guard for client messages
 */
export function isClientMessage(message: ProtocolMessage): message is ClientMessage {
    return message.type === 'USER_MESSAGE' || message.type === 'CONNECTION';
}

/**
 * Type guard for server messages
 */
export function isServerMessage(message: ProtocolMessage): message is ServerMessage {
    return ['ACK', 'LLM_RESPONSE', 'LLM_STREAM', 'THINKING', 'ERROR', 'WELCOME'].includes(message.type);
}

/**
 * Type guard for user messages
 */
export function isUserMessage(message: ProtocolMessage): message is UserMessage {
    return message.type === 'USER_MESSAGE';
}

/**
 * Validates and parses a WebSocket envelope
 */
export function parseWebSocketMessage(envelope: WebSocketEnvelope): {
    message: ProtocolMessage | null;
    validation: ValidationResult;
} {
    try {
        const parsed = JSON.parse(envelope.text);
        const validation = validateMessage(parsed);

        return {
            message: validation.isValid ? parsed as ProtocolMessage : null,
            validation
        };
    } catch (error) {
        return {
            message: null,
            validation: {
                isValid: false,
                errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }
        };
    }
}

/**
 * Sanitizes user input to prevent XSS and other attacks
 */
export function sanitizeUserInput(text: string): string {
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Validates that user input is safe
 */
export function validateUserInput(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text || typeof text !== 'string') {
        errors.push('Text must be a non-empty string');
        return { isValid: false, errors };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
        errors.push('Text cannot be empty or only whitespace');
    }

    if (trimmed.length > 10000) {
        errors.push('Text exceeds maximum length of 10,000 characters');
    }

    // Check for potentially dangerous content
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
            errors.push('Text contains potentially unsafe content');
            break;
        }
    }

    // Check for excessive special characters
    const specialCharCount = (text.match(/[<>'"&]/g) || []).length;
    if (specialCharCount > text.length * 0.1) {
        warnings.push('Text contains many special characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
} 