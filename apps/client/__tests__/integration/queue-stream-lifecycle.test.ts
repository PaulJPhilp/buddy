import { Effect, Fiber, Queue, Stream } from "effect";
import { describe, expect, it } from "vitest";

describe("Queue-Stream Lifecycle Test", () => {
  it("should handle queue/stream lifecycle exactly like WebSocketService", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log(
          "🧪 Testing exact WebSocketService queue/stream pattern...",
        );

        // Step 1: Create queue and stream (like WebSocketService constructor)
        const messageQueue = yield* Queue.unbounded<any>();
        const messageStream = Stream.fromQueue(messageQueue);

        console.log("✅ Created queue and stream");

        // Step 2: Start stream consumer (like ChatService does)
        const consumedMessages: any[] = [];
        const consumerFiber = yield* Effect.fork(
          Stream.runForEach(messageStream, (message) =>
            Effect.sync(() => {
              console.log("📨 Stream consumed:", message);
              consumedMessages.push(message);
            }),
          ),
        );

        console.log("✅ Started stream consumer");

        // Step 3: Simulate WebSocket message arrival (like onmessage handler)
        // This mimics the exact pattern in WebSocketService
        const simulateWebSocketMessage = (data: string) => {
          console.log("📡 Simulating WebSocket message:", data);

          const parsed = JSON.parse(data);
          const protocolMessage = {
            id: parsed.id,
            type: "RESPONSE",
            payload: {
              type: parsed.type,
              content: parsed.content,
            },
          };

          // This is the exact pattern from WebSocketService
          try {
            Effect.runSync(Queue.offer(messageQueue, protocolMessage));
            console.log("✅ Message added to queue (sync)");
          } catch (error) {
            console.error("❌ Failed to add message to queue:", error);
            throw error;
          }
        };

        // Step 4: Wait a bit then send messages (like real WebSocket timing)
        yield* Effect.sleep("100 millis");

        simulateWebSocketMessage(
          '{"id":"1","type":"LLM_STREAM","content":"Hello"}',
        );
        yield* Effect.sleep("50 millis");

        simulateWebSocketMessage(
          '{"id":"2","type":"LLM_STREAM","content":" World"}',
        );
        yield* Effect.sleep("50 millis");

        simulateWebSocketMessage(
          '{"id":"3","type":"LLM_RESPONSE","content":"Hello World"}',
        );
        yield* Effect.sleep("200 millis");

        // Step 5: Check results
        console.log("📊 Final consumed messages:", consumedMessages);

        // Cleanup
        yield* Fiber.interrupt(consumerFiber);

        return {
          messagesConsumed: consumedMessages.length,
          expectedMessages: 3,
          allMessagesReceived: consumedMessages.length === 3,
          streamWorking: consumedMessages.length > 0,
          queueStreamPattern: "SUCCESS",
        };
      }),
    );

    expect(result.streamWorking).toBe(true);
    expect(result.allMessagesReceived).toBe(true);
    expect(result.messagesConsumed).toBe(3);

    console.log("✅ Queue/Stream lifecycle test passed!");
  });

  it("should test concurrent queue operations like real browser", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("🧪 Testing concurrent queue operations...");

        const messageQueue = yield* Queue.unbounded<string>();
        const messageStream = Stream.fromQueue(messageQueue);

        const consumedMessages: string[] = [];
        const consumerFiber = yield* Effect.fork(
          Stream.runForEach(messageStream, (message) =>
            Effect.sync(() => {
              console.log("📨 Concurrent stream consumed:", message);
              consumedMessages.push(message);
            }),
          ),
        );

        // Simulate rapid message arrival (like real WebSocket bursts)
        const sendMessage = (msg: string) => {
          try {
            Effect.runSync(Queue.offer(messageQueue, msg));
            console.log(`✅ Added "${msg}" to queue`);
          } catch (error) {
            console.error(`❌ Failed to add "${msg}":`, error);
            throw error;
          }
        };

        // Send messages rapidly
        sendMessage("msg1");
        sendMessage("msg2");
        sendMessage("msg3");
        sendMessage("msg4");
        sendMessage("msg5");

        // Wait for processing
        yield* Effect.sleep("500 millis");

        yield* Fiber.interrupt(consumerFiber);

        return {
          sent: 5,
          consumed: consumedMessages.length,
          success: consumedMessages.length === 5,
        };
      }),
    );

    expect(result.success).toBe(true);
    console.log("✅ Concurrent operations test passed!");
  });

  it("should test Effect.runSync timing like WebSocketService", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("🧪 Testing Effect.runSync timing...");

        const messageQueue = yield* Queue.unbounded<any>();
        const messageStream = Stream.fromQueue(messageQueue);

        let streamStarted = false;
        let firstMessageTime = 0;
        let streamConsumedTime = 0;

        // Start consumer with timing
        const consumerFiber = yield* Effect.fork(
          Stream.runForEach(messageStream, (message) =>
            Effect.sync(() => {
              if (!streamStarted) {
                streamStarted = true;
                streamConsumedTime = Date.now();
                console.log(
                  "📨 First message consumed at:",
                  streamConsumedTime - firstMessageTime,
                  "ms after send",
                );
              }
            }),
          ),
        );

        yield* Effect.sleep("10 millis");

        // Send message with timing
        firstMessageTime = Date.now();
        Effect.runSync(Queue.offer(messageQueue, { test: "timing" }));
        console.log("✅ Message sent via Effect.runSync");

        // Wait for consumption
        yield* Effect.sleep("100 millis");

        yield* Fiber.interrupt(consumerFiber);

        return {
          streamStarted,
          timingDelta: streamConsumedTime - firstMessageTime,
          success: streamStarted && streamConsumedTime - firstMessageTime < 50,
        };
      }),
    );

    expect(result.streamStarted).toBe(true);
    console.log(`✅ Timing test passed! Delta: ${result.timingDelta}ms`);
  });
});
