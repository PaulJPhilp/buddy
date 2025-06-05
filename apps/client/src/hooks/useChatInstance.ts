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

import {
    AgentRuntimeError,
    AgentRuntimeService,
    AgentSession
} from "@/services/agent-runtime/AgentRuntimeService";
import { MdxService, type MdxServiceApi } from "@/services/mdx";
import { ProtocolMessage, createUserMessage } from "@buddy/protocol";
import type {
    ChatAgentConfig,
    ChatInstanceAction,
    ChatInstanceHookState,
    Message,
} from "../features/chat/types";

// Constants from design doc (can be moved to a config file or AgentConfig if needed)
const INITIAL_RECONNECT_DELAY = Duration.seconds(1); // Example: 1 second
const MAX_RECONNECT_ATTEMPTS = 5;

// Helper function to convert a ProtocolMessage to a UI Message, compiling MDX
// for LLM_RESPONSE and handling streaming, error, and welcome messages.
function convertProtocolMessageToUIMessage(
    protocolMessage: ProtocolMessage
): Effect.Effect<Message | null, never, MdxServiceApi> {
    return Effect.gen(function* () {
        const mdxService = yield* MdxService;
        switch (protocolMessage.type) {
            case "LLM_RESPONSE": {
                const compiledResult = yield* mdxService
                    .compile(protocolMessage.content || "", {
                        development: process.env.NODE_ENV === "development",
                    })
                    .pipe(
                        Effect.catchAll(() =>
                            Effect.succeed({
                                compiledSource: "",
                                frontmatter: {},
                                metadata: {},
                            })
                        )
                    );
                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.content || "",
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: {
                        mdx: compiledResult,
                        ...protocolMessage.metadata,
                    },
                };
            }
            case "LLM_STREAM": {
                if (protocolMessage.isComplete) return null;
                return {
                    id: protocolMessage.streamId || protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.content || "",
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: {
                        ...protocolMessage.metadata,
                        streaming: true,
                    },
                };
            }
            case "ERROR":
                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: `Error: ${protocolMessage.message}`,
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: { error: true, code: protocolMessage.code },
                };
            case "WELCOME":
                return {
                    id: protocolMessage.id || crypto.randomUUID(),
                    text: protocolMessage.message,
                    role: "assistant" as const,
                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                    metadata: { welcome: true, serverInfo: protocolMessage.serverInfo },
                };
            default:
                return null;
        }
    });
}

