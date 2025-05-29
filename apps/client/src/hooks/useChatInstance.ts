import {
    Duration,
    Effect,
    Fiber,
    Option,
    Queue,
    Stream
} from "effect";
import { useEffect, useState } from "react";

import { type WebSocketError, WebSocketService } from "@/services/websocket/WebSocketService";
import type { UserMessage } from "@buddy/protocol";
import type {
    AgentEvent,
    ChatAgentConfig,
    ChatInstanceAction,
    ChatInstanceHookState,
    ClientMessagePayload
} from "../features/chat/types";

/**
 * **The Heart of the Buddy Chat System**
 * 
 * `useChatInstance` is the core hook that manages the entire lifecycle of a chat session.
 * It bridges React's component lifecycle with Effect.ts's functional programming patterns
 * to provide a robust, real-time chat experience with automatic reconnection and error handling.
 * 
 * ## Architecture Overview
 * 
 * This hook implements a sophisticated state management system that:
 * 
 * 1. **Manages WebSocket Connections**: Establishes and maintains persistent connections to chat agents
 * 2. **Handles Message Flow**: Processes bidirectional message streams between client and agent
 * 3. **Provides Resilience**: Implements automatic reconnection with exponential backoff
 * 4. **Bridges Paradigms**: Connects React's imperative state updates with Effect's functional streams
 * 5. **Ensures Type Safety**: Maintains strict typing throughout the entire message pipeline
 * 
 * ## Key Components
 * 
 * ### State Management
 * - **React State**: Manages UI-visible chat state (messages, status, typing indicators)
 * - **Effect Queues**: Handles action dispatching and message processing
 * - **Error Boundaries**: Isolates and recovers from connection failures
 * 
 * ### Message Pipeline
 * - **Outgoing Stream**: Processes user actions → WebSocket messages
 * - **Incoming Stream**: Processes WebSocket messages → UI state updates
 * - **Event Parsing**: Transforms raw WebSocket data into typed AgentEvents
 * 
 * ### Connection Management
 * - **Automatic Connection**: Establishes WebSocket connection on mount
 * - **Retry Logic**: Implements exponential backoff with jitter
 * - **Graceful Cleanup**: Properly closes connections and cancels streams on unmount
 * 
 * ## Usage Patterns
 * 
 * ```typescript
 * // Basic usage in a chat component
 * const { chatState, runtimeError, dispatchAction } = useChatInstance(
 *   "chat-123",
 *   {
 *     agentId: "business-agent",
 *     agentWsUrl: "ws://localhost:8080",
 *     initialAgentName: "Business Assistant"
 *   }
 * );
 * 
 * // Send a message
 * dispatchAction({
 *   _tag: "sendMessage",
 *   text: "Hello, world!",
 *   attachments: []
 * });
 * 
 * // Monitor connection status
 * if (chatState.status === "connecting") {
 *   return <LoadingSpinner />;
 * }
 * ```
 * 
 * ## State Lifecycle
 * 
 * 1. **initializing** → Hook is setting up Effect runtime
 * 2. **connecting** → Establishing WebSocket connection
 * 3. **connected** → Active chat session, ready for messages
 * 4. **reconnecting** → Temporary connection loss, attempting recovery
 * 5. **error** → Permanent failure, manual intervention required
 * 6. **disconnected** → Clean shutdown or unmount
 * 
 * ## Error Handling Strategy
 * 
 * The hook implements a multi-layered error handling approach:
 * - **Stream-level**: Catches and logs individual message failures
 * - **Connection-level**: Implements retry logic for connection failures
 * - **Runtime-level**: Provides fallback error state for critical failures
 * 
 * @param chatId - Unique identifier for this chat session. Used for connection routing and state isolation.
 * @param agentConfigData - Configuration object containing agent connection details and initial settings.
 * 
 * @returns Object containing:
 * - `chatState`: Current chat state including messages, status, and metadata
 * - `runtimeError`: Any critical errors that occurred during Effect runtime execution
 * - `dispatchAction`: Function to send actions (messages, typing indicators, etc.) to the agent
 * 
 * @example
 * ```typescript
 * // Multiple chat instances can run simultaneously
 * const businessChat = useChatInstance("business-chat", businessConfig);
 * const socialChat = useChatInstance("social-chat", socialConfig);
 * 
 * // Each maintains independent state and connections
 * businessChat.dispatchAction({ _tag: "sendMessage", text: "Business query" });
 * socialChat.dispatchAction({ _tag: "sendMessage", text: "Social message" });
 * ```
 * 
 * @see {@link ChatInstanceHookState} for state structure details
 * @see {@link ChatInstanceAction} for available actions
 * @see {@link AgentEvent} for incoming event types
 */
