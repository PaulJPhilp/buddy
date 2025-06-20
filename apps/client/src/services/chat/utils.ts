/**
 * @file Chat Service Utilities - Helper functions for chat operations
 * @module services/chat/utils
 */

import { MdxService, type MdxServiceApi } from "@/services/mdx";
import type { Message } from "@/types/chat";
import { Data, Effect } from "effect";
import type { MessageValidation } from "./types";

// Error types
export class MessageProcessingError extends Data.TaggedError(
  "MessageProcessingError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Creates a user message object
 */
export function createUserMessage(
  text: string,
  attachments?: Array<{ name: string }>,
): Message {
  return {
    id: crypto.randomUUID(),
    text,
    role: "user" as const,
    timestamp: Date.now(),
    attachments,
  };
}

/**
 * Finalizes a streaming message by compiling llm-ui and creating the final message
 */
export function finalizeStreamingMessage(
  streamId: string,
  accumulatedText: string,
): Effect.Effect<Message, MessageProcessingError, MdxServiceApi> {
  return Effect.gen(function* () {
    console.log(
      "[ChatUtils] Finalizing streaming message for streamId:",
      streamId,
      "text:",
      accumulatedText,
    );

    // Set rendering state to true when llm-ui compilation starts
    console.log(
      "[ChatUtils] Starting llm-ui compilation - setting isRendering to true",
    );
    // TODO: Handle rendering state in the calling component

    const mdxService = yield* MdxService;
    const compiledResult = yield* mdxService
      .compileForLlmUi(accumulatedText, {
        development: process.env.NODE_ENV === "development",
      })
      .pipe(
        Effect.catchAll(() =>
          Effect.succeed({
            rawMarkdown: accumulatedText,
            frontmatter: {},
            metadata: { llmUiError: true },
          }),
        ),
      );

    const result: Message = {
      id: streamId,
      text: accumulatedText,
      role: "assistant" as const,
      timestamp: Date.now(),
      metadata: {
        streaming: false,
        llmUi: compiledResult,
      },
    };

    console.log("[ChatUtils] Finalized streaming message:", result);

    // Set rendering state to false when llm-ui compilation completes
    console.log(
      "[ChatUtils] llm-ui compilation complete - setting isRendering to false",
    );
    // TODO: Handle rendering state in the calling component

    return result;
  });
}

/**
 * Sanitizes message text by trimming whitespace
 */
export function sanitizeMessage(text: string): string {
  return text.trim();
}

/**
 * Validates message text according to chat service rules
 */
export function validateMessageText(text: string): MessageValidation {
  const errors: string[] = [];
  if (!text || text.trim().length === 0) {
    errors.push("Message text cannot be empty");
  }
  if (text.length > 4000) {
    errors.push("Message text cannot exceed 4000 characters");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
