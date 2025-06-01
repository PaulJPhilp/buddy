import {
    Duration,
    Effect,
    Fiber,
    Layer,
    Queue,
    Schedule,
    Stream
} from "effect";
import { useEffect, useMemo, useState } from "react";

import { MdxService, type MdxServiceApi } from "@/services/mdx";
import { type WebSocketError, WebSocketService } from "@/services/websocket/WebSocketService";
import { ProtocolMessage, createUserMessage } from "@buddy/protocol";
import type {
    ChatAgentConfig,
    ChatInstanceAction,
    ChatInstanceHookState,
    ClientMessagePayload,
    Message
} from "../features/chat/types";

// Constants from design doc (can be moved to a config file or AgentConfig if needed)
const INITIAL_RECONNECT_DELAY = Duration.seconds(1); // Example: 1 second
const MAX_RECONNECT_ATTEMPTS = 5;

// Helper function to convert ProtocolMessage to UI Message with MDX processing
function convertProtocolMessageToUIMessage(protocolMessage: ProtocolMessage): Effect.Effect<Message | null, never, MdxServiceApi> {
    return Effect.gen(function* () {
        switch (protocolMessage.type) {
            case "LLM_RESPONSE": {
                // Process LLM responses through MDX
                const mdxService = yield* MdxService;
                const compiledResult = yield* mdxService.compile(protocolMessage.content || "", {
                    development: process.env.NODE_ENV === "development"
                }).pipe(
                    Effect.catchAll((error) => {
                        return Effect.succeed({
                            compiledSource: protocolMessage.content || "",
                            frontmatter: {},
                            metadata: { mdxError: true }
                        });
                    })
                );

                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.content || "",
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: {
                        ...protocolMessage.metadata,
                        mdx: {
                            compiledSource: compiledResult.compiledSource,
                            frontmatter: compiledResult.frontmatter,
                            metadata: compiledResult.metadata
                        }
                    }
                };
            }

            case "LLM_STREAM": {
                // For streaming messages, we'll handle them differently
                // This is just for complete messages
                if (protocolMessage.isComplete) {
                    return null; // Don't create a message for completion markers
                }
                return {
                    id: protocolMessage.streamId || protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.content || "",
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: { ...protocolMessage.metadata, streaming: true }
                };
            }

            case "ERROR":
                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: `Error: ${protocolMessage.message}`,
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: { error: true, code: protocolMessage.code }
                };

            case "WELCOME":
                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.message,
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: { welcome: true, serverInfo: protocolMessage.serverInfo }
                };

            default:
                return null;
        }
    });
}