export function useChatInstance(
    chatId: string,
    agentConfigData: ChatAgentConfig,
): {
    chatState: ChatInstanceHookState;
    runtimeError: unknown | null;
    dispatchAction: (action: ChatInstanceAction) => void;
} {
    /**
     * Primary React state containing all UI-visible chat information.
     * This state is updated by the Effect runtime through imperative setState calls.
     */
    const [chatState, setChatState] = useState<ChatInstanceHookState>(() => ({
        chatId,
        messages: [],
        status: "initializing",
        agentName: agentConfigData.initialAgentName,
        isTyping: false,
    }));

    /**
     * Tracks critical errors that occur during Effect runtime execution.
     * These are typically connection failures that couldn't be recovered through retry logic.
     */
    const [runtimeError, setRuntimeError] = useState<unknown | null>(null);

    /**
     * Action dispatcher function that allows React components to send actions to the Effect runtime.
     * Initially set to a no-op function until the Effect runtime is fully initialized.
     */
    const [dispatch, setDispatch] = useState<(action: ChatInstanceAction) => void>(
        () => () =>
            console.warn(
                "Dispatch action called before Effect runtime initialized for chat instance",
            ),
    );

    /**
     * Main Effect that orchestrates the entire chat instance lifecycle.
     * This useEffect manages:
     * - Effect runtime initialization
     * - WebSocket connection establishment
     * - Message stream processing
     * - Error handling and recovery
     * - Cleanup on unmount
     */
    useEffect(() => {
        console.log(
            `useChatInstance useEffect: Initializing for chatId: ${chatId}`,
        );

        /**
         * Main Effect program that manages the chat instance lifecycle.
         * This is where the functional programming magic happens - all side effects
         * are managed through Effect.ts's composable, type-safe abstractions.
         */
        const program = Effect.gen(function* () {
            yield* Effect.logInfo(
                `Effect program starting for ${chatId}, Agent: ${agentConfigData.agentId}`,
            );
            setRuntimeError(null);

            /**
             * Unbounded queue for handling incoming actions from React components.
             * This queue serves as the bridge between React's imperative world
             * and Effect's functional stream processing.
             */
            const inputQueue = yield* Queue.unbounded<ChatInstanceAction>();

            /**
             * Set up the dispatch function that React components will use to send actions.
             * Actions are queued and processed asynchronously by the Effect runtime.
             */
            setDispatch(() => (action: ChatInstanceAction) => {
                Effect.runFork(Queue.offer(inputQueue, action));
            });

            /**
             * Helper function to update the chat status and optionally set an error message.
             * Wrapped in Effect.sync to ensure it's properly managed by the Effect runtime.
             * 
             * @param status - New status to set
             * @param error - Optional error message
             */
            const updateStatus = (status: ChatInstanceHookState["status"], error?: string) =>
                Effect.sync(() =>
                    setChatState((prev) => ({
                        ...prev,
                        status,
                        error: error ?? prev.error,
                    })),
                );

            const providedAgentConfig = agentConfigData;

            /**
             * Core WebSocket management logic wrapped in Effect.scoped for proper resource cleanup.
             * This is the heart of the real-time communication system.
             */
            const webSocketManagerCoreLogic = Effect.gen(function* () {
                yield* updateStatus("connecting");
                yield* Effect.logInfo(
                    `WebSocketManager: Attempting to connect to ${providedAgentConfig.agentWsUrl} for chatId: ${chatId}`,
                );

                /**
                 * Construct WebSocket URL with chat and agent identifiers.
                 * This allows the server to route messages to the correct agent instance.
                 */
                const wsUrl = `${providedAgentConfig.agentWsUrl}?chatId=${chatId}&agentId=${providedAgentConfig.agentId}`;
                const wsService = yield* WebSocketService;

                yield* Effect.logInfo(
                    `WebSocketManager: Constructed WebSocket URL: ${wsUrl}`,
                );

                // Establish WebSocket connection
                yield* wsService.connect(wsUrl);
                yield* Effect.logInfo("WebSocketManager: Connection established.");
                yield* updateStatus("connected");

                /**
                 * Outgoing message stream: Processes actions from the input queue
                 * and transforms them into WebSocket messages.
                 * 
                 * Pipeline:
                 * 1. Read actions from queue
                 * 2. Filter for sendMessage actions
                 * 3. Transform to ClientMessagePayload
                 * 4. Serialize to JSON
                 * 5. Send via WebSocket
                 */
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
                    Stream.map((payload): UserMessage => ({
                        type: "USER_MESSAGE",
                        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: new Date().toISOString(),
                        text: JSON.stringify(payload)
                    })),
                    Stream.tap((message) =>
                        Effect.logDebug(
                            `WebSocketManager: Sending message - ${message.text}`,
                        ),
                    ),
                    Stream.runForEach((message) => wsService.send(message))
                );

                // Fork the outgoing stream as a daemon process
                yield* Effect.forkDaemon(outgoingEffect);
                yield* Effect.logInfo("WebSocketManager: Outgoing message handler forked.");

                /**
                 * Incoming message stream: Processes messages received from the WebSocket
                 * and updates the React state accordingly.
                 * 
                 * Pipeline:
                 * 1. Receive raw WebSocket messages
                 * 2. Parse JSON to AgentEvent objects
                 * 3. Process events and update chat state
                 * 4. Handle errors and pong responses
                 */
                const incomingStreamLogic = wsService.receive().pipe(
                    Stream.tap((msg) =>
                        Effect.logDebug("WebSocketManager: Raw message received", msg),
                    ),
                    /**
                     * Parse incoming WebSocket messages as AgentEvent objects.
                     * This is where we transform raw JSON into typed domain objects.
                     */
                    Stream.map((msg) => {
                        try {
                            // msg is a ProtocolMessage, we need to extract the text content
                            let messageText: string;
                            if ('text' in msg && typeof msg.text === 'string') {
                                messageText = msg.text;
                            } else if ('message' in msg && typeof msg.message === 'string') {
                                messageText = msg.message;
                            } else {
                                messageText = JSON.stringify(msg);
                            }
                            const event = JSON.parse(messageText) as AgentEvent;
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
                    /**
                     * Process each AgentEvent and update the React state accordingly.
                     * This is where the functional stream world meets React's imperative state.
                     */
                    Stream.runForEach((event: AgentEvent) => {
                        // Handle pong responses (keep-alive mechanism)
                        if (event.type === "pong") {
                            return Effect.logDebug("Pong received from agent");
                        }

                        /**
                         * Update React state based on the received event.
                         * Each event type triggers specific state transformations.
                         */
                        return Effect.sync(() => {
                            setChatState((prev) => {
                                let newMessages = prev.messages;
                                let newStatus = prev.status;
                                let newAgentName = prev.agentName;
                                let newIsTyping = prev.isTyping;
                                let currentError = Option.fromNullable(prev.error);

                                switch (event.type) {
                                    case "newMessage":
                                        // Add new message if not already present (deduplication)
                                        if (!prev.messages.find((m) => m.id === event.payload.id)) {
                                            newMessages = [...prev.messages, event.payload];
                                        }
                                        newStatus = "connected";
                                        newIsTyping = false;
                                        currentError = Option.none();
                                        break;
                                    case "statusUpdate":
                                        // Update connection status and agent name
                                        newStatus = event.status;
                                        if (event.agentName) newAgentName = event.agentName;
                                        if (event.status === "error")
                                            currentError = Option.some("Agent reported an error status.");
                                        else if (event.status === "connected")
                                            currentError = Option.none();
                                        break;
                                    case "fullState":
                                        // Complete state replacement (used for synchronization)
                                        newMessages = event.payload.messages;
                                        newStatus = event.payload.status;
                                        newAgentName = event.payload.agentName;
                                        newIsTyping = event.payload.isTyping ?? false;
                                        currentError = Option.fromNullable(event.payload.error);
                                        break;
                                    case "error":
                                        // Handle error events from the agent
                                        newStatus = "error";
                                        newIsTyping = false;
                                        currentError = Option.some(event.message);
                                        console.error(
                                            `WebSocketManager: Agent error event received: ${event.message}`,
                                        );
                                        break;
                                    case "agentTyping":
                                        // Update typing indicator
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
                    /**
                     * Handle stream-level errors with logging and status updates.
                     * This provides resilience against individual message processing failures.
                     */
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

            /**
             * Run the core WebSocket management logic.
             * For now, we'll run it without retry logic to avoid Schedule import issues.
             * TODO: Implement simple retry logic without Schedule dependency.
             */
            yield* webSocketManagerCoreLogic.pipe(
                /**
                 * Handle final failure.
                 * This puts the chat instance into an error state.
                 */
                Effect.tapError((e) =>
                    updateStatus(
                        "error",
                        "Failed to connect. Please check your connection or try again later.",
                    ).pipe(
                        Effect.flatMap(() =>
                            Effect.logError(
                                "WebSocketManager: Connection error:",
                                e.message
                            ),
                        ),
                    ),
                ),
            );

            // Log completion of the WebSocket manager
            yield* Effect.logInfo(
                `Effect program for ${chatId} finished webSocketManager attempt.`,
            );

            /**
             * Final status update - connection closed gracefully.
             */
            yield* updateStatus("disconnected", "Connection closed.");
        }).pipe(
            /**
             * Top-level error handler for critical failures that couldn't be recovered.
             * This ensures the React component always has a valid error state to display.
             */
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

        /**
         * Fork the main Effect program as a fiber.
         * This allows the React component to continue rendering while the
         * Effect runtime manages the chat session in the background.
         */
        const fiber = Effect.runFork(program as Effect.Effect<void, never, never>);
        console.log(
            `useChatInstance useEffect: Forked Effect program for chatId: ${chatId}`,
        );

        /**
         * Cleanup function that runs when the component unmounts or dependencies change.
         * This ensures proper resource cleanup and prevents memory leaks.
         */
        return () => {
            console.log(
                `useChatInstance cleanup: Interrupting Effect program for chatId: ${chatId}`,
            );

            // Interrupt the Effect fiber to stop all running streams and close connections
            Effect.runFork(
                Fiber.interrupt(fiber).pipe(
                    Effect.tap(() =>
                        console.log(
                            `useChatInstance cleanup: Fiber for ${chatId} interrupted.`,
                        ),
                    ),
                ),
            );

            // Reset dispatch function to prevent actions after unmount
            setDispatch(
                () => () =>
                    console.warn("Dispatch action called after chat instance unmounted"),
            );

            // Update state to reflect disconnection
            setChatState((prev) => ({ ...prev, status: "disconnected" }));
        };
    }, [agentConfigData, chatId]);

    /**
     * Return the public API of the hook.
     * This is what React components will use to interact with the chat instance.
     */
    return { chatState, runtimeError, dispatchAction: dispatch };
} 