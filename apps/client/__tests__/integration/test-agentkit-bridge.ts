import { Effect, Layer, Ref, Stream } from "effect";
import { AgentKitBridge } from "../../src/services/agentkit-bridge";
import type {
  AgentKitConfig,
  Provider,
} from "../../src/services/agentkit-bridge/api";
import { AgentKitError } from "../../src/services/agentkit-bridge/service";
import { TEST_AGENT } from "./test-agent-config";

// Simulate network delay
const simulateDelay = () => Effect.sleep("100 millis");

// Export the test AgentKitBridge layer
export const TestAgentKitBridgeLayer = Layer.scoped(
  AgentKitBridge,
  Effect.gen(function* () {
    // Keep track of current provider and model
    const configRef = yield* Ref.make<AgentKitConfig>({
      provider: "test",
      model: "test-model",
    });

    return {
      generateMessage: (message: string) =>
        Effect.gen(function* () {
          // Simulate network delay
          yield* simulateDelay();

          // Get current config
          const config = yield* Ref.get(configRef);

          // Handle special test cases
          if (message.includes("error")) {
            throw new AgentKitError({
              message: "Test error response",
              cause: new Error("Simulated error"),
            });
          }

          return {
            id: "test-response",
            content: "Test response",
            provider: config.provider,
            model: config.model,
            timestamp: Date.now(),
            usage: {
              promptTokens: 10,
              completionTokens: 20,
              totalTokens: 30,
            },
          };
        }),

      streamMessage: (message: string) =>
        Effect.gen(function* () {
          // Get current config
          const config = yield* Ref.get(configRef);

          // Handle error test case
          if (message.includes("error")) {
            throw new AgentKitError({
              message: "Test streaming error",
              cause: new Error("Simulated streaming error"),
            });
          }

          // Create a realistic streaming response
          return Stream.fromIterable([
            {
              id: "test-stream",
              content: "Hello",
              provider: config.provider,
              model: config.model,
              timestamp: Date.now(),
            },
            {
              id: "test-stream",
              content: ", ",
              provider: config.provider,
              model: config.model,
              timestamp: Date.now(),
            },
            {
              id: "test-stream",
              content: "test",
              provider: config.provider,
              model: config.model,
              timestamp: Date.now(),
            },
            {
              id: "test-stream",
              content: " ",
              provider: config.provider,
              model: config.model,
              timestamp: Date.now(),
            },
            {
              id: "test-stream",
              content: "agent!",
              provider: config.provider,
              model: config.model,
              timestamp: Date.now(),
              usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30,
              },
            },
          ]).pipe(
            // Add realistic delays between chunks
            Stream.tap(() => simulateDelay()),
          );
        }).pipe(Effect.flatten),

      setProvider: (provider: Provider, model?: string) =>
        Effect.gen(function* () {
          yield* simulateDelay();

          // Validate provider
          if (provider === "invalid") {
            throw new AgentKitError({
              message: "Invalid provider",
              cause: new Error("Provider not supported"),
            });
          }

          // Update config
          yield* Ref.set(configRef, {
            provider,
            model: model ?? "default-model",
          });
        }),

      getProvider: () =>
        Effect.gen(function* () {
          yield* simulateDelay();
          return yield* Ref.get(configRef);
        }),
    };
  }),
);
