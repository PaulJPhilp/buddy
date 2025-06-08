import { createWebSocketEnvelope } from "@buddy/protocol";
import { Effect, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "./WebSocketService";

describe("WebSocketService", () => {
  const serverUrl = "ws://localhost:8080/chat";

  describe("Connection management", () => {
    it("should connect and disconnect successfully", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          // Connect
          yield* service.connect(serverUrl);
          yield* Effect.sleep(100); // Give time for connection

          // Disconnect
          yield* service.disconnect();
        }).pipe(Effect.provide(WebSocketService.Default)),
      ));

    it("should handle connection errors", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          yield* Effect.try({
            try: () => service.connect("ws://invalid-url"),
            catch: (error) => {
              expect(error).toEqual({
                code: "CONNECT_ERROR",
                message: expect.any(String),
              });
            },
          });
        }).pipe(Effect.provide(WebSocketService.Default)),
      ));

    it("should prevent multiple connections", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          // First connection
          yield* service.connect(serverUrl);

          // Second connection should fail
          yield* Effect.try({
            try: () => service.connect(serverUrl),
            catch: (error) => {
              expect(error).toEqual({
                code: "CONNECT_ERROR",
                message: "WebSocket already connected",
              });
            },
          });

          // Cleanup
          yield* service.disconnect();
        }).pipe(Effect.provide(WebSocketService.Default)),
      ));
  });

  describe("Message handling", () => {
    it("should send and receive messages", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          // Connect using Effect.scoped to ensure cleanup
          yield* service.connect(serverUrl);

          // Send message
          const message = {
            type: "USER_MESSAGE" as const,
            text: "Hello, world!",
            timestamp: new Date().toISOString(),
            metadata: { chatId: "test-chat-id-123", agentId: "test-agent-001" },
          };
          const envelope = createWebSocketEnvelope(message);

          // Send message
          yield* service.send(envelope);

          // Receive message
          const received = yield* Stream.runHead(service.receive()); // received is Option<WebSocketMessage>
          expect(received).toEqual({ _tag: "Some", value: message });

          // Disconnect
          yield* service.disconnect();
        }).pipe(Effect.provide(WebSocketService.Default)),
      ));

    it("should handle send errors when not connected", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          yield* Effect.try({
            try: () =>
              service.send(
                createWebSocketEnvelope({
                  type: "USER_MESSAGE" as const,
                  text: "Should fail",
                  timestamp: new Date().toISOString(),
                  metadata: {
                    chatId: "test-chat-id-123",
                    agentId: "test-agent-001",
                  },
                }),
              ),
            catch: (error) => {
              expect(error).toEqual({
                code: "SEND_ERROR",
                message: "WebSocket not connected",
              });
            },
          });
        }).pipe(Effect.provide(WebSocketService.Default)),
      ));
  });
});
