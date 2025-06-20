import { ChatBridge } from "@/services/chat-bridge";
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
      const chatBridge = yield* ChatBridge;
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
      console.log(
        "[ChatService] Got ChatBridge instance:",
        chatBridge ? "YES" : "NO",
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

      /** Helper to atomically update the Ref and broadcast the new state */
      const updateState = (f: (s: ChatState) => ChatState) =>
        Ref.modify(stateRef, (old) => {
          const next = f(old);
          return [next, next] as const;
        }).pipe(Effect.tap((next) => Queue.offer(stateQueue, next)));

      // Simplified message processing - restore basic functionality
      console.log("[ChatService] Setting up basic message processing...");

      // Initialize WebSocket connection and message stream
      const initialize = (
        chatId: string,
        wsUrl?: string,
      ): Effect.Effect<void, ChatConnectionError> =>
        Effect.gen(function* () {
          console.log(
            `[ChatService:${instanceId}] Initialize called with chatId:`,
            chatId,
          );

          // Update state with chatId
          yield* Ref.update(stateRef, (state) => ({
            ...state,
            id: chatId,
          }));

          // Connect to WebSocket with retry
          const finalUrl = wsUrl || (yield* configService.buildChatUrl(chatId));
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

          // Start the chat bridge to consume messages from Effect context
          yield* chatBridge.start();
          console.log(`[ChatService:${instanceId}] Chat bridge started`);

          // Register message handler with bridge
          const messageHandler = (protocolMessage: any) => {
            console.log(
              `[ChatService:${instanceId}] 🔥 BRIDGE MESSAGE RECEIVED:`,
              {
                type: protocolMessage.type,
                payloadType: (protocolMessage.payload as any)?.type,
                id: protocolMessage.id,
              },
            );

            const payload = protocolMessage.payload as any;
            const messageType = payload?.type || protocolMessage.type;
            const content = payload?.content || protocolMessage.content;

            console.log(`[ChatService:${instanceId}] 🔍 Processing message:`, {
              messageType,
              contentLength: content?.length || 0,
              contentPreview: content?.substring(0, 50) || "no content",
            });

            if (messageType === "LLM_STREAM") {
              console.log(
                `[ChatService:${instanceId}] 📝 Processing LLM_STREAM`,
              );
              // Simple streaming - just accumulate text
              Effect.runFork(
                updateState((state) => {
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

                  return {
                    ...state,
                    messages,
                    isTyping: true,
                    metadata: {
                      ...state.metadata,
                      messageCount: messages.length,
                    },
                  };
                }),
              );
            } else if (messageType === "LLM_RESPONSE") {
              console.log(
                `[ChatService:${instanceId}] 🏁 Processing LLM_RESPONSE (finalizing)`,
              );
              // Finalize streaming message
              Effect.runFork(
                updateState((state) => {
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

                  return {
                    ...state,
                    messages,
                    isTyping: false,
                    metadata: {
                      ...state.metadata,
                      messageCount: messages.length,
                    },
                  };
                }),
              );
            } else {
              console.log(
                `[ChatService:${instanceId}] ❓ Unknown message type:`,
                messageType,
              );
            }
          };

          // Register message handler with bridge
          yield* chatBridge.registerHandler(messageHandler);
          console.log(
            `[ChatService:${instanceId}] Message handler registered with bridge`,
          );

          console.log(
            `[ChatService:${instanceId}] WebSocket connection and bridge initialized`,
          );
        });

      const sendMessage = (
        text: string,
        attachments?: File[],
      ): Effect.Effect<void, ChatMessageError> =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const chatId = state.id;

          // Check if chat is initialized
          if (!chatId) {
            return yield* Effect.fail(
              new ChatMessageError({
                message: "Chat not initialized. Call initialize() first.",
              }),
            );
          }

          // Check WebSocket connection
          const isConnected = yield* webSocketService.isConnected;
          if (!isConnected) {
            return yield* Effect.fail(
              new ChatMessageError({
                message: "WebSocket not connected. Please wait for connection.",
              }),
            );
          }

          // Validate message
          const validation = yield* validateMessage(text);
          if (!validation.isValid) {
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

          // Add to state & broadcast
          yield* updateState((state) => ({
            ...state,
            messages: [...state.messages, userMessage],
            metadata: {
              ...state.metadata,
              messageCount: state.messages.length + 1,
              lastMessageAt: Date.now(),
            },
          }));

          // Send via WebSocket using simplified protocol
          const userMessageForWS = {
            text: text,
          };

          yield* webSocketService.send(userMessageForWS).pipe(
            Effect.mapError(
              (error) =>
                new ChatMessageError({
                  message: "Failed to send message",
                  cause: error,
                }),
            ),
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

          // Stop bridge first so it no longer consumes from the WS stream
          const started = yield* chatBridge.isStarted();
          if (started) {
            console.log(`[ChatService:${instanceId}] Stopping bridge...`);
            yield* chatBridge.stop();
            console.log(`[ChatService:${instanceId}] Bridge stopped`);
          }

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
      const stateStream: Stream.Stream<ChatState, never> =
        Stream.fromQueue(stateQueue);

      // Emit the initial state immediately so subscribers get a snapshot.
      yield* Queue.offer(stateQueue, yield* Ref.get(stateRef));

      console.log(`[ChatService:${instanceId}] Service construction complete`);

      return {
        instanceId,
        initialize,
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
      } satisfies ChatServiceApi & { instanceId: string };
    }),
    dependencies: [
      WebSocketService.Default,
      ChatBridge.Default,
      MdxService.Default,
      ConfigService.Default,
    ],
  },
) {}