export function useChatInstance(
    chatId: string,
    agentConfigData: ChatAgentConfig,
): {
    chatState: ChatInstanceHookState;
    runtimeError: unknown | null;
    dispatchAction: (action: ChatInstanceAction) => void;
} {
    // Memoize the agentConfig properties to prevent unnecessary re-renders
    const agentId = useMemo(() => agentConfigData.agentId, [agentConfigData.agentId]);
    const agentWsUrl = useMemo(() => agentConfigData.agentWsUrl, [agentConfigData.agentWsUrl]);
    const initialAgentName = useMemo(() => agentConfigData.initialAgentName, [agentConfigData.initialAgentName]);

    const [chatState, setChatState] = useState<ChatInstanceHookState>(() => ({
        chatId,
        messages: [],
        status: "initializing",
        agentName: initialAgentName,
        isTyping: false,
    }));

    const [runtimeError, setRuntimeError] = useState<unknown | null>(null);

    const [dispatch, setDispatch] = useState<(action: ChatInstanceAction) => void>(
        () => () =>
            console.warn(
                "Dispatch action called before Effect runtime initialized for chat instance",
            ),
    );

    // Create the WebSocket layer for this hook
    const webSocketLayer = useMemo(() =>
        Layer.merge(
            WebSocketService.Default,
            MdxService.Default
        ),
        []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: agentConfigData is intentionally excluded to prevent re-renders when other properties change
    useEffect(() => {


        const program = Effect.gen(function* () {
            yield* Effect.logInfo(
                `Effect program starting for ${chatId}, Agent: ${agentId}`,
            );
            setRuntimeError(null);

            const inputQueue = yield* Queue.unbounded<ChatInstanceAction>();

            // Track streaming messages outside React state to avoid timing issues
            const streamingMessages = new Map<string, string>();

            setDispatch(() => (action: ChatInstanceAction) => {
                Effect.runFork(Queue.offer(inputQueue, action));
            });

            const updateStatus = (status: ChatInstanceHookState["status"], error?: string) =>
                Effect.sync(() => {
                    setChatState((prev) => ({
                        ...prev,
                        status,
                        error: error ?? prev.error,
                    }));
                });

            const addMessage = (message: Message) =>
                Effect.sync(() => {
                    setChatState((prev) => ({
                        ...prev,
                        messages: [...prev.messages, message],
                    }));
                });

            const updateStreamingMessage = (streamId: string, originalChunkText: string, _unusedParam: string) =>
                Effect.sync(() => {
                    // FIXED: Only accumulate original text, compile complete markdown later
                    // This prevents breaking markdown syntax by compiling incomplete chunks
                    const currentAccumulatedText = streamingMessages.get(streamId) || '';
                    const newAccumulatedText = currentAccumulatedText + originalChunkText;
                    streamingMessages.set(streamId, newAccumulatedText);

                    setChatState((prev) => {
                        const existingMessageIndex = prev.messages.findIndex(
                            msg => msg.id === streamId
                        );

                        if (existingMessageIndex >= 0) {
                            // Update existing streaming message with accumulated text
                            const updatedMessages = [...prev.messages];
                            updatedMessages[existingMessageIndex] = {
                                ...updatedMessages[existingMessageIndex],
                                text: newAccumulatedText, // Accumulated original text
                                metadata: {
                                    ...(updatedMessages[existingMessageIndex].metadata || {}),
                                    streaming: true, // Still streaming until isComplete
                                }
                            };
                            return { ...prev, messages: updatedMessages };
                        }

                        // Create new streaming message with just accumulated text
                        const newMessage: Message = {
                            id: streamId,
                            text: newAccumulatedText, // Accumulated original text
                            role: "assistant",
                            timestamp: Date.now(),
                            metadata: {
                                streaming: true,
                            }
                        };
                        return { ...prev, messages: [...prev.messages, newMessage] };
                    });
                });

            const setTyping = (isTyping: boolean) =>
                Effect.sync(() =>
                    setChatState((prev) => ({
                        ...prev,
                        isTyping,
                    })),
                );

            const webSocketManagerCoreLogic = Effect.gen(function* () {
                // Add a small delay to allow component to stabilize
                yield* Effect.sleep(Duration.millis(100));

                yield* updateStatus("connecting");
                yield* Effect.logInfo(
                    `WebSocketManager: Attempting to connect to ${agentWsUrl} for chatId: ${chatId}`,
                );

                const wsUrl = `${agentWsUrl}?chatId=${chatId}&agentId=${agentId}`;

                const wsService = yield* WebSocketService;

                // Connect using our WebSocketService
                yield* wsService.connect(wsUrl);
                yield* Effect.logInfo("WebSocketManager: Connection established.");
                yield* updateStatus("connected");

                const outgoingEffect = Stream.fromQueue(inputQueue).pipe(
                    Stream.tap((action) => {
                        return Effect.logDebug("OutgoingQueue: Action received", action);
                    }),
                    Stream.filter(
                        (action): action is Extract<ChatInstanceAction, { _tag: "sendMessage" }> => {
                            return action._tag === "sendMessage";
                        }
                    ),
                    Stream.tap((action) => {
                        // Add user message to UI immediately
                        const userMessage: Message = {
                            id: crypto.randomUUID(),
                            text: action.text,
                            role: "user",
                            timestamp: Date.now(),
                            attachments: action.attachments
                        };
                        return addMessage(userMessage);
                    }),
                    Stream.map(
                        (action): ClientMessagePayload => {
                            return {
                                type: "userMessage" as const,
                                message: {
                                    text: action.text,
                                    attachments: action.attachments,
                                },
                            };
                        }
                    ),
                    Stream.map((payload) => {
                        return createUserMessage(payload.message.text, {
                            timestamp: new Date().toISOString(),
                            metadata: {
                                chatId: chatId, // Include chatId for server routing
                                sessionId: crypto.randomUUID()
                            } as any
                        });
                    }),
                    Stream.tap((message) => {
                        return Effect.logDebug(
                            `WebSocketManager: Sending message - ${message.text}`,
                        );
                    }),
                    Stream.runForEach((message) => {
                        return wsService.send(message);
                    })
                );
                yield* Effect.forkDaemon(outgoingEffect);
                yield* Effect.logInfo("WebSocketManager: Outgoing message handler forked.");

                const incomingStreamLogic = wsService.receive().pipe(
                    Stream.tap((msg) => {
                        return Effect.logDebug("WebSocketManager: Raw message received", msg);
                    }),
                    Stream.tap((event) => {
                        return Effect.logDebug("WebSocketManager: Received ProtocolMessage", event);
                    }),
                    Stream.runForEach((message: ProtocolMessage) => {
                        // Handle the ProtocolMessage based on its type
                        if (message.type === "CONNECTION" && message.action === "PING") {
                            return Effect.logDebug("Ping received from agent");
                        }

                        // Handle different message types
                        return Effect.gen(function* () {

                            switch (message.type) {
                                case "THINKING":
                                    yield* setTyping(message.isThinking);
                                    break;

                                case "LLM_STREAM":
                                    if (!message.isComplete && message.content) {
                                        const streamId = message.streamId || message.id || crypto.randomUUID();
                                        // FIXED: Just accumulate original text, don't compile individual chunks
                                        // Compiling individual chunks breaks markdown syntax (e.g., "##" alone becomes empty <h2>)
                                        yield* updateStreamingMessage(streamId, message.content, message.content); // Pass original chunk text for both params

                                    } else if (message.isComplete) {
                                        // Stream is complete, compile the accumulated markdown
                                        const streamId = message.streamId || message.id || crypto.randomUUID();
                                        const accumulatedText = streamingMessages.get(streamId);

                                        if (accumulatedText) {
                                            // NOW compile the complete accumulated markdown
                                            const mdxService = yield* MdxService;
                                            const compiledResult = yield* mdxService.compile(accumulatedText, {
                                                development: process.env.NODE_ENV === "development"
                                            }).pipe(
                                                Effect.catchAll((error) => {
                                                    return Effect.succeed({
                                                        compiledSource: accumulatedText, // Fallback to original text
                                                        frontmatter: {},
                                                        metadata: { mdxError: true }
                                                    });
                                                })
                                            );

                                            yield* Effect.sync(() =>
                                                setChatState((prev) => ({
                                                    ...prev,
                                                    messages: prev.messages.map(msg_item => {
                                                        if (msg_item.id !== streamId) return msg_item;

                                                        return {
                                                            ...msg_item,
                                                            text: accumulatedText, // Keep original text for fallback
                                                            metadata: {
                                                                ...msg_item.metadata,
                                                                streaming: false, // Mark as not streaming
                                                                mdx: {
                                                                    compiledSource: compiledResult.compiledSource,
                                                                    frontmatter: compiledResult.frontmatter,
                                                                    metadata: compiledResult.metadata
                                                                }
                                                            }
                                                        };
                                                    })
                                                }))
                                            );

                                            // Clean up our tracking map
                                            streamingMessages.delete(streamId);
                                        }
                                    }
                                    break;

                                case "LLM_RESPONSE":
                                case "ERROR":
                                case "WELCOME": {
                                    const uiMessage = yield* convertProtocolMessageToUIMessage(message);
                                    if (uiMessage) {
                                        yield* addMessage(uiMessage);
                                    }
                                    break;
                                }

                                case "ACK":
                                    yield* Effect.logDebug("Received acknowledgment:", message.message);
                                    break;

                                default:
                                    yield* Effect.logDebug("Unhandled message type:", message.type);
                            }
                        });
                    }),
                    Stream.catchAll((error) =>
                        Effect.gen(function* () {
                            yield* Effect.logWarning(
                                "WebSocketManager: Error in incoming stream",
                                error
                            );
                            yield* updateStatus("reconnecting", error.message);
                            return Stream.fail(error);
                        }),
                    ),
                    Stream.runDrain
                );
                yield* incomingStreamLogic;
            }).pipe(Effect.scoped);

            // Apply retry logic to the webSocketManagerCoreLogic
            yield* webSocketManagerCoreLogic.pipe(
                Effect.retry(
                    Schedule.intersect(
                        Schedule.exponential(INITIAL_RECONNECT_DELAY).pipe(
                            Schedule.jittered,
                        ),
                        Schedule.recurs(MAX_RECONNECT_ATTEMPTS),
                    ).pipe(
                        Schedule.tapOutput((output) => {
                            const attempt =
                                typeof output === "number" ? output + 1 : output[1] + 1;
                            return updateStatus(
                                "reconnecting",
                                `Connection attempt ${attempt} failed. Retrying...`,
                            );
                        }),
                    ),
                ),
                Effect.tapError((e) =>
                    updateStatus(
                        "error",
                        "Failed to connect after multiple attempts. Please check your connection or try again later.",
                    ).pipe(
                        Effect.flatMap(() =>
                            Effect.logError(
                                "WebSocketManager: Max retries reached. Final error:",
                                e.message
                            ),
                        ),
                    ),
                ),
            );

            // These lines run after the webSocketManagerCoreLogic (with retries) has completed or definitively failed.
            yield* Effect.logInfo(
                `Effect program for ${chatId} finished webSocketManager attempt.`,
            );

            yield* updateStatus("disconnected", "Connection closed.");
        }).pipe(
            Effect.catchAll((error: WebSocketError) => {
                console.error(
                    `Critical error in chat instance ${chatId} Effect program:`,
                    error.message,
                    error
                );
                setRuntimeError(error.message);
                setChatState((prev) => ({
                    ...prev,
                    status: "error",
                    error: error.message,
                }));
                return Effect.void;
            }),
        );

        const fiber = Effect.runFork(
            program.pipe(
                Effect.provide(webSocketLayer)
            ) as Effect.Effect<void, never, never>
        );

        return () => {
            Effect.runFork(Fiber.interrupt(fiber));
            setDispatch(
                () => () =>
                    console.warn("Dispatch action called after chat instance unmounted"),
            );
            setChatState((prev) => ({ ...prev, status: "disconnected" }));
        };
    }, [agentId, agentWsUrl, chatId]);

    return { chatState, runtimeError, dispatchAction: dispatch };
} 