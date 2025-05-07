import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AgentRuntimeService } from "./AgentRuntimeService";

describe("AgentRuntimeService", () => {
  describe("Runtime lifecycle", () => {
    it("should start and stop successfully", () =>
      Effect.gen(function* () {
        const runtime = yield* AgentRuntimeService;

        // Start runtime
        yield* runtime.start();

        // Stop runtime
        yield* runtime.stop();
      }).pipe(Effect.runPromise));

    it("should handle start errors", () =>
      Effect.gen(function* () {
        const runtime = yield* AgentRuntimeService;

        yield* Effect.try({
          try: function* () {
            // Mock websocket service is not running
            yield* runtime.start();
            expect(true).toBe(false); // Should not reach here
          },
          catch: (error) => {
            expect(error).toEqual({
              type: "RUNTIME_ERROR",
              code: "CONNECT_ERROR",
              message: expect.any(String),
            });
          },
        });
      }).pipe(Effect.runPromise));
  });

  describe("Message handling", () => {
    it("should send messages and handle state updates", () =>
      Effect.gen(function* () {
        const runtime = yield* AgentRuntimeService;

        // Start runtime
        yield* runtime.start();

        // Send message
        yield* runtime.sendMessage("Hello");

        // Get state updates
        const stateUpdates = yield* runtime.getState.pipe(
          Effect.take(2),
          Effect.runCollect,
        );

        // Should see thinking state followed by response
        expect(stateUpdates).toHaveLength(2);
        expect(stateUpdates[0].status).toBe("thinking");
        expect(stateUpdates[1].status).toBe("idle");
        expect(stateUpdates[1].message).toBeDefined();

        // Stop runtime
        yield* runtime.stop();
      }).pipe(Effect.runPromise));

    it("should handle send errors when not started", () =>
      Effect.gen(function* () {
        const runtime = yield* AgentRuntimeService;

        yield* Effect.try({
          try: function* () {
            yield* runtime.sendMessage("Should fail");
            expect(true).toBe(false); // Should not reach here
          },
          catch: (error) => {
            expect(error).toEqual({
              type: "RUNTIME_ERROR",
              code: "SEND_ERROR",
              message: "WebSocket not connected",
            });
          },
        });
      }).pipe(Effect.runPromise));
  });
});
