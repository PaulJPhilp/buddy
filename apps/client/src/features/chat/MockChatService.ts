import { AgentRuntimeService } from "@/services/AgentRuntimeService"; // Mock might not need full runtime
import { Effect, Ref } from "effect";
import type {
    ChatHistoryPage,
    ChatState,
    ChatStateApi,
    FileAttachment,
    MessageApi,
    MessageValidation,
} from "./ChatServiceApi";

// A simple counter for generating unique IDs for mock messages
let mockMessageCounter = 0;

export class MockChatService extends Effect.Service<ChatStateApi>()(
    "MockChatService",
    {
        effect: Effect.gen(function* () {
            // Mock state using Ref
            const mockStateRef = yield* Ref.make<ChatState>({
                id: "mock-chat",
                messages: [],
                isTyping: false,
                metadata: {
                    messageCount: 0,
                    totalAttachments: 0,
                },
            });

            const service: ChatStateApi = {
                getState: () => Ref.get(mockStateRef),

                setState: (newState: ChatState) =>
                    Effect.gen(function* () {
                        yield* Ref.set(mockStateRef, newState);
                        return newState;
                    }),

                sendMessage: (text: string, attachments?: File[]) =>
                    Effect.gen(function* () {
                        const currentState = yield* Ref.get(mockStateRef);
                        const processedAttachments: FileAttachment[] = (
                            attachments || []
                        ).map((file, index) => ({
                            id: `mock-file-${Date.now()}-${index}`,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        }));

                        const userMessage: MessageApi = {
                            id: `mock-msg-user-${Date.now()}-${mockMessageCounter++}`,
                            text: text,
                            sender: "user",
                            timestamp: Date.now(),
                            attachments: processedAttachments,
                            metadata: {
                                length: text.length,
                                hasAttachments: processedAttachments.length > 0,
                            },
                        };

                        // Simulate assistant response
                        const assistantMessage: MessageApi = {
                            id: `mock-msg-assistant-${Date.now()}-${mockMessageCounter++}`,
                            text: `Mock response to: "${text}"`,
                            sender: "assistant",
                            timestamp: Date.now(),
                        };

                        const newMessages = [...currentState.messages, userMessage, assistantMessage];

                        yield* Ref.update(mockStateRef, (state) => ({
                            ...state,
                            messages: newMessages,
                            isTyping: false,
                            metadata: {
                                ...state.metadata,
                                messageCount: newMessages.length,
                                lastMessageAt: Date.now(),
                                totalAttachments: (state.metadata?.totalAttachments || 0) + processedAttachments.length,
                            }
                        }));
                        yield* Effect.logInfo(`MockChatService: sendMessage called with text: ${text}`);
                        return userMessage; // Or perhaps the assistant's message, depending on desired mock behavior
                    }),

                setTyping: (isTyping: boolean) =>
                    Effect.gen(function* () {
                        yield* Effect.logInfo(`MockChatService: setTyping called with: ${isTyping}`);
                        const updatedState = yield* Ref.modify(mockStateRef, (state) => {
                            const newState = { ...state, isTyping };
                            return [newState, newState];
                        });
                        return updatedState;
                    }),

                validateMessage: (text: string) =>
                    Effect.succeed<MessageValidation>({
                        isValid: text.length > 0 && text.length <= 2000, // Basic mock validation
                        errors: text.length === 0 ? ["Message cannot be empty."] : [],
                    }),

                getHistory: (cursor?: string, limit = 10) =>
                    Effect.gen(function* () {
                        yield* Effect.logInfo(`MockChatService: getHistory called with cursor: ${cursor}, limit: ${limit}`);
                        const state = yield* Ref.get(mockStateRef);
                        // Simplified mock history - returns last 'limit' messages
                        const messages = state.messages.slice(-limit);
                        const page: ChatHistoryPage = {
                            messages,
                            hasMore: state.messages.length > limit, // very basic check
                            nextCursor: messages[0]?.id,
                        };
                        return page;
                    }),

                clearHistory: () =>
                    Effect.gen(function* () {
                        yield* Effect.logInfo("MockChatService: clearHistory called");
                        yield* Ref.update(mockStateRef, (state) => ({
                            ...state,
                            messages: [],
                            metadata: {
                                messageCount: 0,
                                lastMessageAt: undefined,
                                totalAttachments: 0,
                            },
                        }));
                    }),
            };
            return service;
        }),
        // MockChatService might not need the full AgentRuntimeService,
        // or it could use a mock version of it if necessary.
        // For simplicity, we'll list it, but its usage in the mock is minimal.
        dependencies: [AgentRuntimeService.Default],
    },
) { }
