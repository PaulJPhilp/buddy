import { WebSocketServiceMock } from "@/services/websocket/MockWebSocketService";
import { type WebSocketServiceApi } from "@/services/websocket/WebSocketService";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatService } from "../../services/chat/ChatService";
import { AgentRuntimeService, type AgentRuntimeServiceApi } from "./AgentRuntimeService";

// Provide only the required layers in the correct order
const TestLayer = Layer.mergeAll(
  ChatService.Default,
  AgentRuntimeService.Default,
  WebSocketServiceMock.Default,
);

describe("WebSocket Stack Integration", () => {
  // Helper to run an Effect test with the provided layer
  const runTest = <T, E, R extends Effect.Effect.Context<typeof ChatService> | AgentRuntimeServiceApi | WebSocketServiceApi>(
    effect: Effect.Effect<T, E, R>
  ) =>
    Effect.runPromise(
      effect.pipe(
        Effect.provide(TestLayer),
      ),
    );

  it("should send a message and return the correct result", async () => {
    await runTest(
      Effect.gen(function* () {
        const chat = yield* ChatService;
        const message = yield* chat.sendMessage("Hello, world!");
        expect(message.text).toBe("Hello, world!");
        expect(message.sender).toBe("user");
      }),
    );
  });

  // Add more tests for other public API methods as needed
});
