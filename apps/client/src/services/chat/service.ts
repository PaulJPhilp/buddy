import { MdxService } from "@/services/mdx";
import { createMessage } from "@buddy/protocol";
import { Effect, Layer, Queue, Ref, Stream } from "effect";
import { buildChatUrl } from "../../config/websocket";
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
      // Get dependencies
      const webSocketService = yield* WebSocketService;
      const mdxService = yield* MdxService;

      // Create state management
      const stateRef = yield* Ref.make<ChatState>({
        id: "",
        messages: [],
        isTyping: false,
        metadata: {
          messageCount: 0,
          totalAttachments: 0,
        },
      });

      const messageQueue = yield* Queue.unbounded<MessageApi>();

      // Initialize WebSocket connection and message stream
      const initialize = (
        chatId: string,
        wsUrl?: string,
      ): Effect.Effect<void, ChatConnectionError> =>
        Effect.gen(function* () {
          console.log(
            `[ChatService] Initializing ChatService for chatId: ${chatId}`,
          );

          // Update state with chatId
          yield* Ref.update(stateRef, (state) => ({
            ...state,
            id: chatId,
          }));

          // Connect to WebSocket
          const finalUrl = wsUrl || buildChatUrl(chatId);
          yield* webSocketService.connect(finalUrl).pipe(
            Effect.mapError(
              (error) =>
                new ChatConnectionError({
                  message: "Failed to initialize chat connection",
                  cause: error,
                }),
            ),
          );

          console.log(
            `[ChatService] Starting message stream for chatId: ${chatId}`,
          );

          // Start listening for incoming WebSocket messages
          yield* Effect.fork(
            Stream.runForEach(
              webSocketService.messageStream,
              (protocolMessage) =>
                Effect.gen(function* () {
                  console.log(
                    "[ChatService] Received WebSocket message:",
                    protocolMessage,
                  );

                  // Handle RESPONSE messages from LLM agent
                  if (
                    protocolMessage.type === "RESPONSE" &&
                    protocolMessage.payload
                  ) {
                    const payload = protocolMessage.payload as any;
                    const messageType = payload.type;
                    const content = payload.content;

                    if (messageType === "LLM_RESPONSE") {
                      // Final response from LLM
                      const assistantMessage: MessageApi = {
                        id: crypto.randomUUID(),
                        text: content || "No response",
                        sender: "assistant",
                        timestamp: Date.now(),
                        metadata: {
                          length: (content || "").length,
                          streaming: false,
                        },
                      };

                      // Compile MDX for the response
                      const mdxResult = yield* mdxService
                        .compile(content || "")
                        .pipe(
                          Effect.catchAll(() =>
                            Effect.succeed({
                              compiledSource: content || "",
                              frontmatter: {},
                              metadata: { mdxError: true },
                            }),
                          ),
                        );

                      console.log("[ChatService] MDX compilation result:", {
                        originalContent: content,
                        compiledSource: mdxResult.compiledSource,
                        frontmatter: mdxResult.frontmatter,
                        hasError: mdxResult.metadata?.mdxError,
                      });

                      // Update message with MDX compilation result
                      assistantMessage.metadata = {
                        ...assistantMessage.metadata,
                        mdx: mdxResult,
                      };

                      console.log(
                        "[ChatService] Final assistant message:",
                        assistantMessage,
                      );

                      // Add to message queue for stream consumers
                      yield* Queue.offer(messageQueue, assistantMessage);

                      // Update state
                      yield* Ref.update(stateRef, (state) => ({
                        ...state,
                        messages: [...state.messages, assistantMessage],
                        isTyping: false,
                        metadata: {
                          ...state.metadata,
                          messageCount: state.messages.length + 1,
                          lastMessageAt: Date.now(),
                        },
                      }));

                      console.log(
                        "[ChatService] Added LLM response with MDX to stream:",
                        content,
                      );
                    } else if (messageType === "LLM_STREAM") {
                      // Streaming chunk from LLM - for now just log it
                      console.log(
                        "[ChatService] Received LLM stream chunk:",
                        content,
                      );
                    } else if (messageType === "THINKING") {
                      // Update typing status based on thinking state
                      const isThinking = content === "true";
                      yield* Ref.update(stateRef, (state) => ({
                        ...state,
                        isTyping: isThinking,
                      }));
                      console.log(
                        "[ChatService] Updated thinking state:",
                        isThinking,
                      );
                    } else if (messageType === "LLM_ERROR") {
                      // Handle LLM errors
                      console.error("[ChatService] LLM Error:", content);
                      yield* Ref.update(stateRef, (state) => ({
                        ...state,
                        isTyping: false,
                      }));
                    } else if (messageType === "WELCOME") {
                      console.log(
                        "[ChatService] Received welcome message:",
                        content,
                      );
                    } else if (messageType === "PROCESSING") {
                      console.log(
                        "[ChatService] LLM is processing message:",
                        content,
                      );
                    } else {
                      console.log(
                        "[ChatService] Unknown message type:",
                        messageType,
                        content,
                      );
                    }
                  }
                }).pipe(
                  Effect.catchAll((error) =>
                    Effect.sync(() => {
                      console.error(
                        "[ChatService] Error processing WebSocket message:",
                        error,
                      );
                    }),
                  ),
                ),
            ),
          );
        });

      const sendMessage = (
        text: string,
        attachments?: File[],
      ): Effect.Effect<void, ChatMessageError> =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const chatId = state.id;

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

          // Add to state
          yield* Ref.update(stateRef, (state) => ({
            ...state,
            messages: [...state.messages, userMessage],
            metadata: {
              ...state.metadata,
              messageCount: state.messages.length + 1,
              lastMessageAt: Date.now(),
            },
          }));

          // Send via WebSocket
          const protocolMessage = createMessage(
            "COMMAND",
            {
              command: "userMessage",
              data: { text, chatId, sessionId: chatId },
              __tag: "CommandPayload",
            },
            userMessage.id,
            Date.now(),
            { processed: false, __tag: "Metadata" },
          );

          yield* webSocketService.send(protocolMessage).pipe(
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
        Ref.set(stateRef, state).pipe(Effect.map(() => state));
      const setTyping = (isTyping: boolean) =>
        Ref.update(stateRef, (state) => ({ ...state, isTyping })).pipe(
          Effect.flatMap(() => Ref.get(stateRef)),
        );
      const clearHistory = () =>
        Ref.update(stateRef, (state) => ({
          ...state,
          messages: [],
          metadata: { ...state.metadata, messageCount: 0 },
        }));
      const cleanup = () => Effect.succeed(undefined);

      // Create message stream from queue
      const messageStream = Stream.fromQueue(messageQueue);

      return {
        initialize,
        sendMessage,
        getHistory,
        validateMessage,
        messageStream,
        getState,
        setState,
        setTyping,
        clearHistory,
        cleanup,
      } satisfies ChatServiceApi;
    }),
    dependencies: [WebSocketService.Default, MdxService.Default],
  },
) {}
