import { createUserMessage } from "@buddy/protocol";
import { Effect, Ref } from "effect";
import { WebSocketService } from "../websocket/WebSocketService";
import type {
  ChatState,
  ChatStateApi,
  FileAttachment,
  MessageApi,
} from "./ChatServiceApi";
import {
  MAX_FILES_PER_MESSAGE,
  MAX_FILE_SIZE,
  MAX_MESSAGES_PER_CHAT,
} from "./ChatServiceApi";
import { HistoryError, MessageCreationError } from "./ChatServiceErrors";
import { sanitizeMessage, validateMessageText } from "./ChatServiceHelpers";

/**
 * Extended ChatService API that includes handling incoming messages
 */
export interface ExtendedChatStateApi extends ChatStateApi {
  /**
   * Adds an incoming assistant message to the chat.
   * @param text The message text from the assistant.
   * @returns An Effect yielding the created MessageApi.
   */
  readonly addAssistantMessage: (text: string) => Effect.Effect<MessageApi>;
}

/**
 * Implementation of the ChatService using Effect.Service pattern with WebSocket integration.
 */
export class ChatService extends Effect.Service<ExtendedChatStateApi>()(
  "ChatService",
  {
    scoped: Effect.gen(function* () {
      const ws = yield* WebSocketService;
      const stateRef = yield* Ref.make<ChatState>({
        id: "default",
        messages: [],
        isTyping: false,
        metadata: {
          messageCount: 0,
          totalAttachments: 0,
        },
      });
      let messageCounter = 0;

      const validateFiles = (files?: File[]) => {
        if (!files?.length) return { isValid: true, errors: [] };
        const errors: string[] = [];
        if (files.length > MAX_FILES_PER_MESSAGE) {
          errors.push(
            `Maximum ${MAX_FILES_PER_MESSAGE} files allowed per message`,
          );
        }
        for (const file of files) {
          if (file.size > MAX_FILE_SIZE) {
            errors.push(
              `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            );
          }
        }
        return { isValid: errors.length === 0, errors };
      };

      const processFiles = (files?: File[]): FileAttachment[] => {
        if (!files?.length) return [];
        return files.map((file) => ({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
        }));
      };

      const service: ExtendedChatStateApi = {
        getState: () => Ref.get(stateRef),
        setState: (state: ChatState) =>
          Effect.gen(function* () {
            yield* Ref.set(stateRef, state);
            return state;
          }),
        sendMessage: (text: string, attachments?: File[]) =>
          Effect.gen(function* () {
            const validation = validateMessageText(text);
            const fileValidation = validateFiles(attachments);
            const currentState = yield* Ref.get(stateRef);

            if (!validation.isValid || !fileValidation.isValid) {
              return yield* Effect.fail(
                new MessageCreationError(
                  `Invalid message: ${[...validation.errors, ...fileValidation.errors].join(", ")}`,
                ),
              );
            }

            if (currentState.messages.length >= MAX_MESSAGES_PER_CHAT) {
              return yield* Effect.fail(
                new MessageCreationError(
                  `Chat has reached maximum message limit of ${MAX_MESSAGES_PER_CHAT}`,
                ),
              );
            }

            const processedAttachments = processFiles(attachments);

            const userMessage: MessageApi = {
              id: `msg-${Date.now()}-${messageCounter++}`,
              text: sanitizeMessage(text),
              sender: "user",
              timestamp: Date.now(),
              attachments: processedAttachments,
              metadata: {
                length: text.length,
                validation,
                hasAttachments: processedAttachments.length > 0,
              },
            };

            // Send message to WebSocket
            const protocolMessage = createUserMessage(text);
            yield* ws.send(protocolMessage);
            console.log("[ChatService] Message sent to WebSocket:", protocolMessage);

            const newState: ChatState = {
              ...currentState,
              messages: [...currentState.messages, userMessage],
              isTyping: true, // Set typing to true while waiting for response
              metadata: {
                messageCount: currentState.messages.length + 1,
                lastMessageAt: Date.now(),
                totalAttachments:
                  (currentState.metadata?.totalAttachments || 0) +
                  processedAttachments.length,
              },
            };
            yield* Ref.set(stateRef, newState);

            return userMessage;
          }).pipe(
            Effect.catchAll((error) => {
              console.error("Error sending message:", error);
              return Effect.succeed({
                id: `error-${Date.now()}`,
                text: "Failed to send message. Please try again.",
                sender: "assistant",
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : String(error),
              } as MessageApi);
            }),
          ),
        addAssistantMessage: (text: string) =>
          Effect.gen(function* () {
            const currentState = yield* Ref.get(stateRef);

            const assistantMessage: MessageApi = {
              id: `msg-${Date.now()}-${messageCounter++}`,
              text: sanitizeMessage(text),
              sender: "assistant",
              timestamp: Date.now(),
              metadata: {
                length: text.length,
                validation: { isValid: true, errors: [] },
                hasAttachments: false,
              },
            };

            const newState: ChatState = {
              ...currentState,
              messages: [...currentState.messages, assistantMessage],
              isTyping: false, // Clear typing when assistant responds
              metadata: {
                messageCount: currentState.messages.length + 1,
                lastMessageAt: Date.now(),
                totalAttachments: currentState.metadata?.totalAttachments || 0,
              },
            };
            yield* Ref.set(stateRef, newState);

            console.log("[ChatService] Added assistant message:", assistantMessage);
            return assistantMessage;
          }),
        setTyping: (isTyping: boolean) =>
          Effect.gen(function* () {
            const currentState = yield* Ref.get(stateRef);
            const newState: ChatState = { ...currentState, isTyping };
            yield* Ref.set(stateRef, newState);
            return newState;
          }),
        validateMessage: (text: string) =>
          Effect.succeed(validateMessageText(text)),
        getHistory: (cursor?: string, limit = 50) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            const messages = [...state.messages];
            const totalMessages = messages.length;

            if (!cursor) {
              const page = messages.slice(-limit);
              return {
                messages: page,
                hasMore: totalMessages > limit,
                nextCursor: page[0]?.id,
              };
            }

            const cursorIndex = messages.findIndex((m) => m.id === cursor);
            if (cursorIndex === -1) {
              return yield* Effect.fail(
                new HistoryError(`Invalid cursor: ${cursor}`),
              );
            }

            const page = messages.slice(
              Math.max(0, cursorIndex - limit),
              cursorIndex,
            );

            return {
              messages: page,
              hasMore: cursorIndex > limit,
              nextCursor: page[0]?.id,
            };
          }).pipe(
            Effect.catchAll((error) => {
              console.error("Error retrieving chat history:", error);
              // Return a fallback response when an error occurs
              return Effect.succeed({
                messages: [],
                hasMore: false,
                nextCursor: undefined,
              });
            }),
          ),
        clearHistory: () =>
          Effect.gen(function* () {
            const currentState = yield* Ref.get(stateRef);
            yield* Ref.set(stateRef, {
              ...currentState,
              messages: [],
              metadata: {
                messageCount: 0,
                lastMessageAt: undefined,
                totalAttachments: 0,
              },
            });
          }),
      };

      return service;
    }),
    dependencies: [WebSocketService.Default],
  }
) { }
