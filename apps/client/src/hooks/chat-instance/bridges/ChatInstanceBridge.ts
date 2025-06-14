/**
 * @file ChatInstanceBridge - Coordinates between Effect.js services and xState stores
 * @module hooks/chat-instance/bridges/ChatInstanceBridge
 */

import type { AgentSession } from "@/services/chat-runtime/ChatRuntimeService";
import type { WebSocketMessage } from "@buddy/protocol";
import { Effect, Fiber, Logger, Stream } from "effect";

// Import services
import {
  AgentCommunicationService,
  ChatInstanceService,
  ConnectionManagementService,
} from "@/services/chat-instance";

// Import additional required services
import { AgentEndpointResolverService } from "@/services/chat-runtime/AgentEndpointResolverService";
import { ChatRuntimeService } from "@/services/chat-runtime/ChatRuntimeService";
import { MdxService } from "@/services/mdx";
import { WebSocketService } from "@/services/websocket/WebSocketService";

// Import stores
import {
  agentActions,
  agentStore,
  chatInstanceActions,
  connectionActions,
  connectionStore,
} from "../stores";

// Import types
import type { ChatInstanceAction } from "@/types/chat";

export interface ChatInstanceBridgeApi {
  readonly initialize: (
    chatId: string,
    agentId: string,
    initialAgentName: string,
    prompt?: string,
  ) => Effect.Effect<void, never>;

  readonly processAction: (
    action: ChatInstanceAction,
  ) => Effect.Effect<void, never>;

  readonly startMessageProcessing: (
    session: AgentSession,
  ) => Effect.Effect<Fiber.RuntimeFiber<never, never>, never>;

  readonly startStatusMonitoring: (
    session: AgentSession,
  ) => Effect.Effect<Fiber.RuntimeFiber<never, never>, never>;

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
      const chatRuntimeService = yield* ChatRuntimeService;
      const agentEndpointResolverService = yield* AgentEndpointResolverService;
      const webSocketService = yield* WebSocketService;
      const mdxService = yield* MdxService;

      // Store for active session and fibers
      let activeSession: AgentSession | null = null;
      let activeFibers: Fiber.RuntimeFiber<any, any>[] = [];
      let currentChatId = "";

      const initialize = (
        chatId: string,
        agentId: string,
        initialAgentName: string,
        prompt?: string,
      ): Effect.Effect<void, never> =>
        Effect.gen(function* () {
          yield* Effect.logInfo(
            `[ChatInstanceBridge] Initializing for chatId: ${chatId}, agentId: ${agentId}, prompt: ${prompt ? "provided" : "none"}`,
          );

          // Store the current chat ID
          currentChatId = chatId;

          // Initialize stores
          chatInstanceActions.initialize(chatId, initialAgentName);
          agentActions.clearStreams();

          // Reset connection state to initial
          connectionActions.reset();

          // Establish session
          try {
            const session = yield* agentCommunicationService.establishSession(
              agentId,
              chatId,
              prompt,
            );
            activeSession = session;

            // Start monitoring
            const messageFiber = yield* startMessageProcessing(session);
            const statusFiber = yield* startStatusMonitoring(session);

            activeFibers = [messageFiber, statusFiber];

            chatInstanceActions.statusChanged("connected");
          } catch (error) {
            yield* Effect.logError(
              "[ChatInstanceBridge] Failed to establish session",
              error,
            );
            chatInstanceActions.errorOccurred(
              error instanceof Error
                ? error.message
                : "Failed to establish session",
            );
          }
        });

