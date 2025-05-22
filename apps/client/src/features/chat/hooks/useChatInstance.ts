import {
    Duration,
    Effect,
    Fiber,
    Layer,
    Option,
    Queue,
    Schedule,
    Stream
} from "effect";
import { useEffect, useMemo, useState } from "react";

import { type WebSocketError, WebSocketService } from "@/services/websocket/WebSocketService";
import type {
    AgentConfigData,
    AgentEvent,
    ChatAction,
    ChatState,
    ClientMessagePayload,
} from "./chatInstanceTypes";
import { AgentConfig } from "./chatInstanceTypes";

// Constants from design doc (can be moved to a config file or AgentConfig if needed)
const INITIAL_RECONNECT_DELAY = Duration.seconds(1); // Example: 1 second
const MAX_RECONNECT_ATTEMPTS = 5;

export function useChatInstance(
    chatId: string,
    agentConfigData: AgentConfigData,
): {
    chatState: ChatState;
    runtimeError: unknown | null;
    dispatchAction: (action: ChatAction) => void;
} {
    const [chatState, setChatState] = useState<ChatState>(() => ({
        chatId,
        messages: [],
        status: "initializing",
        agentName: agentConfigData.initialAgentName,
    }));

    const [runtimeError, setRuntimeError] = useState<unknown | null>(null);

    const [dispatch, setDispatch] = useState<(action: ChatAction) => void>(
        () => () =>
            console.warn(
                "Dispatch action called before Effect runtime initialized for chat instance",
            ),
    );

    const agentConfigLayer = useMemo(
        () => Layer.succeed(AgentConfig, agentConfigData),
        [agentConfigData],
    );

    useEffect(() => {
        console.log(
            `useChatInstance useEffect: Initializing for chatId: ${chatId}`,
        );
        // Scope will be managed by Effect.scoped within webSocketManager

        const program = Effect.gen(function* (_) {
            yield* _(
                Effect.logInfo(
                    `Effect program starting for ${chatId}, Agent: ${agentConfigData.agentId}`,
                ),
            );
            setRuntimeError(null);

            const inputQueue = yield* _(Queue.unbounded<ChatAction>());

            setDispatch(() => (action: ChatAction) => {
                Effect.runFork(Queue.offer(inputQueue, action));
            });

            const updateStatus = (status: ChatState["status"], error?: string) =>
                Effect.sync(() =>
                    setChatState((prev) => ({
                        ...prev,
                        status,
                        error: error ?? prev.error,
                    })),
                );

            const providedAgentConfig = yield* _(AgentConfig);

            const webSocketManagerCoreLogic = Effect.gen(function* (_) {
                yield* _(updateStatus("connecting"));
                yield* _(
                    Effect.logInfo(
                        `WebSocketManager: Attempting to connect to ${providedAgentConfig.agentWsUrl} for chatId: ${chatId}`,
                    ),
                );

                const wsUrl = `${providedAgentConfig.agentWsUrl}?chatId=${chatId}&agentId=${providedAgentConfig.agentId}`;
                const wsService = yield* _(WebSocketService);

                // Connect using our WebSocketService
                yield* _(wsService.connect(wsUrl));
                yield* _(Effect.logInfo("WebSocketManager: Connection established."));
                yield* _(updateStatus("connected"));

                const outgoingEffect = Stream.fromQueue(inputQueue).pipe(
                    Stream.tap((action) =>
                        Effect.logDebug("OutgoingQueue: Action received", action),
                    ),
                    Stream.filter(
                        (action): action is Extract<ChatAction, { _tag: "sendMessage" }> =>
                            action._tag === "sendMessage",
                    ),
                    Stream.map(
                        (action): ClientMessagePayload => ({
                            type: "userMessage",
                            message: { text: action.text },
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
                yield* _(Effect.forkDaemon(outgoingEffect));
                yield* _(
                    Effect.logInfo("WebSocketManager: Outgoing message handler forked."),
                );

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
                                let currentError = Option.fromNullable(prev.error);

                                switch (event.type) {
                                    case "newMessage":
                                        if (!prev.messages.find((m) => m.id === event.payload.id)) {
                                            newMessages = [...prev.messages, event.payload];
                                        }
                                        newStatus = "connected";
                                        currentError = Option.none();
                                        break;
                                    case "statusUpdate":
                                        newStatus = event.status;
                                        if (event.agentName) newAgentName = event.agentName;
                                        if (event.status === "error")
                                            currentError = Option.some("Agent reported an error");
                                        else if (event.status === "connected")
                                            currentError = Option.none();
                                        break;
                                    case "fullState":
                                        newMessages = event.payload.messages;
                                        newStatus = event.payload.status;
                                        newAgentName = event.payload.agentName;
                                        currentError = Option.fromNullable(event.payload.error);
                                        break;
                                    case "error":
                                        newStatus = "error";
                                        currentError = Option.some(event.message);
                                        console.error(
                                            `WebSocketManager: Agent error event received: ${event.message}`,
                                        );
                                        break;
                                }
                                return {
                                    ...prev,
                                    messages: newMessages,
                                    status: newStatus,
                                    agentName: newAgentName,
                                    error: Option.getOrElse(currentError, () => undefined),
                                };
                            });
                        });
                    }),
                    Stream.catchAll((error) =>
                        Effect.gen(function* (_) {
                            yield* _(
                                Effect.logWarning(
                                    "WebSocketManager: Error in incoming stream",
                                    error
                                ),
                            );
                            yield* _(updateStatus("reconnecting", error.message));
                            return Stream.fail(error);
                        }),
                    ),
                    Stream.runDrain
                );
                yield* _(incomingStreamLogic);
            }).pipe(Effect.scoped);

            // Apply retry logic to the webSocketManagerCoreLogic
            yield* _(
                webSocketManagerCoreLogic.pipe(
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
                ),
            );

            // These lines run after the webSocketManagerCoreLogic (with retries) has completed or definitively failed.
            yield* _(
                Effect.logInfo(
                    `Effect program for ${chatId} finished webSocketManager attempt.`,
                ),
            );

            const finalChatState = yield* _(Effect.sync(() => chatState));
            if (
                finalChatState.status !== "error" &&
                finalChatState.status !== "reconnecting"
            ) {
                yield* _(updateStatus("disconnected", "Connection closed."));
            }
        }).pipe(
            Effect.provide(agentConfigLayer),
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
    }, [agentConfigData, chatId, chatState, agentConfigLayer]);

    return { chatState, runtimeError, dispatchAction: dispatch };
}
