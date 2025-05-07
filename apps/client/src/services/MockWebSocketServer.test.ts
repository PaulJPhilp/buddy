import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { MockWebSocketServer } from "./MockWebSocketServer";

describe("MockWebSocketServer", () => {
  describe("Server lifecycle", () => {
    it("should start and stop successfully", () =>
      Effect.gen(function* () {
        const server = yield* MockWebSocketServer;

        // Start server
        yield* server.start(3000);

        // Stop server
        yield* server.stop();
      }).pipe(Effect.runPromise));
  });

  describe("Message handling", () => {
    it("should handle message broadcast", () =>
      Effect.gen(function* () {
        const server = yield* MockWebSocketServer;
        const messages: unknown[] = [];

        // Start server
        yield* server.start(3000);

        // Add message handler
        yield* server.onMessage((message) =>
          Effect.sync(() => {
            messages.push(message);
          }),
        );

        // Broadcast message
        yield* server.broadcast({
          type: "MESSAGE",
          payload: "Test message",
        });

        // Verify message was received
        expect(messages).toHaveLength(1);
        expect(messages[0]).toEqual({
          type: "MESSAGE",
          payload: "Test message",
        });

        // Cleanup
        yield* server.stop();
      }).pipe(Effect.runPromise));

    it("should handle multiple message handlers", () =>
      Effect.gen(function* () {
        const server = yield* MockWebSocketServer;
        const messages1: unknown[] = [];
        const messages2: unknown[] = [];

        // Start server
        yield* server.start(3000);

        // Add message handlers
        yield* server.onMessage((message) =>
          Effect.sync(() => {
            messages1.push(message);
          }),
        );
        yield* server.onMessage((message) =>
          Effect.sync(() => {
            messages2.push(message);
          }),
        );

        // Broadcast message
        yield* server.broadcast({
          type: "MESSAGE",
          payload: "Test message",
        });

        // Verify both handlers received the message
        expect(messages1).toHaveLength(1);
        expect(messages2).toHaveLength(1);
        expect(messages1[0]).toEqual(messages2[0]);

        // Cleanup
        yield* server.stop();
      }).pipe(Effect.runPromise));
  });
});
