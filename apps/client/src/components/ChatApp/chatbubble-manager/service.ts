// ChatBubbleManager service skeleton
import { Effect, Ref } from "effect";
import type { Message } from "../ChatBubble";
import type { ChatBubbleAction, ChatBubbleManagerApi } from "./api";
import { ChatBubbleError } from "./errors";
import type { ChatBubbleState } from "./types";

export class ChatBubbleManager extends Effect.Service<ChatBubbleManagerApi>()(
  "ChatBubbleManager",
  {
    scoped: Effect.gen(function* () {
      // State: Map of messageId -> ChatBubbleState
      const bubbleStateRef = yield* Ref.make(
        new Map<string, ChatBubbleState>()
      );

      function formatMessage(
        message: Message
      ): Effect.Effect<string, never, never> {
        return Effect.succeed(message.content);
      }

      const getBubbleState = (messageId: string) =>
        bubbleStateRef.pipe(
          Ref.get,
          Effect.map(
            (map) =>
              map.get(messageId) || {
                messageId,
                isStreaming: false,
                hasError: false,
                reactions: {},
                isEdited: false,
                isCopied: false,
              }
          )
        );

      const setBubbleState = (
        messageId: string,
        state: Partial<ChatBubbleState>
      ): Effect.Effect<void, never, never> =>
        bubbleStateRef.pipe(
          Ref.update((map) => {
            const prev = map.get(messageId) || {
              messageId,
              isStreaming: false,
              hasError: false,
              reactions: {},
              isEdited: false,
              isCopied: false,
            };
            map.set(messageId, { ...prev, ...state });
            return map;
          }),
          Effect.asVoid
        );

      const performAction = (
        messageId: string,
        action: ChatBubbleAction
      ): Effect.Effect<void, ChatBubbleError, never> =>
        Effect.gen(function* () {
          switch (action) {
            case "edit":
              yield* setBubbleState(messageId, { isEdited: true });
              break;
            case "retry":
              yield* setBubbleState(messageId, { hasError: false });
              break;
            case "copy":
              yield* setBubbleState(messageId, { isCopied: true });
              break;
            case "delete":
              yield* bubbleStateRef.pipe(
                Ref.update((map) => {
                  map.delete(messageId);
                  return map;
                })
              );
              break;
            case "react":
              // Placeholder: add reaction logic
              break;
            default:
              yield* Effect.fail(
                new ChatBubbleError({
                  message: `Unknown action: ${action}`,
                  messageId,
                })
              );
          }
        });

      const api: ChatBubbleManagerApi = {
        formatMessage,
        getBubbleState,
        setBubbleState,
        performAction,
      };
      return api;
    }),
    dependencies: [],
  }
) {}
