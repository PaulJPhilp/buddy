/**
 * @file Implementation of the ChatService using Effect's Service pattern.
 */

import { AiError } from "@effect/ai/AiError";
import { Effect, Ref } from "effect";
import type {
    ChatServiceApi,
    ChatStateApi,
    MessageApi,
    MessageValidation
} from "./ChatServiceApi";
import {
    MAX_MESSAGES_PER_CHAT,
    MAX_MESSAGE_LENGTH,
    MIN_MESSAGE_LENGTH
} from "./ChatServiceApi";

/**
 * The base error for all application-specific errors in EffectiveAgent.
 * Adds module, method, and any additional context needed for debugging.
 */
export class EffectiveError extends AiError {
    public readonly module: string;
    public readonly method: string;
    public readonly cause?: unknown;
    constructor(params: {
        description: string;
        module: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            description: params.description,
            cause: params.cause,
            module: params.module,
            method: params.method,
        });
        this.module = params.module;
        this.method = params.method;
        this.cause = params.cause;
    }
}

/**
 * Chat service error types
 */
export class ChatError extends EffectiveError {
    constructor(params: {
        description: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            ...params,
            module: "ChatService",
        });
    }
}

export class StateNotFoundError extends ChatError {
    constructor(id: string) {
        super({
            description: `Chat state with ID '${id}' not found`,
            method: "getState",
        });
    }
}

export class MessageCreationError extends ChatError {
    constructor(reason: string, method = "sendMessage", cause?: unknown) {
        super({
            description: `Failed to create message: ${reason}`,
            method,
            cause,
        });
    }
}

export class StateUpdateError extends ChatError {
    constructor(reason: string, method = "setState", cause?: unknown) {
        super({
            description: `Failed to update chat state: ${reason}`,
            method,
            cause,
        });
    }
}

export class HistoryError extends ChatError {
    constructor(reason: string, method = "getHistory", cause?: unknown) {
        super({
            description: `Chat history error: ${reason}`,
            method,
            cause,
        });
    }
}

