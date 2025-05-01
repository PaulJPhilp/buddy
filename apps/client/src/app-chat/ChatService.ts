/**
 * @file Implementation of the ChatService using Effect's Service pattern.
 */

import { Effect, Ref } from "effect";
import type { ChatServiceApi, ChatStateApi, MessageApi } from "./ChatServiceApi";

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
                isTyping: false
            };

            const stateRef = yield* Ref.make(initialState);

            return Effect.succeed({
                /**
                 * Get the current chat state
                 */
                getState: () =>
                    stateRef.get.pipe(
                        Effect.map(state => state)
                    ),

                /**
                 * Set a new chat state
                 */
                setState: (state: ChatStateApi) =>
                    stateRef.modify(() => [state, state]),

                /**
                 * Send a new message
                 */
                sendMessage: (text: string) =>
                    Effect.gen(function* (_) {
                        const message: MessageApi = {
                            id: `msg-${Date.now()}`,
                            text,
                            sender: "user",
                            timestamp: Date.now()
                        };
                        const currentState = yield* stateRef.get;
                        const newState = {
                            ...currentState,
                            messages: [...currentState.messages, message]
                        };
                        yield* stateRef.modify(() => [newState, newState]);
                        return message;
                    }),

                /**
                 * Set typing status
                 */
                setTyping: (isTyping: boolean) =>
                    Effect.gen(function* (_) {
                        const currentState = yield* stateRef.get;
                        const newState = {
                            ...currentState,
                            isTyping
                        };
                        yield* stateRef.modify(() => [newState, newState]);
                        return newState;
                    })
            });
        }),
        dependencies: [] // No explicit dependencies
    }
) { }