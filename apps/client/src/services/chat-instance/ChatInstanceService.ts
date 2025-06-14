/**
 * @file ChatInstanceService - Core chat state management and message processing
 * @module services/chat-instance/ChatInstanceService
 */

import { chatInstanceActions } from "@/hooks/chat-instance/stores";
import { MdxService, type MdxServiceApi } from "@/services/mdx";
import type { Message } from "@/types/chat";
import type { WebSocketMessage } from "@buddy/protocol";
import { Data, Effect } from "effect";

// Error types
export class MessageProcessingError extends Data.TaggedError(
  "MessageProcessingError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class MessageConversionError extends Data.TaggedError(
  "MessageConversionError",
)<{
  readonly message: string;
  readonly protocolMessage: WebSocketMessage;
  readonly cause?: unknown;
}> {}

// Service API interface
export interface ChatInstanceServiceApi {
  readonly convertProtocolMessageToUIMessage: (
    protocolMessage: WebSocketMessage,
  ) => Effect.Effect<Message | null, MessageConversionError, MdxServiceApi>;

  readonly createUserMessage: (
    text: string,
    attachments?: Array<{ name: string }>,
  ) => Effect.Effect<Message, never>;

  readonly createStreamingMessage: (
    streamId: string,
    accumulatedText: string,
  ) => Effect.Effect<Message, never>;

  readonly finalizeStreamingMessage: (
    streamId: string,
    accumulatedText: string,
  ) => Effect.Effect<Message, MessageProcessingError, MdxServiceApi>;
}

/**
 * ChatInstanceService - Handles core chat state management and message processing
 */
export class ChatInstanceService extends Effect.Service<ChatInstanceServiceApi>()(
  "ChatInstanceService",
  {
    scoped: Effect.gen(function* () {
      const mdxService = yield* MdxService;

      const convertProtocolMessageToUIMessage = (
        protocolMessage: WebSocketMessage,
      ): Effect.Effect<Message | null, MessageConversionError, MdxServiceApi> =>
        Effect.gen(function* () {
          try {
            console.log(
              "[ChatInstanceService] Converting protocol message:",
              protocolMessage,
            );
            let result: Message | null = null;
            switch (protocolMessage.type) {
              case "LLM_RESPONSE": {
                const compiledResult = yield* mdxService
                  .compile(protocolMessage.content || "", {
                    development: process.env.NODE_ENV === "development",
                  })
                  .pipe(
                    Effect.catchAll(() =>
                      Effect.succeed({
                        compiledSource: "",
                        frontmatter: {},
                        metadata: {},
                      }),
                    ),
                  );

                result = {
                  id: protocolMessage.id || crypto.randomUUID(),
                  text: protocolMessage.content || "",
                  role: "assistant" as const,
                  timestamp: new Date(protocolMessage.timestamp).getTime(),
                  metadata: {
                    mdx: compiledResult,
                    ...protocolMessage.metadata,
                  },
                };
              }

              case "LLM_STREAM": {
                if (protocolMessage.isComplete) return null;
                result = {
                  id:
                    protocolMessage.streamId ||
                    protocolMessage.id ||
                    crypto.randomUUID(),
                  text: protocolMessage.content || "",
                  role: "assistant" as const,
                  timestamp: new Date(protocolMessage.timestamp).getTime(),
                  metadata: {
                    ...protocolMessage.metadata,
                    streaming: true,
                  },
                };
              }

              case "ERROR":
                result = {
                  id: protocolMessage.id || crypto.randomUUID(),
                  text: `Error: ${protocolMessage.message}`,
                  role: "assistant" as const,
                  timestamp: new Date(protocolMessage.timestamp).getTime(),
                  metadata: { error: true, code: protocolMessage.code },
                };

              case "WELCOME":
                result = {
                  id: protocolMessage.id || crypto.randomUUID(),
                  text: protocolMessage.message,
                  role: "assistant" as const,
                  timestamp: new Date(protocolMessage.timestamp).getTime(),
                  metadata: {
                    welcome: true,
                    serverInfo: protocolMessage.serverInfo,
                  },
                };

              default:
                return null;
            }
            console.log("[ChatInstanceService] Converted UI message:", result);
            return result;
          } catch (error) {
            return yield* Effect.fail(
              new MessageConversionError({
                message: `Failed to convert protocol message of type ${protocolMessage.type}`,
                protocolMessage,
                cause: error,
              }),
            );
          }
        });

      const createUserMessage = (
        text: string,
        attachments?: Array<{ name: string }>,
      ): Effect.Effect<Message, never> =>
        Effect.gen(function* () {
          console.log("[ChatInstanceService] Creating user message:", {
            text,
            attachments,
          });
          const message = yield* Effect.succeed({
            id: crypto.randomUUID(),
            text,
            role: "user" as const,
            timestamp: Date.now(),
            attachments,
          });
          console.log("[ChatInstanceService] Created user message:", message);
          return message;
        });

      const createStreamingMessage = (
        streamId: string,
        accumulatedText: string,
      ): Effect.Effect<Message, never> =>
        Effect.succeed({
          id: streamId,
          text: accumulatedText,
          role: "assistant" as const,
          timestamp: Date.now(),
          metadata: { streaming: true },
        });

      const finalizeStreamingMessage = (
        streamId: string,
        accumulatedText: string,
      ): Effect.Effect<Message, MessageProcessingError, MdxServiceApi> =>
        Effect.gen(function* () {
          console.log(
            "[ChatInstanceService] Finalizing streaming message for streamId:",
            streamId,
            "text:",
            accumulatedText,
          );

          // Set rendering state to true when MDX compilation starts
          console.log(
            "[ChatInstanceService] Starting MDX compilation - setting isRendering to true",
          );
          chatInstanceActions.renderingChanged(true);

          const compiledResult = yield* mdxService
            .compile(accumulatedText, {
              development: process.env.NODE_ENV === "development",
            })
            .pipe(
              Effect.catchAll(() =>
                Effect.succeed({
                  compiledSource: accumulatedText,
                  frontmatter: {},
                  metadata: { mdxError: true },
                }),
              ),
            );

          const result = {
            id: streamId,
            text: accumulatedText,
            role: "assistant" as const,
            timestamp: Date.now(),
            metadata: {
              streaming: false,
              mdx: compiledResult,
            },
          };

          console.log(
            "[ChatInstanceService] Finalized streaming message:",
            result,
          );

          // Set rendering state to false when MDX compilation completes
          console.log(
            "[ChatInstanceService] MDX compilation complete - setting isRendering to false",
          );
          chatInstanceActions.renderingChanged(false);

          return result;
        });

      return {
        convertProtocolMessageToUIMessage,
        createUserMessage,
        createStreamingMessage,
        finalizeStreamingMessage,
      };
    }),
    dependencies: [MdxService.Default],
  },
) {}