// Add validation utilities after the error classes
export function validateMessageText(text: string): MessageValidation {
    const errors: string[] = [];

    if (!text || text.trim().length < MIN_MESSAGE_LENGTH) {
        errors.push(`Message must be at least ${MIN_MESSAGE_LENGTH} character long`);
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
        errors.push(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }

    // Basic XSS/injection prevention
    if (/<script|javascript:|data:/i.test(text)) {
        errors.push("Message contains potentially unsafe content");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function sanitizeMessage(text: string): string {
    return text
        .trim()
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[^\w\s.,!?-]/g, ""); // Only allow basic punctuation and alphanumeric
}

/**
 * ChatService implementation using Effect.Service pattern.
 * This service provides chat functionality with state management.
 */
export class ChatService extends Effect.Service<ChatServiceApi>()(
    "ChatService",
    {
        // Define service implementation
        effect: Effect.gen(function* () {
            const initialState: ChatStateApi = {
                id: "default",
                messages: [],
                isTyping: false,
            };

            const stateRef = yield* Ref.make(initialState);

            return Effect.succeed({
                /**
                 * Get the current chat state
                 */
                getState: () =>
                    stateRef.get.pipe(
                        Effect.flatMap((state) => {
                            if (!state || !state.id) {
                                return Effect.fail(new StateNotFoundError("default"));
                            }
                            return Effect.succeed(state);
                        }),
                    ),

                /**
                 * Set a new chat state
                 */
                setState: (state: ChatStateApi) =>
                    Effect.gen(function* () {
                        if (!state || !state.id) {
                            return yield* Effect.fail(
                                new StateUpdateError("Invalid state object"),
                            );
                        }
                        try {
                            return yield* stateRef.modify(() => [state, state]);
                        } catch (error) {
                            return yield* Effect.fail(
                                new StateUpdateError(
                                    error instanceof Error ? error.message : "Unknown error",
                                    "setState",
                                    error,
                                ),
                            );
                        }
                    }),

                /**
                 * Send a new message
                 */
                sendMessage: (text: string) =>
                    Effect.gen(function* () {
                        const validation = yield* Effect.succeed(validateMessageText(text));

                        if (!validation.isValid) {
                            return yield* Effect.fail(
                                new MessageCreationError(
                                    `Invalid message: ${validation.errors.join(", ")}`,
                                    "sendMessage"
                                )
                            );
                        }

                        try {
                            const currentState = yield* stateRef.get;

                            if (!currentState || !currentState.id) {
                                return yield* Effect.fail(new StateNotFoundError("default"));
                            }

                            // Check message limit
                            if (currentState.messages.length >= MAX_MESSAGES_PER_CHAT) {
                                return yield* Effect.fail(
                                    new MessageCreationError(
                                        `Chat has reached maximum message limit of ${MAX_MESSAGES_PER_CHAT}`,
                                        "sendMessage"
                                    )
                                );
                            }

                            const sanitizedText = sanitizeMessage(text);
                            const message: MessageApi = {
                                id: `msg-${Date.now()}`,
                                text: sanitizedText,
                                sender: "user",
                                timestamp: Date.now(),
                                metadata: {
                                    length: sanitizedText.length,
                                    validation
                                }
                            };

                            const newState = {
                                ...currentState,
                                messages: [...currentState.messages, message],
                                metadata: {
                                    messageCount: (currentState.messages.length + 1),
                                    lastMessageAt: Date.now()
                                }
                            };

                            yield* stateRef.modify(() => [newState, newState]);
                            return message;
                        } catch (error) {
                            return yield* Effect.fail(
                                new MessageCreationError(
                                    error instanceof Error ? error.message : "Unknown error",
                                    "sendMessage",
                                    error
                                )
                            );
                        }
                    }),

                /**
                 * Set typing status
                 */
                setTyping: (isTyping: boolean) =>
                    Effect.gen(function* () {
                        try {
                            const currentState = yield* stateRef.get;

                            if (!currentState || !currentState.id) {
                                return yield* Effect.fail(new StateNotFoundError("default"));
                            }

                            const newState = {
                                ...currentState,
                                isTyping,
                            };

                            yield* stateRef.modify(() => [newState, newState]);
                            return newState;
                        } catch (error) {
                            return yield* Effect.fail(
                                new StateUpdateError(
                                    error instanceof Error ? error.message : "Unknown error",
                                    "setTyping",
                                    error,
                                ),
                            );
                        }
                    }),

                /**
                 * Validate a message before sending
                 */
                validateMessage: (text: string) =>
                    Effect.gen(function* () {
                        try {
                            const validation = validateMessageText(text);
                            return validation;
                        } catch (error) {
                            return yield* Effect.fail(
                                new MessageCreationError(
                                    error instanceof Error ? error.message : "Validation failed",
                                    "validateMessage",
                                    error
                                )
                            );
                        }
                    }),

                /**
                 * Get paginated chat history
                 */
                getHistory: (cursor?: string, limit = 50) =>
                    Effect.gen(function* () {
                        try {
                            const state = yield* stateRef.get;

                            if (!state || !state.id) {
                                return yield* Effect.fail(new StateNotFoundError("default"));
                            }

                            const messages = [...state.messages]; // Copy to avoid mutations
                            const totalMessages = messages.length;

                            // If no cursor, return most recent messages
                            if (!cursor) {
                                const page = messages.slice(-limit);
                                return {
                                    messages: page,
                                    hasMore: totalMessages > limit,
                                    nextCursor: page[0]?.id
                                };
                            }

                            // Find cursor position
                            const cursorIndex = messages.findIndex(m => m.id === cursor);
                            if (cursorIndex === -1) {
                                return yield* Effect.fail(
                                    new HistoryError(`Invalid cursor: ${cursor}`)
                                );
                            }

                            // Get messages before cursor
                            const page = messages.slice(Math.max(0, cursorIndex - limit), cursorIndex);

                            return {
                                messages: page,
                                hasMore: cursorIndex > limit,
                                nextCursor: page[0]?.id
                            };
                        } catch (error) {
                            return yield* Effect.fail(
                                new HistoryError(
                                    error instanceof Error ? error.message : "Failed to get history",
                                    "getHistory",
                                    error
                                )
                            );
                        }
                    }),

                /**
                 * Clear chat history
                 */
                clearHistory: () =>
                    Effect.gen(function* () {
                        try {
                            const state = yield* stateRef.get;

                            if (!state || !state.id) {
                                return yield* Effect.fail(new StateNotFoundError("default"));
                            }

                            const newState = {
                                ...state,
                                messages: [],
                                metadata: {
                                    messageCount: 0,
                                    lastMessageAt: undefined
                                }
                            };

                            yield* stateRef.modify(() => [newState, newState]);
                        } catch (error) {
                            return yield* Effect.fail(
                                new HistoryError(
                                    error instanceof Error ? error.message : "Failed to clear history",
                                    "clearHistory",
                                    error
                                )
                            );
                        }
                    }),
            });
        }),
        dependencies: [], // No explicit dependencies
    },
) { }