export function useChatInstance(
    chatId: string,
    agentConfigData: ChatAgentConfig,
    injectedLayer?: Layer.Layer<any, any, any>
): {
    chatState: ChatInstanceHookState;
    runtimeError: AgentRuntimeError | null;
    dispatchAction: (action: ChatInstanceAction) => void;
} {
    const agentId = useMemo(() => agentConfigData.agentId, [agentConfigData.agentId]);
    const initialAgentName = useMemo(() => agentConfigData.initialAgentName, [agentConfigData.initialAgentName]);

    const [chatState, setChatState] = useState<ChatInstanceHookState>(() => ({
        chatId,
        messages: [],
        status: "initializing",
        agentName: initialAgentName,
        isTyping: false,
    }));

    const [runtimeError, setRuntimeError] = useState<AgentRuntimeError | null>(null);
    const [dispatch, setDispatch] = useState<(action: ChatInstanceAction) => void>(
        () => () => console.warn("Dispatch called before Effect runtime initialized")
    );

    const serviceLayer = useMemo(() =>
        injectedLayer ?? Layer.merge(AgentRuntimeService.Default, MdxService.Default),
        [injectedLayer]
    );

    useEffect(() => {
        const program = Effect.gen(function* () {
            const agentRuntime = yield* AgentRuntimeService;
            yield* Effect.logInfo(`[useChatInstance] Program starting for ${chatId}, Agent: ${agentId}`);
            setRuntimeError(null);

            const inputQueue = yield* Queue.unbounded<ChatInstanceAction>();
            setDispatch(() => (action: ChatInstanceAction) => Effect.runFork(Queue.offer(inputQueue, action)));

            const streamingMessages = new Map<string, string>();

            const updateChatState = (updater: (prev: ChatInstanceHookState) => ChatInstanceHookState) =>
                Effect.sync(() => setChatState(updater));

            const addMessageToState = (message: Message) =>
                updateChatState((prev) => ({ ...prev, messages: [...prev.messages, message] }));

            const updateStreamingMessageInState = (streamId: string, chunk: string) =>
                updateChatState((prev) => {
                    const currentAccumulatedText = streamingMessages.get(streamId) || "";
                    const newAccumulatedText = currentAccumulatedText + chunk;
                    streamingMessages.set(streamId, newAccumulatedText);

                    const existingMessageIndex = prev.messages.findIndex(msg => msg.id === streamId);
                    if (existingMessageIndex >= 0) {
                        const updatedMessages = [...prev.messages];
                        updatedMessages[existingMessageIndex] = {
                            ...updatedMessages[existingMessageIndex],
                            text: newAccumulatedText,
                            metadata: { ...(updatedMessages[existingMessageIndex].metadata || {}), streaming: true },
                        };
                        return { ...prev, messages: updatedMessages };
                    }
                    const newMessage: Message = {
                        id: streamId, text: newAccumulatedText, role: "assistant", timestamp: Date.now(), metadata: { streaming: true }
                    };
                    return { ...prev, messages: [...prev.messages, newMessage] };
                });

            const finalizeStreamingMessageInState = (streamId: string) => Effect.gen(function* () {
                const accumulatedText = streamingMessages.get(streamId);
                if (!accumulatedText) return;

                const mdxService = yield* MdxService;
                const compiledResult = yield* mdxService.compile(accumulatedText, { development: process.env.NODE_ENV === "development" })
                    .pipe(Effect.catchAll(() => Effect.succeed({ compiledSource: accumulatedText, frontmatter: {}, metadata: { mdxError: true } })));

                yield* updateChatState((prev) => ({
                    ...prev,
                    messages: prev.messages.map(msg => msg.id === streamId ? {
                        ...msg, text: accumulatedText, metadata: { ...msg.metadata, streaming: false, mdx: compiledResult }
                    } : msg)
                }));
                streamingMessages.delete(streamId);
            });

            const setTypingInState = (isTyping: boolean) =>
                updateChatState((prev) => ({ ...prev, isTyping }));

            yield* Effect.logInfo(`[useChatInstance] Attempting to establish session for ${chatId}, agent ${agentId}`);

            const sessionEffect = agentRuntime.establishSession(agentId, chatId).pipe(
                Effect.retry(
                    Schedule.intersect(
                        Schedule.exponential(INITIAL_RECONNECT_DELAY).pipe(Schedule.jittered),
                        Schedule.recurs(MAX_RECONNECT_ATTEMPTS)
                    ).pipe(
                        Schedule.tapOutput((details) => {
                            const attempt = typeof details === "number" ? details + 1 : details[1] + 1;
                            return updateChatState(prev => ({ ...prev, status: "reconnecting", error: `Connection attempt ${attempt} failed. Retrying...` }));
                        })
                    )
                )
            );

            const agentSession: AgentSession = yield* sessionEffect;

            yield* Effect.logInfo(`[useChatInstance] Session established: ${agentSession.id}, URL: ${agentSession.url}`);

            yield* Effect.forkDaemon(agentSession.status$.pipe(
                Stream.runForEach((status) => Effect.sync(() => {
                    switch (status._tag) {
                        case "Initializing":
                            setChatState(prev => ({ ...prev, status: "initializing" }));
                            break;
                        case "Connecting":
                            setChatState(prev => ({ ...prev, status: "connecting", error: `Attempt ${status.attempt} to ${status.url}` }));
                            break;
                        case "Connected":
                            setChatState(prev => ({ ...prev, status: "connected", error: undefined }));
                            break;
                        case "Disconnected":
                            setChatState(prev => ({ ...prev, status: "disconnected", error: status.reason ?? "Connection closed" }));
                            break;
                        case "Error":
                            setChatState(prev => ({ ...prev, status: "error", error: status.error.message }));
                            setRuntimeError(status.error);
                            break;
                    }
                }))
            ));

            yield* Effect.forkDaemon(Stream.fromQueue(inputQueue).pipe(
                Stream.tap(action => Effect.runFork(Effect.logDebug("[useChatInstance] Action for outgoing", action))),
                Stream.filter((action): action is Extract<ChatInstanceAction, { _tag: "sendMessage" }> => action._tag === "sendMessage"),
                Stream.tap(action => Effect.runFork(
                    Effect.gen(function* () {
                        const userUIMessage: Message = {
                            id: crypto.randomUUID(), text: action.text, role: "user", timestamp: Date.now(), attachments: action.attachments
                        };
                        return yield* addMessageToState(userUIMessage);
                    })
                )),
                Stream.map(action => createUserMessage(action.text, {
                    timestamp: new Date().toISOString(),
                    metadata: {
                        chatId,
                        sessionId: agentSession.id,
                        attachments: action.attachments?.map(att => att.name)
                    }
                })),
                Stream.tap(message => Effect.runFork(Effect.logDebug(`[useChatInstance] Sending protocol message for ${chatId}`, message))),
                Stream.runForEach(message => agentSession.send(message).pipe(
                    Effect.catchAll(err => {
                        Effect.logError(`[useChatInstance] Failed to send message for ${chatId}`, err);
                        return updateChatState(prev => ({ ...prev, error: `Failed to send: ${err.message}` }));
                    })
                ))
            ));

            yield* Effect.forkDaemon(agentSession.incomingMessages$.pipe(
                Stream.tap(pm => Effect.runFork(Effect.logDebug(`[useChatInstance] Raw incoming message for ${chatId}`, pm))),
                Stream.runForEach((protocolMessage: ProtocolMessage) => Effect.gen(function* () {
                    switch (protocolMessage.type) {
                        case "THINKING":
                            yield* setTypingInState(protocolMessage.isThinking);
                            break;
                        case "LLM_STREAM":
                            if (!protocolMessage.isComplete && protocolMessage.content) {
                                const streamId = protocolMessage.streamId || protocolMessage.id || crypto.randomUUID();
                                yield* updateStreamingMessageInState(streamId, protocolMessage.content);
                            } else if (protocolMessage.isComplete) {
                                const streamId = protocolMessage.streamId || protocolMessage.id || crypto.randomUUID();
                                yield* finalizeStreamingMessageInState(streamId);
                            }
                            break;
                        case "CONNECTION":
                            if (protocolMessage.connectionState === "RECONNECTING") {
                                yield* updateChatState(prev => ({ ...prev, status: "reconnecting", error: "Server is reconnecting..." }));
                            } else if (protocolMessage.connectionState === "CONNECTED") {
                                yield* updateChatState(prev => ({ ...prev, status: "connected", error: undefined }));
                            }
                            break;
                        default: {
                            const uiMessage = yield* convertProtocolMessageToUIMessage(protocolMessage);
                            if (uiMessage) yield* addMessageToState(uiMessage);
                            break;
                        }
                    }
                }).pipe(Effect.catchAll(e => Effect.logError("Error processing incoming message", e))))
            ));

            yield* Effect.never;

        }).pipe(
            Effect.scoped,
            Effect.catchAll((error: AgentRuntimeError) => Effect.gen(function* () {
                yield* Effect.logError(`[useChatInstance] Unrecoverable error in session management for ${chatId}`, error);
                setRuntimeError(error);
                yield* Effect.sync(() => setChatState(prev => ({ ...prev, status: "error", error: error.message })));
                return yield* Effect.never;
            })),

        );

        const fiber = Effect.runFork(program.pipe(
            Effect.provide(serviceLayer)
        ) as Effect.Effect<void, never, never>);

        return () => {
            Effect.runFork(
                Effect.logInfo(`[useChatInstance] Cleaning up for ${chatId}, interrupting fiber ${fiber.id().id}`)
                    .pipe(Effect.andThen(Fiber.interrupt(fiber)))
            );
            setDispatch(() => () => console.warn("Dispatch called after chat instance unmounted"));
            setChatState(prev => ({ ...prev, status: "disconnected" }));
        };
    }, [agentId, chatId, serviceLayer]);

    return { chatState, runtimeError, dispatchAction: dispatch };
} 