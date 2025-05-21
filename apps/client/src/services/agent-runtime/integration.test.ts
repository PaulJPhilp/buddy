import { ChatStateApi } from "@/app-chat";
import { ChatService } from "@/app-chat/ChatService";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import {
  AgentRuntimeError,
  AgentRuntimeService,
  AgentRuntimeServiceApi,
} from "./AgentRuntimeService.js";
import {
  MockWebSocketServer,
  MockWebSocketServerApi,
  WebSocketMessage,
} from "./MockWebSocketServer.js";
import {
  WebSocketError,
  WebSocketService,
  WebSocketServiceApi,
} from "./WebSocketService.js";

describe("WebSocket Stack Integration", () => {
  // Helper to setup test environment with mock server
  const withTestEnv = <T>(
    test: () => Effect.Effect<
      T,
      AgentRuntimeError | WebSocketError,
      | MockWebSocketServerApi
      | ChatStateApi
      | AgentRuntimeServiceApi
      | WebSocketServiceApi
    >,
  ) => {
    const program = Effect.gen(function* () {
      const server = yield* MockWebSocketServer;
      yield* server.start(3000);
      try {
        return yield* test();
      } finally {
        yield* server.stop();
      }
    });

    // Merge all required layers
    const TestLayer = Layer.mergeAll(
      ChatService.Default,
      AgentRuntimeService.Default,
      MockWebSocketServer.Default,
      WebSocketService.Default,
    );

    // Use runPromise since now Effect<T, Error, never>
    return Effect.runPromise(
      program.pipe(
        Effect.provide(TestLayer),
        Effect.withSpan("test-environment"),
      ),
    );
  };

  it("should handle full chat flow with WebSocket communication", () =>
    withTestEnv(() =>
      Effect.gen(function* () {
        const chat = yield* ChatService;
        const server = yield* MockWebSocketServer;

        // User sends a message
        const message = yield* chat.sendMessage("Hello");
        expect(message.text).toBe("Hello");

        // Server simulates thinking state
        yield* server.broadcast({
          type: "TYPING",
          payload: null,
          text: "",
          timestamp: "",
        });

        // Verify chat shows typing
        const typingState = yield* chat.getState();
        expect(typingState.isTyping).toBe(true);

        // Server sends response
        yield* server.broadcast({
          type: "MESSAGE",
          payload: "Hello! How can I help you?",
          text: "",
          timestamp: "",
        });

        // Verify final state
        const finalState = yield* chat.getState();
        expect(finalState.isTyping).toBe(false);
        expect(finalState.messages).toHaveLength(2);
        expect(finalState.messages[1].text).toBe("Hello! How can I help you?");
        expect(finalState.messages[1].sender).toBe("assistant");
      }),
    ));

  it("should handle multiple concurrent chat sessions", () =>
    withTestEnv(() =>
      Effect.gen(function* () {
        const chat = yield* ChatService;
        const server = yield* MockWebSocketServer;

        // Both chats send messages
        // (Add your concurrent chat logic here if needed)

        // Server responds to both
        yield* server.broadcast({
          type: "MESSAGE",
          payload: "Response to chat 1",
          text: "",
          timestamp: "",
        });
        yield* server.broadcast({
          type: "MESSAGE",
          payload: "Response to chat 2",
          text: "",
          timestamp: "",
        });

        // Verify states
        const state = yield* chat.getState();
        expect(state.messages).toHaveLength(4);
        expect(state.messages[1].text).toBe("Response to chat 1");
        expect(state.messages[3].text).toBe("Response to chat 2");
      }),
    ));

  it("should handle disconnection and reconnection", () =>
    withTestEnv(() =>
      Effect.gen(function* () {
        const chat = yield* ChatService;
        const runtime = yield* AgentRuntimeService;

        // Initial message
        yield* chat.sendMessage("Hello");

        // Stop runtime
        yield* runtime.stop();

        // Try to send message while disconnected
        yield* Effect.try({
          try: function* () {
            yield* chat.sendMessage("Should fail");
            expect(true).toBe(false); // Should not reach here
          },
          catch: (error) => {
            expect(error).toMatchObject({
              type: "RUNTIME_ERROR",
              code: "SEND_ERROR",
            });
            return error as AgentRuntimeError; // Ensure proper error type
          },
        }).pipe(
          Effect.mapError((e) => e as WebSocketError | AgentRuntimeError),
        );

        // Restart runtime
        yield* runtime.start();

        // Should work again
        const message = yield* chat.sendMessage("After reconnect");
        expect(message.text).toBe("After reconnect");
      }),
    ));
});
