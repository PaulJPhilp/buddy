import {
    Duration,
    Effect,
    Fiber,
    Option,
    Queue,
    Schedule,
    Stream
} from "effect";
import { useEffect, useState } from "react";

import { type WebSocketError, WebSocketService } from "@/services/websocket/WebSocketService";
import type {
    AgentEvent,
    ChatAgentConfig,
    ChatInstanceAction,
    ChatInstanceHookState,
    ClientMessagePayload
} from "../features/chat/types";

// Constants from design doc (can be moved to a config file or AgentConfig if needed)
const INITIAL_RECONNECT_DELAY = Duration.seconds(1); // Example: 1 second
const MAX_RECONNECT_ATTEMPTS = 5;

export function useChatInstance(
    chatId: string,
    agentConfigData: ChatAgentConfig,
): {
    chatState: ChatInstanceHookState;
    runtimeError: unknown | null;
    dispatchAction: (action: ChatInstanceAction) => void;
} {
    const [chatState, setChatState] = useState<ChatInstanceHookState>(() => ({
        chatId,
        messages: [],
        status: "initializing",
        agentName: agentConfigData.initialAgentName,
        isTyping: false,
    }));

    const [runtimeError, setRuntimeError] = useState<unknown | null>(null);

    const [dispatch, setDispatch] = useState<(action: ChatInstanceAction) => void>(
        () => () =>
            console.warn(
                "Dispatch action called before Effect runtime initialized for chat instance",
            ),
    );

    useEffect(() => {
        console.log(
            `useChatInstance useEffect: Initializing for chatId: ${chatId}`,
        );
        // Scope will be managed by Effect.scoped within webSocketManager

        const program = Effect.gen(function* () {
            yield* Effect.logInfo(
                `Effect program starting for ${chatId}, Agent: ${agentConfigData.agentId}`,
            );
            setRuntimeError(null);

            const inputQueue = yield* Queue.unbounded<ChatInstanceAction>();

            setDispatch(() => (action: ChatInstanceAction) => {
                Effect.runFork(Queue.offer(inputQueue, action));
            });

            const updateStatus = (status: ChatInstanceHookState["status"], error?: string) =>
                Effect.sync(() =>
                    setChatState((prev) => ({
                        ...prev,
                        status,
                        error: error ?? prev.error,
                    })),
                );

            const providedAgentConfig = agentConfigData;

            const webSocketManagerCoreLogic = Effect.gen(function* () {
                yield* updateStatus("connecting");
                yield* Effect.logInfo(
                    `WebSocketManager: Attempting to connect to ${providedAgentConfig.agentWsUrl} for chatId: ${chatId}`,
                );

                const wsUrl = `${providedAgentConfig.agentWsUrl}?chatId=${chatId}&agentId=${providedAgentConfig.agentId}`;
                const wsService = yield* WebSocketService;

                // Connect using our WebSocketService
                yield* wsService.connect(wsUrl);
                yield* Effect.logInfo("WebSocketManager: Connection established.");
                yield* updateStatus("connected");

                const outgoingEffect = Stream.fromQueue(inputQueue).pipe(
                    Stream.tap((action) =>
                        Effect.logDebug("OutgoingQueue: Action received", action),
                    ),
                    Stream.filter(
                        (action): action is Extract<ChatInstanceAction, { _tag: "sendMessage" }> =>
                            action._tag === "sendMessage",
                    ),
                    Stream.map(
                        (action): ClientMessagePayload => ({
                            type: "userMessage",
                            message: {
                                text: action.text,
                                attachments: action.attachments,
                            },
                        }),
                    ),
                    Stream.map((payload) => ({
                        text: JSON.stringify(payload),
                        timestamp: new Date().toISOString()
                    })),
                    Stream.tap((message) =>
                        Effect.logDebug(
                            `WebSocketManager: Sending message - ${message.text}`,
                        ),
                    ),
                    Stream.runForEach((message) => wsService.send(message))
                );
                yield* Effect.forkDaemon(outgoingEffect);
                yield* Effect.logInfo("WebSocketManager: Outgoing message handler forked.");

                const incomingStreamLogic = wsService.receive().pipe(
                    Stream.tap((msg) =>
                        Effect.logDebug("WebSocketManager: Raw message received", msg),
                    ),
                    Stream.map((msg) => {
                        try {
                            const event = JSON.parse(msg.text) as AgentEvent;
                            return event;
                        } catch (e) {
                            console.error(
                                "WebSocketManager: Failed to parse incoming JSON",
                                e,
                                msg,
                            );
                            throw new Error("Invalid JSON received");
                        }
                    }),
                    Stream.tap((event) =>
                        Effect.logDebug("WebSocketManager: Parsed AgentEvent", event),
                    ),
                    Stream.runForEach((event: AgentEvent) => {
                        if (event.type === "pong") {
                            return Effect.logDebug("Pong received from agent");
                        }
                        return Effect.sync(() => {
                            setChatState((prev) => {
                                let newMessages = prev.messages;
                                let newStatus = prev.status;
                                let newAgentName = prev.agentName;
                                let newIsTyping = prev.isTyping;
                                let currentError = Option.fromNullable(prev.error);

                                switch (event.type) {
                                    case "newMessage":
                                        if (!prev.messages.find((m) => m.id === event.payload.id)) {
                                            newMessages = [...prev.messages, event.payload];
                                        }
                                        newStatus = "connected";
                                        newIsTyping = false;
                                        currentError = Option.none();
                                        break;
                                    case "statusUpdate":
                                        newStatus = event.status;
                                        if (event.agentName) newAgentName = event.agentName;
                                        if (event.status === "error")
                                            currentError = Option.some("Agent reported an error status.");
                                        else if (event.status === "connected")
                                            currentError = Option.none();
                                        break;
                                    case "fullState":
                                        newMessages = event.payload.messages;
                                        newStatus = event.payload.status;
                                        newAgentName = event.payload.agentName;
                                        newIsTyping = event.payload.isTyping ?? false;
                                        currentError = Option.fromNullable(event.payload.error);
                                        break;
                                    case "error":
                                        newStatus = "error";
                                        newIsTyping = false;
                                        currentError = Option.some(event.message);
                                        console.error(
                                            `WebSocketManager: Agent error event received: ${event.message}`,
                                        );
                                        break;
                                    case "agentTyping":
                                        newIsTyping = event.isTyping;
                                        break;
                                }
                                return {
                                    ...prev,
                                    messages: newMessages,
                                    status: newStatus,
                                    agentName: newAgentName,
                                    isTyping: newIsTyping,
                                    error: Option.getOrElse(currentError, () => undefined),
                                };
                            });
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

            const finalChatState = yield* Effect.sync(() => chatState);
            if (
                finalChatState.status !== "error" &&
                finalChatState.status !== "reconnecting"
            ) {
                yield* updateStatus("disconnected", "Connection closed.");
            }
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

        const fiber = Effect.runFork(program as Effect.Effect<void, never, never>);
        console.log(
            `useChatInstance useEffect: Forked Effect program for chatId: ${chatId}`,
        );

        return () => {
            console.log(
                `useChatInstance cleanup: Interrupting Effect program for chatId: ${chatId}`,
            );
            Effect.runFork(
                Fiber.interrupt(fiber).pipe(
                    Effect.tap(() =>
                        console.log(
                            `useChatInstance cleanup: Fiber for ${chatId} interrupted.`,
                        ),
                    ),
                ),
            );
            setDispatch(
                () => () =>
                    console.warn("Dispatch action called after chat instance unmounted"),
            );
            setChatState((prev) => ({ ...prev, status: "disconnected" }));
        };
    }, [agentConfigData, chatId, chatState]);

    return { chatState, runtimeError, dispatchAction: dispatch };
} 