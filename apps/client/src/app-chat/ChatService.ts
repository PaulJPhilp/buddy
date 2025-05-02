/**
 * @file Implementation of the ChatService using Effect's Service pattern.
 */

import { Effect, Ref } from "effect"
import type {
    ChatHistoryPage,
    ChatStateApi,
    MessageApi
} from "./ChatServiceApi"
import { MAX_MESSAGES_PER_CHAT } from "./ChatServiceApi"
import {
    HistoryError,
    MessageCreationError,
    StateNotFoundError,
    StateUpdateError
} from "./errors"
import { sanitizeMessage, validateMessageText } from "./helpers"
export { HistoryError, MessageCreationError, StateNotFoundError, StateUpdateError } from "./errors"

export class ChatService extends Effect.Service<ChatService>()("ChatService", {
    effect: Effect.gen(function* () {
        const stateRef = yield* Ref.make<ChatStateApi>({
            id: "default",
            messages: [],
            isTyping: false
        })

        return {
            getState: Effect.gen(function* () {
                const state = yield* Ref.get(stateRef)
                if (!state?.id) {
                    return yield* Effect.fail(new StateNotFoundError("default"))
                }
                return state
            }),

            setState: (state: ChatStateApi) => Effect.gen(function* () {
                if (!state?.id) {
                    return yield* Effect.fail(new StateUpdateError("Invalid state object"))
                }
                yield* Ref.set(stateRef, state)
                return state
            }),

            sendMessage: (text: string) => Effect.gen(function* () {
                const validation = validateMessageText(text)
                if (!validation.isValid) {
                    return yield* Effect.fail(
                        new MessageCreationError(
                            `Invalid message: ${validation.errors.join(", ")}`
                        )
                    )
                }

                const currentState = yield* Ref.get(stateRef)
                if (currentState.messages.length >= MAX_MESSAGES_PER_CHAT) {
                    return yield* Effect.fail(
                        new MessageCreationError(
                            `Chat has reached maximum message limit of ${MAX_MESSAGES_PER_CHAT}`
                        )
                    )
                }

                const userMessage: MessageApi = {
                    id: `msg-${Date.now()}`,
                    text: sanitizeMessage(text),
                    sender: "user",
                    timestamp: Date.now(),
                    metadata: {
                        length: text.length,
                        validation
                    }
                }

                const newState = {
                    ...currentState,
                    messages: [...currentState.messages, userMessage],
                    isTyping: true,
                    metadata: {
                        messageCount: currentState.messages.length + 1,
                        lastMessageAt: Date.now()
                    }
                }
                yield* Ref.set(stateRef, newState)

                // Echo response
                const agentMessage: MessageApi = {
                    id: `msg-${Date.now()}`,
                    text: `Echo: ${text}`,
                    sender: "assistant",
                    timestamp: Date.now(),
                    metadata: {
                        length: text.length
                    }
                }

                const finalState = {
                    ...newState,
                    messages: [...newState.messages, agentMessage],
                    isTyping: false,
                    metadata: {
                        messageCount: newState.messages.length + 1,
                        lastMessageAt: Date.now()
                    }
                }
                yield* Ref.set(stateRef, finalState)

                return userMessage
            }),

            setTyping: (isTyping: boolean) => Effect.gen(function* () {
                const currentState = yield* Ref.get(stateRef)
                const newState = { ...currentState, isTyping }
                yield* Ref.set(stateRef, newState)
                return newState
            }),

            validateMessage: (text: string) => Effect.succeed(validateMessageText(text)),

            getHistory: (cursor?: string, limit = 50) => Effect.gen(function* () {
                const state = yield* Ref.get(stateRef)
                const messages = [...state.messages]
                const totalMessages = messages.length

                if (!cursor) {
                    const page = messages.slice(-limit)
                    return {
                        messages: page,
                        hasMore: totalMessages > limit,
                        nextCursor: page[0]?.id
                    } as ChatHistoryPage
                }

                const cursorIndex = messages.findIndex(m => m.id === cursor)
                if (cursorIndex === -1) {
                    return yield* Effect.fail(
                        new HistoryError(`Invalid cursor: ${cursor}`)
                    )
                }

                const page = messages.slice(
                    Math.max(0, cursorIndex - limit),
                    cursorIndex
                )

                return {
                    messages: page,
                    hasMore: cursorIndex > limit,
                    nextCursor: page[0]?.id
                } as ChatHistoryPage
            }),

            clearHistory: () => Effect.gen(function* () {
                const currentState = yield* Ref.get(stateRef)
                yield* Ref.set(stateRef, {
                    ...currentState,
                    messages: [],
                    metadata: {
                        messageCount: 0,
                        lastMessageAt: undefined
                    }
                })
            })
        }
    })
}) { }