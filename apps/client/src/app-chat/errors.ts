import { AiError } from "@effect/ai/AiError"

/**
 * The base error for all application-specific errors in EffectiveAgent.
 * Adds module, method, and any additional context needed for debugging.
 */
export class EffectiveError extends AiError {
    public readonly module: string
    public readonly method: string
    public readonly cause?: unknown
    constructor(params: {
        description: string
        module: string
        method: string
        cause?: unknown
    }) {
        super({
            description: params.description,
            cause: params.cause,
            module: params.module,
            method: params.method,
        })
        this.module = params.module
        this.method = params.method
        this.cause = params.cause
    }
}

/**
 * Chat service error types
 */
export class ChatError extends EffectiveError {
    constructor(params: {
        description: string
        method: string
        cause?: unknown
    }) {
        super({
            ...params,
            module: "ChatService",
        })
    }
}

export class StateNotFoundError extends ChatError {
    constructor(id: string) {
        super({
            description: `Chat state with ID '${id}' not found`,
            method: "getState",
        })
    }
}

export class MessageCreationError extends ChatError {
    constructor(reason: string, method = "sendMessage", cause?: unknown) {
        super({
            description: `Failed to create message: ${reason}`,
            method,
            cause,
        })
    }
}

export class StateUpdateError extends ChatError {
    constructor(reason: string, method = "setState", cause?: unknown) {
        super({
            description: `Failed to update chat state: ${reason}`,
            method,
            cause,
        })
    }
}

export class HistoryError extends ChatError {
    constructor(reason: string, method = "getHistory", cause?: unknown) {
        super({
            description: `Chat history error: ${reason}`,
            method,
            cause,
        })
    }
} 