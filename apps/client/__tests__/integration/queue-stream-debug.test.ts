import { Effect, Layer, Queue, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "../../src/services/websocket";

describe("Queue/Stream Debug", () => {
  it("should debug WebSocket service queue/stream behavior", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("🔍 Starting WebSocket service queue/stream debug...");

        // Get WebSocket service
        const webSocketService = yield* WebSocketService;
        console.log("✅ Got WebSocket service");

        // Try to add a test message directly to see if stream works
        console.log("📤 Testing direct stream consumption...");

        // Start consuming stream in background
        const streamFiber = yield* Effect.fork(
          Effect.gen(function* () {
            console.log("🚀 Stream consumer started");

            const messages: any[] = [];
            yield* Stream.runForEach(
              webSocketService.messageStream,
              (message) => {
                console.log("🔥 STREAM CONSUMED MESSAGE:", message);
                messages.push(message);
                return Effect.unit;
              },
            );

            return messages;
          }),
        );

        console.log("⏳ Waiting a bit for stream consumer to start...");
        yield* Effect.sleep("100 millis");

        // Try to manually add a message to the internal queue
        console.log("📥 Attempting to trigger WebSocket message reception...");

        // Connect to WebSocket (this should create the queue/stream)
        yield* webSocketService.connect(
          "ws://localhost:8080/chat?chatId=queue-test",
        );
        console.log("✅ WebSocket connected");

        // Send a message to trigger a response
        yield* webSocketService.send({ text: "test message" });
        console.log("📤 Test message sent");

        // Wait for responses
        console.log("⏳ Waiting for responses...");
        yield* Effect.sleep("3 seconds");

        // Check if stream fiber collected any messages
        const fiberResult = yield* Effect.fork(Effect.succeed("timeout")).pipe(
          Effect.race(streamFiber),
          Effect.timeout("1 second"),
          Effect.catchAll(() => Effect.succeed("no messages")),
        );

        console.log("📊 Stream fiber result:", fiberResult);

        return {
          connected: true,
          streamWorking:
            fiberResult !== "timeout" && fiberResult !== "no messages",
        };
      }).pipe(
        Effect.provide(WebSocketService.Default),
        Effect.catchAll((error) => {
          console.error("❌ Test failed:", error);
          return Effect.succeed({ connected: false, streamWorking: false });
        }),
      ),
    );

    console.log("🏁 Final result:", result);
    expect(result.connected).toBe(true);
  }, 15000);
});
