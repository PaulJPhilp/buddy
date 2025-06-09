/**
 * @file ChatInstanceService - Core chat state management and message processing
 * @module services/chat-instance/ChatInstanceService
 */

import type { Message } from "@/features/chat/types";
import { MdxService, type MdxServiceApi } from "@/services/mdx";
import type { ProtocolMessage } from "@buddy/protocol";
import { Data, Effect } from "effect";

// Error types
export class MessageProcessingError extends Data.TaggedError("MessageProcessingError")<{
    readonly message: string;
    readonly cause?: unknown;
}> { }

export class MessageConversionError extends Data.TaggedError("MessageConversionError")<{
    readonly message: string;
    readonly protocolMessage: ProtocolMessage;
    readonly cause?: unknown;
}> { }

// Service API interface
export interface ChatInstanceServiceApi {
    readonly convertProtocolMessageToUIMessage: (
        protocolMessage: ProtocolMessage
    ) => Effect.Effect<Message | null, MessageConversionError, MdxServiceApi>;

    readonly createUserMessage: (
        text: string,
        attachments?: Array<{ name: string }>
    ) => Effect.Effect<Message, never>;

    readonly createStreamingMessage: (
        streamId: string,
        accumulatedText: string
    ) => Effect.Effect<Message, never>;

    readonly finalizeStreamingMessage: (
        streamId: string,
        accumulatedText: string
    ) => Effect.Effect<Message, MessageProcessingError, MdxServiceApi>;
}

/**
 * ChatInstanceService - Handles core chat state management and message processing
 */
export class ChatInstanceService extends Effect.Service<ChatInstanceServiceApi>()(
    "ChatInstanceService",
    {
        effect: Effect.gen(function* () {
            const mdxService = yield* MdxService;

            const convertProtocolMessageToUIMessage = (
                protocolMessage: ProtocolMessage
            ): Effect.Effect<Message | null, MessageConversionError, MdxServiceApi> =>
                Effect.gen(function* () {
                    try {
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
                                            })
                                        )
                                    );

                                return {
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
                                return {
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
                                return {
                                    id: protocolMessage.id || crypto.randomUUID(),
                                    text: `Error: ${protocolMessage.message}`,
                                    role: "assistant" as const,
                                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                                    metadata: { error: true, code: protocolMessage.code },
                                };

                            case "WELCOME":
                                return {
                                    id: protocolMessage.id || crypto.randomUUID(),
                                    text: protocolMessage.message,
                                    role: "assistant" as const,
                                    timestamp: new Date(protocolMessage.timestamp).getTime(),
                                    metadata: { welcome: true, serverInfo: protocolMessage.serverInfo },
                                };

                            default:
                                return null;
                        }
                    } catch (error) {
                        return yield* Effect.fail(
                            new MessageConversionError({
                                message: `Failed to convert protocol message of type ${protocolMessage.type}`,
                                protocolMessage,
                                cause: error,
                            })
                        );
                    }
                });

            const createUserMessage = (
                text: string,
                attachments?: Array<{ name: string }>
            ): Effect.Effect<Message, never> =>
                Effect.succeed({
                    id: crypto.randomUUID(),
                    text,
                    role: "user" as const,
                    timestamp: Date.now(),
                    attachments,
                });

            const createStreamingMessage = (
                streamId: string,
                accumulatedText: string
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
                accumulatedText: string
            ): Effect.Effect<Message, MessageProcessingError, MdxServiceApi> =>
                Effect.gen(function* () {
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
                                })
                            )
                        )
                        .pipe(
                            Effect.mapError(
                                (error) =>
                                    new MessageProcessingError({
                                        message: "Failed to compile MDX for streaming message",
                                        cause: error,
                                    })
                            )
                        );

                    return {
                        id: streamId,
                        text: accumulatedText,
                        role: "assistant" as const,
                        timestamp: Date.now(),
                        metadata: {
                            streaming: false,
                            mdx: compiledResult,
                        },
                    };
                });

            return {
                convertProtocolMessageToUIMessage,
                createUserMessage,
                createStreamingMessage,
                finalizeStreamingMessage,
            };
        }),
        dependencies: [MdxService.Default],
    }
) { } 