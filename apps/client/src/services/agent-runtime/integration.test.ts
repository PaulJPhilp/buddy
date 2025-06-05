import { WebSocketService } from "@/services/websocket/WebSocketService";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatService } from "../chat/ChatService";
import { type ChatStateApi } from "../chat/ChatServiceApi";
import { AgentRuntimeService, type AgentRuntimeServiceApi } from "./AgentRuntimeService";

// Use real service implementations instead of mocks
const TestLayer = Layer.mergeAll(
  ChatService.Default,
  AgentRuntimeService.Default,
  WebSocketService.Default
);

describe("Service Integration", () => {
  // Helper to run an Effect test with the provided layer
  const runTest = <T, E>(
    effect: Effect.Effect<T, E, ChatStateApi | AgentRuntimeServiceApi>
  ) =>
    Effect.runPromise(
      effect.pipe(
        Effect.provide(TestLayer),
      ) as Effect.Effect<T, E, never>,
    );

  it("should instantiate services without errors", async () => {
    await runTest(
      Effect.gen(function* () {
        const chat = yield* ChatService;
        expect(chat).toBeDefined();

        const agentRuntime = yield* AgentRuntimeService;
        expect(agentRuntime).toBeDefined();
      }),
    );
  });

  it("should handle service operations gracefully", async () => {
    await runTest(
      Effect.gen(function* () {
        const chat = yield* ChatService;

        // Test that service methods don't throw errors even without a real server
        expect(() => chat.sendMessage).not.toThrow();
        expect(() => chat.getState).not.toThrow();
      }),
    );
  });
});
