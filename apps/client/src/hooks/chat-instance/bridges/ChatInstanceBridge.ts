/**
 * @file ChatInstanceBridge - Coordinates between Effect.js services and xState stores
 * @module hooks/chat-instance/bridges/ChatInstanceBridge
 */

import type { AgentSession } from "@/services/chat-runtime/ChatRuntimeService";
import type { ProtocolMessage } from "@buddy/protocol";
import { Effect, Fiber, Stream } from "effect";

// Import services
import {
    AgentCommunicationService,
    ChatInstanceService,
    ConnectionManagementService,
} from "@/services/chat-instance";

// Import stores
import {
    agentActions,
    agentStore,
    chatInstanceActions,
    connectionActions,
    connectionStore,
} from "../stores";

// Import types
import type { ChatInstanceAction } from "@/features/chat/types";

export interface ChatInstanceBridgeApi {
    readonly initialize: (
        chatId: string,
        agentId: string,
        initialAgentName: string
    ) => Effect.Effect<void, never>;

    readonly processAction: (action: ChatInstanceAction) => Effect.Effect<void, never>;

    readonly startMessageProcessing: (session: AgentSession) => Effect.Effect<Fiber.RuntimeFiber<never, never>, never>;

    readonly startStatusMonitoring: (session: AgentSession) => Effect.Effect<Fiber.RuntimeFiber<never, never>, never>;

    readonly cleanup: () => Effect.Effect<void, never>;
}

/**
 * ChatInstanceBridge - Coordinates between Effect.js services and xState stores
 */
