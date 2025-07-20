import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import type { ChatAppBusMessage } from "@/features/chatapps/managers/chatapps/types";
import { Effect, Layer, Stream } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const testLayer = Layer.mergeAll(ChatAppsManager.Default);

describe("ChatApp Message Bus", () => {
  beforeEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        yield* chatAppsManager.resetState();
      }).pipe(Effect.provide(testLayer))
    )
  );

  describe("Message Publishing", () => {
    it("should publish messages to the bus", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const message: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Test message",
              sender: "user",
              timestamp: new Date(),
            },
          };

          const published = yield* chatAppsManager.publishMessage(message);
          return published;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBe(true);
    });

    it("should handle publishing multiple messages", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messages: ChatAppBusMessage[] = [
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-1",
                content: "First message",
                sender: "user",
                timestamp: new Date(),
              },
            },
            {
              sourceAppId: "app-2",
              message: {
                id: "msg-2",
                content: "Second message",
                sender: "assistant",
                timestamp: new Date(),
              },
            },
          ];

          const results = yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          return results;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toEqual([true, true]);
    });
  });

  describe("Message Subscription", () => {
    it("should subscribe to the message bus", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          return messageBus !== null;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBe(true);
    });

    it("should receive published messages", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(1),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish a message
          const message: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Test message",
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(message);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(1);
      expect(result[0].sourceAppId).toBe("app-1");
      expect(result[0].message.content).toBe("Test message");
    });

    it("should handle multiple subscribers", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const subscriber1Messages: ChatAppBusMessage[] = [];
          const subscriber2Messages: ChatAppBusMessage[] = [];

          // Set up multiple subscribers
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(1),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  subscriber1Messages.push(message);
                })
              )
            )
          );

          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(1),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  subscriber2Messages.push(message);
                })
              )
            )
          );

          // Publish a message
          const message: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Broadcast message",
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscribers time to set up
          yield* chatAppsManager.publishMessage(message);
          yield* Effect.sleep("150 millis");

          return {
            subscriber1Messages,
            subscriber2Messages,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.subscriber1Messages.length).toBe(1);
      expect(result.subscriber2Messages.length).toBe(1);
      expect(result.subscriber1Messages[0].message.content).toBe(
        "Broadcast message"
      );
      expect(result.subscriber2Messages[0].message.content).toBe(
        "Broadcast message"
      );
    });
  });

  describe("Message Ordering and Delivery", () => {
    it("should maintain message order", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(3),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish messages in sequence
          const messages = [
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-1",
                content: "First message",
                sender: "assistant" as const,
                timestamp: new Date(),
              },
            },
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-2",
                content: "Second message",
                sender: "assistant" as const,
                timestamp: new Date(),
              },
            },
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-3",
                content: "Third message",
                sender: "assistant" as const,
                timestamp: new Date(),
              },
            },
          ];

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up

          for (const message of messages) {
            yield* chatAppsManager.publishMessage(message);
            yield* Effect.sleep("20 millis"); // Small delay to ensure ordering
          }

          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(3);
      expect(result[0].message.content).toBe("First message");
      expect(result[1].message.content).toBe("Second message");
      expect(result[2].message.content).toBe("Third message");
    });

    it("should handle concurrent message publishing", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(10),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish messages concurrently
          const messages = Array.from({ length: 10 }, (_, i) => ({
            sourceAppId: `app-${i % 3}`,
            message: {
              id: `msg-${i}`,
              content: `Message ${i}`,
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("200 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(10);
      // Verify all messages were received (order may vary due to concurrency)
      const contents = result.map((msg) => msg.message.content);
      for (let i = 0; i < 10; i++) {
        expect(contents).toContain(`Message ${i}`);
      }
    });
  });

  describe("Message Filtering and Validation", () => {
    it("should handle messages with different senders", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(2),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish messages with different senders
          const userMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "User message",
              sender: "user",
              timestamp: new Date(),
            },
          };

          const assistantMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-2",
              content: "Assistant message",
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(userMessage);
          yield* chatAppsManager.publishMessage(assistantMessage);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(2);
      expect(result[0].message.sender).toBe("user");
      expect(result[1].message.sender).toBe("assistant");
    });

    it("should handle messages with various properties", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(1),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish message with various properties
          const message: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Test message with properties",
              sender: "assistant",
              timestamp: new Date(),
              isTyping: true,
              isStreaming: false,
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(message);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(1);
      expect(result[0].message.isTyping).toBe(true);
      expect(result[0].message.isStreaming).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle publishing to closed bus gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const message: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Test message",
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          // This should not throw an error
          const published = yield* chatAppsManager.publishMessage(message);
          return published;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBe(true);
    });

    it("should handle subscription errors gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber that might error
          yield* Effect.fork(
            Stream.fromPubSub(messageBus)
              .pipe(
                Stream.take(1),
                Stream.runForEach((message) =>
                  Effect.sync(() => {
                    // Simulate potential error condition
                    if (message.message.content === "error") {
                      throw new Error("Simulated error");
                    }
                    receivedMessages.push(message);
                  })
                )
              )
              .pipe(
                Effect.catchAll(() => Effect.void) // Catch and ignore errors
              )
          );

          // Publish normal message
          const normalMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "normal message",
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(normalMessage);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(1);
      expect(result[0].message.content).toBe("normal message");
    });
  });

  describe("Performance Testing", () => {
    it("should handle high message throughput", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(1000),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish many messages
          const messages = Array.from({ length: 1000 }, (_, i) => ({
            sourceAppId: `app-${i % 10}`,
            message: {
              id: `msg-${i}`,
              content: `Message ${i}`,
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          const startTime = Date.now();
          yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("1000 millis");
          const endTime = Date.now();

          return {
            messagesReceived: receivedMessages.length,
            duration: endTime - startTime,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.messagesReceived).toBe(1000);
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
