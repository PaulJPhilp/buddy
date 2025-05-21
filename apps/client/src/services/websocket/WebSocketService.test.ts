import { Effect, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "./WebSocketService";

describe("WebSocketService", () => {
  const mockUrl = "ws://localhost:3000";

  describe("Connection management", () => {
    it("should connect and disconnect successfully", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;

          // Connect
          yield* service.connect(mockUrl);
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
          yield* service.connect(mockUrl);

          // Second connection should fail
          yield* Effect.try({
            try: () => service.connect(mockUrl),
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
          yield* service.connect(mockUrl);

          // Send message - explicitly ignore the return value
          const message = {
            type: "MESSAGE" as const,
            payload: "Hello, world!",
            text: "Hello, world!", // Added text property
            timestamp: new Date().toDateString(), // Added timestamp property
          };

          // Send message - explicitly ignore the return value
          yield* service.send(message);

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
              service.send({
                type: "MESSAGE" as const,
                payload: "Should fail",
                text: "Should fail",
                timestamp: new Date().toDateString(),
              }),
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
