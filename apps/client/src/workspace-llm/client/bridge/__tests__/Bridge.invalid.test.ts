import { WebSocketService } from "@/services/websocket/WebSocketService";
import { workspaceStore } from "@/workspace/workspaceStore";
import { Effect, Layer, Queue, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { LlmWorkspaceBridge } from "../service";
import { TEST_WS_URL } from "./setup";

describe("Bridge invalid payload", () => {
  it("does not crash on malformed payload", async () => {
    // Create message queue
    const messageQueue = await Effect.runPromise(Queue.unbounded<unknown>());

    // Create mock WebSocketService
    const MockWebSocketService = Effect.gen(function* () {
      return {
        connect: () => Effect.unit,
        disconnect: () => Effect.unit,
        send: () => Effect.unit,
        receive: Stream.fromQueue(messageQueue),
        isConnected: true,
        messageStream: Stream.fromQueue(messageQueue),
      };
    });

    // Create layer with mock service
    const layer = Layer.merge(
      Layer.succeed(WebSocketService, MockWebSocketService),
      LlmWorkspaceBridge.Default,
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        // Reset store state
        workspaceStore.send({ type: "RESET" });

        // Start bridge
        yield* LlmWorkspaceBridge;

        // Send malformed message
        yield* Queue.offer(messageQueue, { type: "invalid" });

        // Allow time for error handling
        yield* Effect.sleep("50 millis");

        // Verify store state remains unchanged
        const state = workspaceStore.getSnapshot().context;
        expect(state.chatApps).toEqual({});
      }).pipe(Effect.provide(layer)),
    );
  });
});