export class ChatInstanceBridge extends Effect.Service<ChatInstanceBridgeApi>()(
    "ChatInstanceBridge",
    {
        effect: Effect.gen(function* () {
            const chatInstanceService = yield* ChatInstanceService;
            const agentCommunicationService = yield* AgentCommunicationService;
            const connectionManagementService = yield* ConnectionManagementService;

            // Store for active session and fibers
            let activeSession: AgentSession | null = null;
            let activeFibers: Fiber.RuntimeFiber<any, any>[] = [];

            const initialize = (
                chatId: string,
                agentId: string,
                initialAgentName: string
            ): Effect.Effect<void, never> =>
                Effect.gen(function* () {
                    yield* Effect.logInfo(
                        `[ChatInstanceBridge] Initializing for chatId: ${chatId}, agentId: ${agentId}`
                    );

                    // Initialize stores
                    chatInstanceActions.initialize(chatId, initialAgentName);
                    agentActions.clearStreams();

                    const initialConnectionState = yield* connectionManagementService.createInitialState();
                    connectionActions.initialize(initialConnectionState);

                    // Establish session
                    try {
                        const session = yield* agentCommunicationService.establishSession(agentId, chatId);
                        activeSession = session;

                        // Start monitoring
                        const messageFiber = yield* startMessageProcessing(session);
                        const statusFiber = yield* startStatusMonitoring(session);

                        activeFibers = [messageFiber, statusFiber];

                        chatInstanceActions.statusChanged("connected");
                    } catch (error) {
                        yield* Effect.logError("[ChatInstanceBridge] Failed to establish session", error);
                        chatInstanceActions.errorOccurred(
                            error instanceof Error ? error.message : "Failed to establish session"
                        );
                    }
                });

            const processAction = (action: ChatInstanceAction): Effect.Effect<void, never> =>
                Effect.gen(function* () {
                    if (!activeSession) {
                        yield* Effect.logWarning("[ChatInstanceBridge] No active session for action", action);
                        return;
                    }

                    switch (action._tag) {
                        case "sendMessage": {
                            try {
                                // Create user message and add to state
                                const userMessage = yield* chatInstanceService.createUserMessage(
                                    action.text,
                                    action.attachments
                                );
                                chatInstanceActions.messageAdded(userMessage);

                                // Send to agent
                                yield* agentCommunicationService.sendMessage(
                                    activeSession,
                                    action.text,
                                    action.chatId || "unknown",
                                    action.attachments
                                );
                            } catch (error) {
                                yield* Effect.logError("[ChatInstanceBridge] Failed to send message", error);
                                chatInstanceActions.errorOccurred(
                                    error instanceof Error ? error.message : "Failed to send message"
                                );
                            }
                            break;
                        }
                        default:
                            yield* Effect.logDebug("[ChatInstanceBridge] Unhandled action", action);
                    }
                });

            const startMessageProcessing = (
                session: AgentSession
            ): Effect.Effect<Fiber.RuntimeFiber<never, never>, never> =>
                Effect.gen(function* () {
                    const messageStream = agentCommunicationService.createIncomingMessageStream(session);

                    const fiber = yield* Effect.forkDaemon(
                        Stream.runForEach(messageStream, (protocolMessage: ProtocolMessage) =>
                            Effect.gen(function* () {
                                yield* Effect.logDebug(
                                    "[ChatInstanceBridge] Processing incoming message",
                                    protocolMessage
                                );

                                switch (protocolMessage.type) {
                                    case "THINKING":
                                        chatInstanceActions.typingChanged(protocolMessage.isThinking);
                                        break;

                                    case "LLM_STREAM":
                                        if (!protocolMessage.isComplete && protocolMessage.content) {
                                            const streamId =
                                                protocolMessage.streamId ||
                                                protocolMessage.id ||
                                                crypto.randomUUID();

                                            agentActions.addChunk(streamId, protocolMessage.content);
                                        } else if (protocolMessage.isComplete) {
                                            const streamId =
                                                protocolMessage.streamId ||
                                                protocolMessage.id ||
                                                crypto.randomUUID();

                                            // Get accumulated text and finalize
                                            const currentText = agentStore.getSnapshot().context.activeStreams.get(streamId) || "";
                                            const finalMessage = yield* chatInstanceService.finalizeStreamingMessage(
                                                streamId,
                                                currentText
                                            );

                                            agentActions.completeStream(streamId, finalMessage);
                                            chatInstanceActions.messageAdded(finalMessage);
                                        }
                                        break;

                                    case "CONNECTION":
                                        if (protocolMessage.connectionState === "RECONNECTING") {
                                            chatInstanceActions.statusChanged("reconnecting");
                                            chatInstanceActions.errorOccurred("Server is reconnecting...");
                                        } else if (protocolMessage.connectionState === "CONNECTED") {
                                            chatInstanceActions.statusChanged("connected");
                                            chatInstanceActions.errorOccurred(undefined);
                                        }
                                        break;

                                    default: {
                                        const uiMessage = yield* chatInstanceService.convertProtocolMessageToUIMessage(
                                            protocolMessage
                                        );
                                        if (uiMessage) {
                                            chatInstanceActions.messageAdded(uiMessage);
                                        }
                                        break;
                                    }
                                }
                            }).pipe(
                                Effect.catchAll((error) =>
                                    Effect.logError("[ChatInstanceBridge] Error processing message", error)
                                )
                            )
                        )
                    );

                    return fiber;
                });

            const startStatusMonitoring = (
                session: AgentSession
            ): Effect.Effect<Fiber.RuntimeFiber<never, never>, never> =>
                Effect.gen(function* () {
                    const statusStream = agentCommunicationService.createStatusStream(session);

                    const fiber = yield* Effect.forkDaemon(
                        Stream.runForEach(statusStream, (status) =>
                            Effect.gen(function* () {
                                yield* Effect.logDebug("[ChatInstanceBridge] Status update", status);

                                const currentConnectionState = connectionStore.getSnapshot().context;
                                const newConnectionState = yield* connectionManagementService.handleStatusChange(
                                    currentConnectionState,
                                    status
                                );

                                connectionActions.statusChanged(newConnectionState);

                                // Update chat instance status based on connection state
                                switch (newConnectionState.status) {
                                    case "connected":
                                        chatInstanceActions.statusChanged("connected");
                                        chatInstanceActions.errorOccurred(undefined);
                                        break;
                                    case "disconnected":
                                        chatInstanceActions.statusChanged("disconnected");
                                        if (newConnectionState.error) {
                                            chatInstanceActions.errorOccurred(newConnectionState.error);
                                        }
                                        break;
                                    case "error":
                                        chatInstanceActions.statusChanged("error");
                                        if (newConnectionState.error) {
                                            chatInstanceActions.errorOccurred(newConnectionState.error);
                                        }
                                        break;
                                    case "reconnecting":
                                        chatInstanceActions.statusChanged("reconnecting");
                                        if (newConnectionState.error) {
                                            chatInstanceActions.errorOccurred(newConnectionState.error);
                                        }
                                        break;
                                }
                            }).pipe(
                                Effect.catchAll((error) =>
                                    Effect.logError("[ChatInstanceBridge] Error processing status", error)
                                )
                            )
                        )
                    );

                    return fiber;
                });

            const cleanup = (): Effect.Effect<void, never> =>
                Effect.gen(function* () {
                    yield* Effect.logInfo("[ChatInstanceBridge] Cleaning up");

                    // Interrupt all active fibers
                    yield* Effect.forEach(activeFibers, (fiber) => Fiber.interrupt(fiber));
                    activeFibers = [];
                    activeSession = null;

                    // Reset stores
                    chatInstanceActions.statusChanged("disconnected");
                    agentActions.clearStreams();
                    connectionActions.disconnect("Cleanup");
                });

            return {
                initialize,
                processAction,
                startMessageProcessing,
                startStatusMonitoring,
                cleanup,
            };
        }),
        dependencies: [
            ChatInstanceService.Default,
            AgentCommunicationService.Default,
            ConnectionManagementService.Default,
        ],
    }
) { } 