import { Effect, Ref } from "effect";
import type { MessageApi } from "./ChatServiceApi";

export interface AgentConfig {
  name: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  text: string;
  metadata?: {
    thinking?: boolean;
    error?: string;
  };
}

export interface SimpleChatAgentApi {
  readonly processMessage: (
    message: MessageApi,
  ) => Effect.Effect<AgentResponse, Error>;
  readonly getConfig: () => Effect.Effect<AgentConfig, Error>;
  readonly updateConfig: (
    config: Partial<AgentConfig>,
  ) => Effect.Effect<AgentConfig, Error>;
}

const DEFAULT_CONFIG: AgentConfig = {
  name: "Assistant",
  systemPrompt: "You are a helpful AI assistant.",
  temperature: 0.7,
  maxTokens: 1000,
};

function formatPrompt(config: AgentConfig, message: MessageApi): string {
  return `${config.systemPrompt || ""}

User: ${message.text}
Assistant:`;
}

/**
 * Implementation of the SimpleChatAgent using Effect.Service pattern.
 * Provides chat functionality with configurable settings.
 */
export class SimpleChatAgent extends Effect.Service<SimpleChatAgentApi>()(
  "SimpleChatAgent",
  {
    effect: Effect.gen(function* (_) {
      const configRef = yield* Ref.make(DEFAULT_CONFIG);

      return {
        updateConfig: (newConfig: Partial<AgentConfig>) =>
          Effect.gen(function* (_) {
            const currentConfig = yield* Ref.get(configRef);
            const updatedConfig = { ...currentConfig, ...newConfig };
            yield* Ref.set(configRef, updatedConfig);
            return updatedConfig;
          }),

        processMessage: (message: MessageApi) =>
          Effect.gen(function* (_) {
            const config = yield* Ref.get(configRef);

            return yield* Effect.try({
              try: function* () {
                const prompt = formatPrompt(config, message);

                const response = yield* Effect.tryPromise(() =>
                  fetch("http://localhost:3000/api/tools/sampleLlm", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      prompt,
                      maxTokens: config.maxTokens,
                    }),
                  }).then((res) => res.json()),
                );

                if (response.error) {
                  throw new Error(response.error);
                }

                return {
                  text:
                    response.text ||
                    "I apologize, but I'm having trouble generating a response.",
                  metadata: {
                    thinking: false,
                  },
                };
              },
              catch: (error) => {
                console.error("Error calling LLM:", error);
                return {
                  text: "I apologize, but I'm having trouble processing your message right now.",
                  metadata: {
                    thinking: false,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  },
                };
              },
            });
          }),

        getConfig: () => Ref.get(configRef),
      };
    }),
    dependencies: [],
  },
) {}
