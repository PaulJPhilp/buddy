import { MdxService } from "@/services/mdx";
import { Effect, Fiber, Layer, Queue, Ref, Schedule, Stream } from "effect";
import { ConfigService } from "../config";
import { type WebSocketMessage, WebSocketService } from "../websocket";
import type { ChatServiceApi } from "./api";
import {
  ChatConnectionError,
  ChatHistoryError,
  ChatMessageError,
  ChatValidationError,
} from "./errors";
import type {
  ChatHistoryPage,
  ChatState,
  MessageApi,
  MessageValidation,
} from "./types";

export class ChatService extends Effect.Service<ChatServiceApi>()(
  "ChatService",
  {
    scoped: Effect.gen(function* () {
      const instanceId = Math.random().toString(36).substring(7);
      console.log(
        "[ChatService] Service construction started, instanceId:",
        instanceId,
      );

      // Get dependencies
      const webSocketService = yield* WebSocketService;
      const mdxService = yield* MdxService;
      const configService = yield* ConfigService;

      console.log(
        "[ChatService] Got WebSocketService instance:",
        (webSocketService as any).instanceId,
      );
      console.log(
        "[ChatService] WebSocketService messageStream:",
        webSocketService.messageStream,
      );

      // --------------------------------------------------
      // Reactive state management
      // --------------------------------------------------
      const stateRef = yield* Ref.make<ChatState>({
        id: "",
        messages: [],
        isTyping: false,
        metadata: {
          messageCount: 0,
          totalAttachments: 0,
        },
      });

      // Instead of polling a Ref every 100 ms, push each update into a
      // Queue so that React receives changes as soon as they occur.
      const stateQueue = yield* Queue.unbounded<ChatState>();

      // Direct state subscription callbacks for React hooks
      const stateSubscribers = new Set<(state: ChatState) => void>();

      const subscribeToState = (callback: (state: ChatState) => void) => {
        console.log(
          `[ChatService:${instanceId}] 📝 New state subscriber added, total: ${stateSubscribers.size + 1}`,
        );
        stateSubscribers.add(callback);
        return () => {
          console.log(
            `[ChatService:${instanceId}] 📝 State subscriber removed, remaining: ${stateSubscribers.size - 1}`,
          );
          stateSubscribers.delete(callback);
        };
      };

      /** Helper to atomically update the Ref and broadcast the new state */
      const updateState = (f: (s: ChatState) => ChatState) =>
        Ref.modify(stateRef, (old) => {
          const next = f(old);
          console.log(
            `[ChatService:${instanceId}] 🔄 updateState: old messages count: ${old.messages.length}, new messages count: ${next.messages.length}`,
          );
          return [next, next] as const;
        }).pipe(
          Effect.tap((next) => {
            console.log(
              `[ChatService:${instanceId}] 🔄 About to offer to stateQueue, messages count: ${next.messages.length}`,
            );
            return Queue.offer(stateQueue, next).pipe(
              Effect.tap(() => {
                console.log(
                  `[ChatService:${instanceId}] ✅ Successfully offered to stateQueue, messages count: ${next.messages.length}`,
                );

                // Also notify direct subscribers
                console.log(
                  `[ChatService:${instanceId}] 📢 Notifying ${stateSubscribers.size} direct subscribers`,
                );
                for (const callback of stateSubscribers) {
                  try {
                    callback(next);
                    console.log(
                      `[ChatService:${instanceId}] ✅ Direct subscriber notified successfully`,
                    );
                  } catch (error) {
                    console.error(
                      `[ChatService:${instanceId}] ❌ Error notifying direct subscriber:`,
                      error,
                    );
                  }
                }
              }),
              Effect.catchAll((error) => {
                console.error(
                  `[ChatService:${instanceId}] ❌ Failed to offer to stateQueue:`,
                  error,
                );
                return Effect.succeed(undefined);
              }),
            );
          }),
        );

      // Simplified message processing - restore basic functionality
      console.log("[ChatService] Setting up basic message processing...");

      // Store current agent ID
      const currentAgentRef = yield* Ref.make<string | undefined>(undefined);

      // Initialize WebSocket connection and message stream
      const initialize = (
        chatId: string,
        wsUrl?: string,
        agentId?: string,
      ): Effect.Effect<void, ChatConnectionError> =>
        Effect.gen(function* () {
          console.log(
            `[ChatService:${instanceId}] Initialize called with chatId:`,
            chatId,
            "agentId:",
            agentId,
          );

          // Update state with chatId
          yield* Ref.update(stateRef, (state) => ({
            ...state,
            id: chatId,
          }));

          // Update current agent
          if (agentId) {
            yield* Ref.set(currentAgentRef, agentId);
          }

          // Build WebSocket URL with agent support
          let finalUrl: string;
          if (wsUrl) {
            finalUrl = wsUrl;
          } else {
            const baseUrl = yield* configService.buildChatUrl(chatId);
            if (agentId) {
              const url = new URL(baseUrl);
              url.searchParams.set("agentId", agentId);
              finalUrl = url.toString();
            } else {
              finalUrl = baseUrl;
            }
          }

          console.log(
            `[ChatService:${instanceId}] Attempting to connect to:`,
            finalUrl,
          );

          yield* webSocketService.connect(finalUrl).pipe(
            Effect.retry({
              times: 3,
              delay: "1 second",
            }),
            Effect.mapError(
              (error) =>
                new ChatConnectionError({
                  message:
                    "Failed to initialize chat connection after retries. Is the LLM agent running on port 8080?",
                  cause: error,
                }),
            ),
          );

          console.log(
            `[ChatService:${instanceId}] WebSocket connected successfully`,
          );

          // Start consuming messages directly from WebSocket stream
          console.log(
            `[ChatService:${instanceId}] Starting direct message consumption...`,
          );

          // Start message consumption immediately within the same Effect context
          yield* Effect.forkDaemon(
            Effect.gen(function* () {
              console.log(
                `[ChatService:${instanceId}] 🚀 Message consumption daemon started`,
              );
              let messageCount = 0;

              console.log(
                `[ChatService:${instanceId}] 🔧 About to start Stream.runForEach...`,
              );

              yield* Stream.runForEach(
                webSocketService.messageStream,
                (protocolMessage) =>
                  Effect.gen(function* () {
                    messageCount++;
                    console.log(
                      `[ChatService:${instanceId}] 🔥 DIRECT MESSAGE RECEIVED #${messageCount}:`,
                      {
                        type: protocolMessage.type,
                        payloadType: (protocolMessage.payload as any)?.type,
                        id: protocolMessage.id,
                      },
                    );

                    const payload = protocolMessage.payload as any;
                    const messageType = payload?.type || protocolMessage.type;
                    const content = payload?.content || protocolMessage.content;

                    console.log(
                      `[ChatService:${instanceId}] 🔍 Processing message:`,
                      {
                        messageType,
                        contentLength: content?.length || 0,
                        contentPreview:
                          content?.substring(0, 50) || "no content",
                      },
                    );

                    if (messageType === "LLM_STREAM") {
                      console.log(
                        `[ChatService:${instanceId}] 📝 Processing LLM_STREAM`,
                      );
                      // Simple streaming - just accumulate text
                      yield* updateState((state) => {
                        const messages = [...state.messages];

                        // Find or create streaming message
                        let streamingIdx = -1;
                        for (let i = messages.length - 1; i >= 0; i--) {
                          if (
                            messages[i].sender === "assistant" &&
                            messages[i].metadata?.streaming === true
                          ) {
                            streamingIdx = i;
                            break;
                          }
                        }

                        if (streamingIdx >= 0) {
                          // Append to existing
                          messages[streamingIdx] = {
                            ...messages[streamingIdx],
                            text: messages[streamingIdx].text + (content || ""),
                          };
                          console.log(
                            `[ChatService:${instanceId}] ➕ Appended to existing streaming message`,
                          );
                        } else {
                          // Create new streaming message
                          messages.push({
                            id: crypto.randomUUID(),
                            text: content || "",
                            sender: "assistant",
                            timestamp: Date.now(),
                            metadata: { streaming: true },
                          });
                          console.log(
                            `[ChatService:${instanceId}] ✨ Created new streaming message`,
                          );
                        }

                        console.log(
                          `[ChatService:${instanceId}] 📊 State updated, messages count: ${messages.length}`,
                        );

                        return {
                          ...state,
                          messages,
                          isTyping: true,
                          metadata: {
                            ...state.metadata,
                            messageCount: messages.length,
                          },
                        };
                      });
                    } else if (messageType === "LLM_RESPONSE") {
                      console.log(
                        `[ChatService:${instanceId}] 🏁 Processing LLM_RESPONSE (finalizing)`,
                      );
                      // Finalize streaming message
                      yield* updateState((state) => {
                        const messages = [...state.messages];

                        // Find streaming message to finalize
                        for (let i = messages.length - 1; i >= 0; i--) {
                          if (
                            messages[i].sender === "assistant" &&
                            messages[i].metadata?.streaming === true
                          ) {
                            messages[i] = {
                              ...messages[i],
                              metadata: {
                                ...messages[i].metadata,
                                streaming: false,
                              },
                            };
                            console.log(
                              `[ChatService:${instanceId}] ✅ Finalized streaming message`,
                            );
                            break;
                          }
                        }

                        console.log(
                          `[ChatService:${instanceId}] 📊 Final state updated, messages count: ${messages.length}`,
                        );

                        return {
                          ...state,
                          messages,
                          isTyping: false,
                          metadata: {
                            ...state.metadata,
                            messageCount: messages.length,
                          },
                        };
                      });
                    } else {
                      console.log(
                        `[ChatService:${instanceId}] ❓ Unknown message type:`,
                        messageType,
                      );
                    }
                  }),
              );

              console.log(
                `[ChatService:${instanceId}] 🏁 Direct message consumption completed`,
              );
            }).pipe(
              Effect.catchAll((error) => {
                console.error(
                  `[ChatService:${instanceId}] 💥 DIRECT MESSAGE CONSUMPTION ERROR:`,
                  error,
                );
                console.error(
                  `[ChatService:${instanceId}] 💥 Error stack:`,
                  error?.stack,
                );
                console.error(
                  `[ChatService:${instanceId}] 💥 Error details:`,
                  JSON.stringify(error, null, 2),
                );
                return Effect.succeed(undefined);
              }),
            ),
          );

          console.log(
            `[ChatService:${instanceId}] Message consumption daemon started`,
          );

          console.log(
            `[ChatService:${instanceId}] WebSocket connection and direct message processing initialized`,
          );
        });

      const switchAgent = (
        agentId: string,
      ): Effect.Effect<void, ChatConnectionError> =>
        Effect.gen(function* () {
          console.log(
            `[ChatService:${instanceId}] Switching to agent:`,
            agentId,
          );

          const state = yield* Ref.get(stateRef);
          const chatId = state.id;

          if (!chatId) {
            return yield* Effect.fail(
              new ChatConnectionError({
                message: "Chat not initialized. Call initialize() first.",
              }),
            );
          }

          // Disconnect current WebSocket
          const isConnected = yield* webSocketService.isConnected;
          if (isConnected) {
            console.log(
              `[ChatService:${instanceId}] Disconnecting from current agent...`,
            );
            yield* webSocketService.disconnect();
          }

          // Re-initialize with new agent
          yield* initialize(chatId, undefined, agentId);

          console.log(
            `[ChatService:${instanceId}] Successfully switched to agent:`,
            agentId,
          );
        });

      const sendMessage = (
        text: string,
        attachments?: File[],
      ): Effect.Effect<void, ChatMessageError> =>
        Effect.gen(function* () {
          console.log(
            `[ChatService:${instanceId}] 📤 sendMessage called with:`,
            {
              text,
              textLength: text.length,
              attachmentsCount: attachments?.length || 0,
            },
          );

          const state = yield* Ref.get(stateRef);
          const chatId = state.id;

          console.log(`[ChatService:${instanceId}] 📤 Current state:`, {
            chatId,
            messageCount: state.messages.length,
            isTyping: state.isTyping,
          });

          // Check if chat is initialized
          if (!chatId) {
            console.log(`[ChatService:${instanceId}] ❌ Chat not initialized`);
            return yield* Effect.fail(
              new ChatMessageError({
                message: "Chat not initialized. Call initialize() first.",
              }),
            );
          }

          // Check WebSocket connection
          const isConnected = yield* webSocketService.isConnected;
          console.log(
            `[ChatService:${instanceId}] 📤 WebSocket connected:`,
            isConnected,
          );
          if (!isConnected) {
            console.log(
              `[ChatService:${instanceId}] ❌ WebSocket not connected`,
            );
            return yield* Effect.fail(
              new ChatMessageError({
                message: "WebSocket not connected. Please wait for connection.",
              }),
            );
          }

          // Validate message
          const validation = yield* validateMessage(text);
          console.log(
            `[ChatService:${instanceId}] 📤 Message validation:`,
            validation,
          );
          if (!validation.isValid) {
            console.log(
              `[ChatService:${instanceId}] ❌ Message validation failed:`,
              validation.errors,
            );
            return yield* Effect.fail(
              new ChatMessageError({
                message: `Invalid message: ${validation.errors.join(", ")}`,
              }),
            );
          }

          // Create user message
          const userMessage: MessageApi = {
            id: crypto.randomUUID(),
            text,
            sender: "user",
            timestamp: Date.now(),
            metadata: {
              length: text.length,
              validation,
              hasAttachments: !!attachments?.length,
              attachedFileCount: attachments?.length || 0,
            },
          };

          console.log(`[ChatService:${instanceId}] 📤 Created user message:`, {
            id: userMessage.id,
            text: userMessage.text,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp,
          });

          // Add to state & broadcast
          console.log(
            `[ChatService:${instanceId}] 📤 About to update state with user message...`,
          );
          yield* updateState((state) => {
            const newState = {
              ...state,
              messages: [...state.messages, userMessage],
              metadata: {
                ...state.metadata,
                messageCount: state.messages.length + 1,
                lastMessageAt: Date.now(),
              },
            };
            console.log(
              `[ChatService:${instanceId}] 📤 State updated with user message, new count: ${newState.messages.length}`,
            );
            return newState;
          });

          // Send via WebSocket using simplified protocol
          const userMessageForWS = {
            text: text,
          };

          console.log(
            `[ChatService:${instanceId}] 📤 About to send via WebSocket:`,
            userMessageForWS,
          );
          yield* webSocketService.send(userMessageForWS).pipe(
            Effect.mapError((error) => {
              console.log(
                `[ChatService:${instanceId}] ❌ WebSocket send error:`,
                error,
              );
              return new ChatMessageError({
                message: "Failed to send message",
                cause: error,
              });
            }),
          );

          console.log(
            `[ChatService:${instanceId}] ✅ sendMessage completed successfully`,
          );
        });

      const getHistory = (): Effect.Effect<ChatHistoryPage, ChatHistoryError> =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return {
            messages: state.messages,
            hasMore: false,
            nextCursor: undefined,
          };
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatHistoryError({
                message: "Failed to retrieve chat history",
                cause,
              }),
          ),
        );

      const validateMessage = (
        text: string,
      ): Effect.Effect<MessageValidation, ChatValidationError> =>
        Effect.sync(() => {
          const errors: string[] = [];

          if (!text || text.trim().length === 0) {
            errors.push("Message cannot be empty");
          }
          if (text.length > 2000) {
            errors.push("Message too long (max 2000 characters)");
          }

          return {
            isValid: errors.length === 0,
            errors,
          };
        });

      const getState = () => Ref.get(stateRef);
      const setState = (state: ChatState) =>
        Ref.set(stateRef, state).pipe(
          Effect.tap(() => Queue.offer(stateQueue, state)),
          Effect.map(() => state),
        );
      const setTyping = (isTyping: boolean) =>
        updateState((state) => ({ ...state, isTyping }));
      const clearHistory = () =>
        updateState((state) => ({
          ...state,
          messages: [],
          metadata: { ...state.metadata, messageCount: 0 },
        }));

      /**
       * Gracefully release runtime resources so that React Strict-Mode double
       * mounting does not leave zombie WebSocket connections or background
       * fibers running.
       */
      const cleanup = () =>
        Effect.gen(function* () {
          console.log(`[ChatService:${instanceId}] Cleaning up...`);

          // Disconnect WebSocket if still connected
          const connected = yield* webSocketService.isConnected;
          if (connected) {
            console.log(
              `[ChatService:${instanceId}] Disconnecting WebSocket...`,
            );
            yield* webSocketService.disconnect();
            console.log(`[ChatService:${instanceId}] WebSocket disconnected`);
          }

          console.log(`[ChatService:${instanceId}] Cleanup complete`);
        }).pipe(
          Effect.catchAll((error) => {
            console.error(`[ChatService:${instanceId}] Cleanup error:`, error);
            return Effect.succeed(undefined);
          }),
        );

      // Map protocol messages to UI message format
      const mappedMessageStream = Stream.map(
        webSocketService.messageStream,
        (protocolMessage: any) => {
          // Extract type and content from protocol message
          const payload = protocolMessage.payload || {};
          const messageType = payload.type || protocolMessage.type;
          const content = payload.content || protocolMessage.content;
          let sender: "user" | "assistant" = "assistant";
          if (messageType === "USER_MESSAGE") sender = "user";
          // Use protocolMessage.timestamp if available, else Date.now()
          return {
            id: protocolMessage.id || crypto.randomUUID(),
            text: content || "",
            sender,
            timestamp: protocolMessage.timestamp || Date.now(),
            metadata: {
              type: messageType,
              __tag: "Metadata",
            },
          };
        },
      );

      // Stream that emits the full chat state whenever it changes.
      const stateStream: Stream.Stream<ChatState, never> = Stream.fromQueue(
        stateQueue,
      ).pipe(
        Stream.tap((state) =>
          Effect.sync(() => {
            console.log(
              `[ChatService:${instanceId}] 🌊 stateStream emitting:`,
              {
                messageCount: state.messages.length,
                isTyping: state.isTyping,
                chatId: state.id,
              },
            );
          }),
        ),
      );

      // Emit the initial state immediately so subscribers get a snapshot.
      console.log(
        `[ChatService:${instanceId}] 🔄 About to offer initial state to queue...`,
      );
      yield* Queue.offer(stateQueue, yield* Ref.get(stateRef)).pipe(
        Effect.tap(() => {
          console.log(
            `[ChatService:${instanceId}] ✅ Successfully offered initial state to queue`,
          );
        }),
        Effect.catchAll((error) => {
          console.error(
            `[ChatService:${instanceId}] ❌ Failed to offer initial state to queue:`,
            error,
          );
          return Effect.succeed(undefined);
        }),
      );

      console.log(`[ChatService:${instanceId}] Service construction complete`);

      return {
        instanceId,
        initialize,
        switchAgent,
        sendMessage,
        getHistory,
        validateMessage,
        stateStream,
        messageStream: mappedMessageStream,
        getState,
        setState,
        setTyping,
        clearHistory,
        cleanup,
        subscribeToState,
      } satisfies ChatServiceApi & {
        instanceId: string;
        cleanup: typeof cleanup;
      };
    }),
    dependencies: [
      WebSocketService.Default,
      MdxService.Default,
      ConfigService.Default,
    ],
  },
) {}