      const processAction = (
        action: ChatInstanceAction,
      ): Effect.Effect<void, never> =>
        Effect.gen(function* () {
          console.log("[ChatInstanceBridge] Processing action:", action);

          if (!activeSession) {
            yield* Effect.logWarning(
              "[ChatInstanceBridge] No active session for action",
              action,
            );
            return;
          }

          switch (action._tag) {
            case "sendMessage": {
              try {
                console.log(
                  "[ChatInstanceBridge] Processing sendMessage action with text:",
                  action.text,
                );

                // Create user message and add to state
                const userMessage =
                  yield* chatInstanceService.createUserMessage(
                    action.text,
                    action.attachments,
                  );

                console.log(
                  "[ChatInstanceBridge] Created user message:",
                  userMessage,
                );

                chatInstanceActions.messageAdded(userMessage);
                console.log(
                  "[ChatInstanceBridge] chatInstanceActions.messageAdded called for user message:",
                  userMessage,
                );

                // Send to agent
                yield* agentCommunicationService.sendMessage(
                  activeSession,
                  action.text,
                  currentChatId || "unknown",
                  action.attachments,
                );

                console.log(
                  "[ChatInstanceBridge] Message sent to agent successfully",
                );
              } catch (error) {
                console.error(
                  "[ChatInstanceBridge] Error in sendMessage:",
                  error,
                );
                yield* Effect.logError(
                  "[ChatInstanceBridge] Failed to send message",
                  error,
                );
                chatInstanceActions.errorOccurred(
                  error instanceof Error
                    ? error.message
                    : "Failed to send message",
                );
              }
              break;
            }
            default:
              yield* Effect.logDebug(
                "[ChatInstanceBridge] Unhandled action",
                action,
              );
          }
        });

      const startMessageProcessing = (
        session: AgentSession,
      ): Effect.Effect<Fiber.RuntimeFiber<never, never>, never> =>
        Effect.gen(function* () {
          const messageStream =
            agentCommunicationService.createIncomingMessageStream(session);

          const fiber = yield* Effect.forkDaemon(
            Stream.runForEach(
              messageStream,
              (protocolMessage: WebSocketMessage) =>
                Effect.gen(function* () {
                  yield* Effect.logDebug(
                    "[ChatInstanceBridge] Processing incoming message",
                    protocolMessage,
                  );

                  // Handle RESPONSE type messages with nested payload
                  let actualPayload = protocolMessage.payload;
                  if (
                    actualPayload &&
                    actualPayload.type === "RESPONSE" &&
                    actualPayload.payload
                  ) {
                    console.log(
                      "[ChatInstanceBridge] Unwrapping nested payload:",
                      actualPayload.payload,
                    );
                    actualPayload = actualPayload.payload;
                  }
                  console.log(
                    "[ChatInstanceBridge] Actual payload for switch:",
                    actualPayload,
                  );
                  switch (actualPayload.type) {
                    case "THINKING":
                      console.log("[ChatInstanceBridge] Entered THINKING case");
                      chatInstanceActions.typingChanged(
                        actualPayload.content === "true",
                      );
                      break;
                    case "LLM_STREAM":
                      console.log(
                        "[ChatInstanceBridge] Entered LLM_STREAM case",
                      );
                      if (actualPayload.content) {
                        const streamId =
                          protocolMessage.id || crypto.randomUUID();
                        agentActions.addChunk(streamId, actualPayload.content);
                        console.log(
                          "[ChatInstanceBridge] Called agentActions.addChunk with streamId:",
                          streamId,
                          "content:",
                          actualPayload.content,
                        );
                      }
                      break;
                    case "LLM_RESPONSE":
                      console.log(
                        "[ChatInstanceBridge] Entered LLM_RESPONSE case",
                      );
                      if (actualPayload.content) {
                        const streamId =
                          protocolMessage.id || crypto.randomUUID();
                        const finalMessage =
                          yield* chatInstanceService.finalizeStreamingMessage(
                            streamId,
                            actualPayload.content,
                          );
                        console.log(
                          "[ChatInstanceBridge] About to call chatInstanceActions.messageAdded for finalMessage:",
                          finalMessage,
                        );
                        chatInstanceActions.messageAdded(finalMessage);
                        console.log(
                          "[ChatInstanceBridge] chatInstanceActions.messageAdded called for finalMessage:",
                          finalMessage,
                        );
                      }
                      break;
                    case "RECEIVED":
                      console.log("[ChatInstanceBridge] Entered RECEIVED case");
                      yield* Effect.logDebug(
                        `[ChatInstanceBridge] Status: ${actualPayload.type}`,
                        actualPayload.content,
                      );
                      break;
                    case "PROCESSING":
                      console.log(
                        "[ChatInstanceBridge] Entered PROCESSING case",
                      );
                      yield* Effect.logDebug(
                        `[ChatInstanceBridge] Status: ${actualPayload.type}`,
                        actualPayload.content,
                      );
                      break;
                    default:
                      console.log(
                        "[ChatInstanceBridge] Unhandled payload type:",
                        actualPayload.type,
                        actualPayload,
                      );
                      yield* Effect.logDebug(
                        `[ChatInstanceBridge] Unhandled payload type: ${actualPayload.type}`,
                        actualPayload,
                      );
                      break;
                  }

                  console.log(
                    "[ChatInstanceBridge] Incoming protocol message:",
                    protocolMessage,
                  );
                }).pipe(
                  Effect.catchAll((error) =>
                    Effect.logError(
                      "[ChatInstanceBridge] Error processing message",
                      error,
                    ),
                  ),
                ),
            ),
          );

          return fiber;
        });

