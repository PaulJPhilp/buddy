import { AgentConfig } from "@/agents/schemas/AgentConfigSchema"; // Corrected import path
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { Effect, Stream } from "effect";
import type {
  AgentResponse,
  AgentServiceApi,
  AgentStreamChunk,
  ChatMessage,
} from "./api";
import {
  type AgentServiceError,
  ConnectError,
  InvalidAgentConfig,
  VercelAIError,
} from "./errors";

function mapVercelError(error: unknown): AgentServiceError {
  console.log("[AgentService] Mapping error:", error);

  if (typeof error === "object" && error !== null) {
    // Type-safe property access without 'as any'
    const hasMessage = "message" in error;
    const hasToString =
      "toString" in error && typeof error.toString === "function";

    let message: string | undefined;

    if (
      hasMessage &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    } else if (hasToString) {
      try {
        message = error.toString();
      } catch {
        // toString() might throw, fallback to String conversion
        message = String(error);
      }
    }

    if (typeof message === "string") {
      if (message.includes("API key") || message.includes("api key")) {
        return new InvalidAgentConfig(`API key error: ${message}`);
      }
      if (
        message.includes("connect") ||
        message.includes("network") ||
        message.includes("fetch")
      ) {
        return new ConnectError(`Connection error: ${message}`);
      }
      return new VercelAIError(`AI SDK error: ${message}`);
    }
  }

  // Fallback for any other error types
  return new VercelAIError(`Unknown error: ${String(error)}`);
}

function toHistoryMessages(
  input: string | ChatMessage[]
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  if (typeof input === "string") {
    return [{ role: "user", content: input }];
  }
  // Drop id, just use role/content
  return input.map((m) => ({ role: m.role, content: m.content }));
}

function getProviderModel(config: AgentConfig) {
  switch (config.provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY)
        throw new InvalidAgentConfig("Missing OPENAI_API_KEY");
      return openai(config.model);
    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        throw new InvalidAgentConfig("Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return google(config.model);
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY)
        throw new InvalidAgentConfig("Missing ANTHROPIC_API_KEY");
      return anthropic(config.model);
    default:
      throw new InvalidAgentConfig(`Unknown provider: ${config.provider}`);
  }
}

export class AgentService extends Effect.Service<AgentServiceApi>()(
  "AgentService",
  {
    /**
     * Parameterized effect constructor: pass AgentConfig to create an agent instance.
     */
    effect: (config: AgentConfig): Effect.Effect<AgentServiceApi> =>
      Effect.succeed({
        generate: (input) =>
          Effect.tryPromise({
            try: async () => {
              const model = getProviderModel(config);
              const messages = toHistoryMessages(input);

              console.log(
                `[AgentService] Generate request for ${config.provider}:`,
                {
                  model: config.model,
                  messagesCount: messages.length,
                }
              );

              // PROVEN FIX: Use generateText (non-streaming) for all providers in generate method
              // This fixes the Gemini empty response issue identified in community forums
              const result = await generateText({
                model,
                messages,
              });

              console.log(
                `[AgentService] Generate response for ${config.provider}:`,
                {
                  hasText: !!result.text,
                  textLength: result.text?.length || 0,
                  usage: result.usage,
                  finishReason: result.finishReason,
                }
              );

              // Handle empty responses (common Gemini issue)
              if (!result.text || result.text.trim() === "") {
                console.warn(
                  `[AgentService] Empty response from ${config.provider}, retrying with different approach...`
                );

                // For Gemini, try a simple retry with a slightly different prompt
                if (config.provider === "google") {
                  const retryResult = await generateText({
                    model,
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are a helpful assistant. Please provide a complete response.",
                      },
                      ...messages,
                    ],
                  });

                  if (retryResult.text && retryResult.text.trim() !== "") {
                    console.log(
                      `[AgentService] Retry successful for ${config.provider}`
                    );
                    return {
                      content: retryResult.text,
                      usage: retryResult.usage,
                      finishReason: retryResult.finishReason,
                    };
                  }
                }

                // If still empty, return a meaningful error
                throw new InvalidAgentConfig(
                  `${config.provider} returned empty response. This is a known issue with Gemini API.`
                );
              }

              return {
                content: result.text,
                usage: result.usage,
                finishReason: result.finishReason,
              };
            },
            catch: mapVercelError,
          }),
        stream: (input) => {
          console.log(`[AgentService] Stream request for ${config.provider}`);

          // Simplified approach: use generateText for all providers and convert to single chunk stream
          return Stream.fromEffect(
            Effect.tryPromise({
              try: async () => {
                const model = getProviderModel(config);
                const messages = toHistoryMessages(input);

                console.log(
                  "[AgentService] Using non-streaming approach for known streaming issues"
                );

                const result = await generateText({ model, messages });

                console.log(
                  `[AgentService] ${config.provider} generateText result:`,
                  {
                    hasText: !!result.text,
                    textLength: result.text?.length || 0,
                    usage: result.usage,
                  }
                );

                if (!result.text || result.text.trim() === "") {
                  console.warn(
                    `[AgentService] ${config.provider} returned empty response`
                  );
                  return {
                    content: `Sorry, ${config.provider} API returned an empty response. Please try again.`,
                    usage: {
                      promptTokens: 0,
                      completionTokens: 0,
                      totalTokens: 0,
                    },
                    finishReason: "error",
                  };
                }

                return {
                  content: result.text,
                  usage: result.usage,
                  finishReason: result.finishReason,
                };
              },
              catch: mapVercelError,
            })
          );
        },
      }),
  }
) {}
// TODO: Add tool-calling and advanced agentic features using AI SDK 5 primitives
