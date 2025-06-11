import { createMessage } from "@buddy/protocol";
import { Effect, Queue, Ref, Schedule, Stream } from "effect";
import { Data } from "effect";
import { Layer } from "effect";
import { buildChatUrl } from "../../config/websocket";
import {
  type WebSocketMessage,
  createWebSocketServiceImpl,
} from "../websocket/WebSocketService";
import type {
  ChatHistoryApi,
  ChatStateApi,
  MessageApi,
  MessageValidationApi,
} from "./ChatServiceApi";

// Chat-specific error types
export class ChatConnectionError extends Data.TaggedError(
  "ChatConnectionError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatMessageError extends Data.TaggedError("ChatMessageError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatHistoryError extends Data.TaggedError("ChatHistoryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// NOTE: We no longer expose `.Default` or any implicit Layer here.
//       Consumers must supply a Layer explicitly using `ChatServiceLive` below.

export const ChatService = Effect.Tag<ChatStateApi>()("ChatService");

/**
 * Layer helper complying with the Effect Layer Composition Rule.
 * Compose with other services via `Layer.merge(...)`.
 */
export const ChatServiceLive = (chatId: string, wsUrl?: string) =>
  Layer.effect(ChatService, createChatServiceForId(chatId, wsUrl));

// Factory function to create ChatService instances with specific chatId
export const createChatServiceForId = (chatId: string, wsUrl?: string) =>
  Effect.gen(function* () {
    console.log(
      `[createChatServiceForId] Creating ChatService for chatId: ${chatId}`,
    );

    // Create a dedicated WebSocket service instance for this chat
    const webSocketService = yield* createWebSocketServiceImpl();
    const finalUrl = wsUrl || buildChatUrl(chatId);

    // Create some initial test messages for development
    const initialMessages: MessageApi[] = [
      {
        id: "welcome-1",
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: "assistant",
        timestamp: Date.now() - 30000,
        metadata: {
          length: 52,
          validation: { isValid: true, errors: [] },
          hasAttachments: false,
        },
      },
      {
        id: "welcome-2",
        text: "I can help with questions, analysis, coding, and much more!",
        sender: "assistant",
        timestamp: Date.now() - 15000,
        metadata: {
          length: 62,
          validation: { isValid: true, errors: [] },
          hasAttachments: false,
        },
      },
    ];

    const stateRef = yield* Ref.make({
      id: chatId,
      messages: initialMessages,
      isTyping: false,
      metadata: {
        messageCount: initialMessages.length,
        totalAttachments: 0,
      },
    });

    const messageQueue = yield* Queue.unbounded<MessageApi>();
    let messageStreamFiber: Effect.Fiber<void, never> | null = null;

    // Initialize WebSocket connection and message stream
    const initialize = (): Effect.Effect<void, ChatConnectionError> =>
      Effect.gen(function* () {
        console.log(
          `[createChatServiceForId] Initializing ChatService for chatId: ${chatId}`,
        );

        // Connect to WebSocket
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
          `[createChatServiceForId] Starting message stream for chatId: ${chatId}`,
        );

        // Start the message stream subscription to process incoming messages
        // Use the receive property directly instead of messageStream
        messageStreamFiber = yield* Effect.fork(
          Effect.gen(function* () {
            console.log(
              `[createChatServiceForId] Message stream fiber started for chatId: ${chatId}`,
            );

            console.log(
              `[createChatServiceForId] *** ABOUT TO START Stream.runForEach WITH RECEIVE FOR ${chatId} ***`,
            );

            // Use the receive property directly (which should be the same as messageStream)
            yield* Stream.runForEach(webSocketService.receive, (wsMessage) =>
              Effect.gen(function* () {
                console.log(
                  `[createChatServiceForId] *** PROCESSING MESSAGE FOR ${chatId} ***:`,
                  {
                    messageId: wsMessage.id,
                    messageType: wsMessage.type,
                    timestamp: wsMessage.timestamp,
                    hasPayload: !!wsMessage.payload,
                  },
                );

                // Process messages the same way as before
                if (wsMessage.type === "RESPONSE" && wsMessage.payload) {
                  const serverMessage = wsMessage.payload as any;
                  const payload = serverMessage.payload || serverMessage;

                  if (payload.type === "WELCOME") {
                    console.log(
                      `[createChatServiceForId] LLM Server connected for chatId: ${chatId}`,
                    );
                    return;
                  }

                  if (payload.type === "LLM_STREAM") {
                    console.log(
                      `[createChatServiceForId] *** PROCESSING LLM_STREAM FOR ${chatId} ***:`,
                      {
                        content: payload.content?.substring(0, 100),
                        isComplete: payload.isComplete,
                        streamId: payload.streamId,
                      },
                    );

                    let streamId = payload.streamId;
                    if (!streamId) {
                      const currentState = yield* Ref.get(stateRef);
                      const lastUserMessage = [...currentState.messages]
                        .reverse()
                        .find((m) => m.sender === "user");
                      streamId = lastUserMessage
                        ? `response-to-${lastUserMessage.id}`
                        : `stream-${chatId}-session`;
                    }

                    const message: MessageApi = {
                      id: streamId,
                      text: payload.content,
                      sender: "assistant",
                      timestamp: wsMessage.timestamp,
                      metadata: {
                        length: payload.content.length,
                        validation: { isValid: true, errors: [] },
                        hasAttachments: false,
                        streaming: !payload.isComplete,
                        streamId: streamId,
                      },
                    };

                    yield* Ref.update(stateRef, (state) => {
                      const existingIndex = state.messages.findIndex(
                        (m) => m.metadata?.streamId === streamId,
                      );

                      if (existingIndex >= 0) {
                        const updatedMessages = [...state.messages];
                        const existingMessage = updatedMessages[existingIndex];
                        updatedMessages[existingIndex] = {
                          ...existingMessage,
                          text: existingMessage.text + payload.content,
                          timestamp: wsMessage.timestamp,
                          metadata: {
                            ...existingMessage.metadata,
                            streaming: !payload.isComplete,
                            length: (existingMessage.text + payload.content)
                              .length,
                          },
                        };
                        console.log(
                          `[createChatServiceForId] *** UPDATED STREAMING MESSAGE FOR ${chatId} ***:`,
                          {
                            streamId,
                            newLength:
                              updatedMessages[existingIndex].text.length,
                            chunkContent: payload.content.substring(0, 50),
                          },
                        );
                        return { ...state, messages: updatedMessages };
                      }

                      console.log(
                        `[createChatServiceForId] *** CREATED NEW STREAMING MESSAGE FOR ${chatId} ***:`,
                        {
                          streamId,
                          messageId: message.id,
                          firstChunk: payload.content.substring(0, 50),
                        },
                      );
                      return {
                        ...state,
                        messages: [...state.messages, message],
                        metadata: {
                          messageCount: state.metadata.messageCount + 1,
                          totalAttachments: state.metadata.totalAttachments,
                        },
                      };
                    });

                    const currentState = yield* Ref.get(stateRef);
                    const streamingMessage = currentState.messages.find(
                      (m) => m.metadata?.streamId === streamId,
                    );
                    if (streamingMessage) {
                      yield* Queue.offer(messageQueue, streamingMessage);
                    }
                    return;
                  }

                  if (
                    payload.type === "PROCESSING" ||
                    payload.type === "THINKING"
                  ) {
                    console.log(
                      `[createChatServiceForId] Server status for ${chatId}: ${payload.type}`,
                    );
                    return;
                  }
                }
              }),
            ).pipe(
              Effect.tap(() =>
                Effect.sync(() => {
                  console.log(
                    `[createChatServiceForId] *** Stream.runForEach COMPLETED FOR ${chatId} ***`,
                  );
                }),
              ),
            );

            console.log(
              `[createChatServiceForId] *** FINISHED Stream.runForEach FOR ${chatId} ***`,
            );
          }).pipe(
            Effect.catchAll((error) =>
              Effect.sync(() => {
                console.error(
                  `[createChatServiceForId] Stream error for chatId ${chatId}:`,
                  error,
                );
              }),
            ),
          ),
        );

        yield* Effect.sleep("1 millis");
        console.log(
          `[createChatServiceForId] ChatService initialized for chatId: ${chatId}`,
        );
      });

    // Initialize the service
    yield* initialize();

    // Return the service API implementation
    return {
      getState: () => Ref.get(stateRef),

      setState: (state: any) =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, state);
          return state;
        }),

      sendMessage: (
        text: string,
        attachments?: File[],
      ): Effect.Effect<MessageApi, ChatMessageError> =>
        Effect.gen(function* () {
          const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = Date.now();

          const message: MessageApi = {
            id: messageId,
            text,
            sender: "user",
            timestamp,
            attachments: attachments?.map((file) => ({
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
            })),
            metadata: {
              length: text.length,
              validation: { isValid: true, errors: [] },
              hasAttachments: attachments && attachments.length > 0,
            },
          };

          const wsMessage = createMessage(
            "COMMAND",
            {
              command: "userMessage",
              data: {
                text: message.text,
                attachments: message.attachments,
                chatId: chatId,
              },
              __tag: "CommandPayload",
            },
            {
              correlationId: message.id,
            },
          );

          yield* webSocketService.send(wsMessage).pipe(
            Effect.retry({
              times: 3,
              schedule: Schedule.exponential("100 millis"),
            }),
            Effect.mapError(
              (error) =>
                new ChatMessageError({
                  message: "Failed to send message after retries",
                  cause: error,
                }),
            ),
          );

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            messages: [...state.messages, message],
            metadata: {
              messageCount: state.metadata.messageCount + 1,
              totalAttachments:
                state.metadata.totalAttachments + (attachments?.length || 0),
            },
          }));

          return message;
        }),

      setTyping: (isTyping: boolean) => Effect.succeed({} as any),

      validateMessage: (text: string) =>
        Effect.succeed({
          isValid: text.length > 0 && text.length <= 2000,
          errors: text.length === 0 ? ["Message cannot be empty"] : [],
        }),

      getHistory: () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return {
            messages: state.messages,
            hasMore: false,
            nextCursor: undefined,
          };
        }),

      clearHistory: () => Effect.succeed(undefined),

      cleanup: () =>
        Effect.gen(function* () {
          console.log(
            `[createChatServiceForId] Cleaning up ChatService for ${chatId}`,
          );

          // Cleanup WebSocket service
          yield* webSocketService.cleanup();

          // Cleanup message stream fiber if it exists
          if (messageStreamFiber) {
            yield* Effect.interrupt(messageStreamFiber);
            messageStreamFiber = null;
          }

          console.log(
            `[createChatServiceForId] ChatService cleanup completed for ${chatId}`,
          );
        }),

      get messageStream(): Stream.Stream<MessageApi, ChatConnectionError> {
        return Stream.fromQueue(messageQueue).pipe(
          Stream.mapError((error) => {
            console.error(
              `[createChatServiceForId] Message stream error for ${chatId}:`,
              error,
            );
            return new ChatConnectionError({
              message: "Message stream error",
              cause: error,
            });
          }),
        );
      },
    } satisfies ChatStateApi;
  });
