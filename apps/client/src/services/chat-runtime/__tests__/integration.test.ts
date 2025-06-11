import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatService } from "../../chat/ChatService";
import { WebSocketService } from "../../websocket/WebSocketService";
import { AgentEndpointResolverService } from "../AgentEndpointResolverService";
import { ChatRuntimeService } from "../ChatRuntimeService";

describe("ChatRuntime Integration", () => {
  const TestLayer = Layer.mergeAll(
    WebSocketService.Default,
    AgentEndpointResolverService.Default,
    ChatService.Default,
    ChatRuntimeService.Default
  );

  it("should handle message flow", () =>
    Effect.gen(function* () {
      const runtime = yield* ChatRuntimeService;
      const chat = yield* ChatService;
      
      yield* runtime.start();
      
      // Send a message
      const message = yield* chat.sendMessage("test message");
      yield* runtime.send(message);
      
      // Verify response
      const response = yield* runtime.receive();
      expect(response).toBeDefined();
      expect(response.type).toBe("RESPONSE");
      
      yield* runtime.stop();
    }).pipe(Effect.provide(TestLayer)));

  it("should instantiate services without errors", () =>
    Effect.gen(function* () {
      const chat = yield* ChatService;
      expect(chat).toBeDefined();

      const chatRuntime = yield* ChatRuntimeService;
      expect(chatRuntime).toBeDefined();
    }).pipe(Effect.provide(TestLayer)));

  it("should handle service operations gracefully", () =>
    Effect.gen(function* () {
      const chat = yield* ChatService;

      // Test that service methods exist and are functions
      expect(typeof chat.sendMessage).toBe('function');
      expect(typeof chat.getState).toBe('function');
    }).pipe(Effect.provide(TestLayer)));
});