      const startStatusMonitoring = (
        session: AgentSession,
      ): Effect.Effect<Fiber.RuntimeFiber<never, never>, never> =>
        Effect.gen(function* () {
          const statusStream =
            agentCommunicationService.createStatusStream(session);

          const fiber = yield* Effect.forkDaemon(
            Stream.runForEach(statusStream, (status) =>
              Effect.gen(function* () {
                yield* Effect.logDebug(
                  "[ChatInstanceBridge] Status update",
                  status,
                );

                const currentConnectionState =
                  connectionStore.getSnapshot().context;
                const newConnectionState =
                  yield* connectionManagementService.handleStatusChange(
                    currentConnectionState,
                    status,
                  );

                connectionActions.statusChanged(newConnectionState.status);

                // Update chat instance status based on connection state
                switch (newConnectionState.status) {
                  case "connected":
                    chatInstanceActions.statusChanged("connected");
                    chatInstanceActions.errorCleared();
                    break;
                  case "disconnected":
                    chatInstanceActions.statusChanged("disconnected");
                    if (newConnectionState.error) {
                      chatInstanceActions.errorOccurred(
                        newConnectionState.error,
                      );
                    }
                    break;
                  case "error":
                    chatInstanceActions.statusChanged("error");
                    if (newConnectionState.error) {
                      chatInstanceActions.errorOccurred(
                        newConnectionState.error,
                      );
                    }
                    break;
                  case "reconnecting":
                    chatInstanceActions.statusChanged("reconnecting");
                    if (newConnectionState.error) {
                      chatInstanceActions.errorOccurred(
                        newConnectionState.error,
                      );
                    }
                    break;
                }
              }).pipe(
                Effect.catchAll((error) =>
                  Effect.logError(
                    "[ChatInstanceBridge] Error processing status",
                    error,
                  ),
                ),
              ),
            ),
          );

          return fiber;
        });

      const cleanup = (): Effect.Effect<void, never> =>
        Effect.gen(function* () {
          yield* Effect.logInfo("[ChatInstanceBridge] Cleaning up");

          // Interrupt all active fibers
          yield* Effect.forEach(activeFibers, (fiber) =>
            Fiber.interrupt(fiber),
          );
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
      ChatRuntimeService.Default,
      AgentEndpointResolverService.Default,
      WebSocketService.Default,
      MdxService.Default,
      Logger.pretty, // Add logger service for Effect.logInfo, etc.
    ],
  },
) {}
