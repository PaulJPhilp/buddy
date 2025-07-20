import { ChatManager } from "@/features/chatapps/chatapp/managers/chat";
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import type { ChatAppBusMessage } from "@/features/chatapps/managers/chatapps/types";
import { Effect, Layer, Stream } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const testLayer = Layer.mergeAll(ChatManager.Default, ChatAppsManager.Default);

describe("ChatApp Communication Error Handling", () => {
  beforeEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;
        yield* chatManager.resetState();
        yield* chatAppsManager.resetState();
      }).pipe(Effect.provide(testLayer))
    )
  );

  describe("Invalid Message Handling", () => {
    it("should handle malformed bus messages gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          // Try to publish an invalid message structure
          const invalidMessage = {
            sourceAppId: "app-1",
            // Missing required message field
          } as any;

          // This should not crash the system
          const published = yield* chatAppsManager
            .publishMessage(invalidMessage)
            .pipe(Effect.catchAll(() => Effect.succeed(false)));

          return published;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle gracefully
      expect(typeof result).toBe("boolean");
    });

    it("should handle empty or null message content", async () => {
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

          // Publish messages with empty/null content
          const emptyMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "",
              sender: "user",
              timestamp: new Date(),
            },
          };

          const nullMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-2",
              content: null as any,
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(emptyMessage);
          yield* chatAppsManager.publishMessage(nullMessage);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(2);
      expect(result[0].message.content).toBe("");
      expect(result[1].message.content).toBe(null);
    });

    it("should handle messages with missing timestamps", async () => {
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

          // Publish message without timestamp
          const messageWithoutTimestamp: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: "Message without timestamp",
              sender: "user",
              timestamp: undefined as any,
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(messageWithoutTimestamp);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(1);
      expect(result[0].message.content).toBe("Message without timestamp");
    });
  });

  describe("Subscription Error Handling", () => {
    it("should handle subscription to non-existent app gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register app that subscribes to non-existent app
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "non-existent-app" }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversation
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );
          yield* chatManager.setActiveConversation(subscriberConvId);

          // This should not crash
          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(0);
    });

    it("should handle circular subscription references", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Create circular subscription: A -> B -> A
          const appAConfig = {
            id: "app-a",
            name: "App A",
            agentId: "agent-a",
            toolbarId: "toolbar-a",
            subscriptions: [{ appId: "app-b", maxTurns: 1 }],
          };

          const appBConfig = {
            id: "app-b",
            name: "App B",
            agentId: "agent-b",
            toolbarId: "toolbar-b",
            subscriptions: [{ appId: "app-a", maxTurns: 1 }],
          };

          yield* chatAppsManager.registerChatApp("ws-1", "app-a", appAConfig);
          yield* chatAppsManager.registerChatApp("ws-1", "app-b", appBConfig);

          // Start conversations
          const convAId = yield* chatManager.startConversation(
            "agent-a",
            undefined,
            appAConfig
          );
          const convBId = yield* chatManager.startConversation(
            "agent-b",
            undefined,
            appBConfig
          );

          // Set app B as active and trigger the circular reference
          yield* chatManager.setActiveConversation(convBId);
          yield* chatManager.sendMessage(convAId, "Start circular test");

          yield* Effect.sleep("200 millis");

          // Switch to app A and send from B
          yield* chatManager.setActiveConversation(convAId);
          yield* chatManager.sendMessage(convBId, "Continue circular test");

          yield* Effect.sleep("200 millis");

          const messagesInA = yield* chatManager.getMessages(convAId);
          const messagesInB = yield* chatManager.getMessages(convBId);

          return {
            messagesInA: messagesInA.length,
            messagesInB: messagesInB.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle circular references without infinite loops
      expect(result.messagesInA).toBeGreaterThan(0);
      expect(result.messagesInB).toBeGreaterThan(0);
      expect(result.messagesInA).toBeLessThan(10); // Should not create infinite loop
      expect(result.messagesInB).toBeLessThan(10);
    });

    it("should handle subscription configuration changes during message processing", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app", maxTurns: 5 }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app",
            sourceAppConfig
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations
          const sourceConvId = yield* chatManager.startConversation(
            "agent-source",
            undefined,
            sourceAppConfig
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send some messages
          yield* chatManager.sendMessage(sourceConvId, "Message 1");
          yield* Effect.sleep("50 millis");

          // Change subscription configuration while processing
          const updatedConfig = {
            ...subscriberAppConfig,
            subscriptions: [], // Remove subscription
          };

          yield* chatAppsManager.updateChatAppConfig(
            "subscriber-app",
            updatedConfig
          );

          // Send more messages
          yield* chatManager.sendMessage(sourceConvId, "Message 2");
          yield* Effect.sleep("50 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle configuration changes gracefully
      expect(result.length).toBe(1); // Only first message should be received
      expect(result[0].content).toBe("Message 1");
    });
  });

  describe("Concurrent Access Error Handling", () => {
    it("should handle concurrent message publishing", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(50),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish many messages concurrently
          const messages = Array.from({ length: 50 }, (_, i) => ({
            sourceAppId: `app-${i % 5}`,
            message: {
              id: `msg-${i}`,
              content: `Concurrent message ${i}`,
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("300 millis");

          return receivedMessages.length;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBe(50);
    });

    it("should handle concurrent subscription and unsubscription", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register many apps concurrently
          const appConfigs = Array.from({ length: 10 }, (_, i) => ({
            id: `app-${i}`,
            name: `App ${i}`,
            agentId: `agent-${i}`,
            toolbarId: `toolbar-${i}`,
            subscriptions: i > 0 ? [{ appId: `app-${i - 1}` }] : [],
          }));

          yield* Effect.forEach(
            appConfigs,
            (config) =>
              chatAppsManager.registerChatApp("ws-1", config.id, config),
            { concurrency: "unbounded" }
          );

          // Start conversations concurrently
          const conversationIds = yield* Effect.forEach(
            appConfigs,
            (config) =>
              chatManager.startConversation(config.agentId, undefined, config),
            { concurrency: "unbounded" }
          );

          // Unregister some apps while others are still active
          yield* Effect.forEach(
            appConfigs.slice(5),
            (config) => chatAppsManager.unregisterChatApp(config.id),
            { concurrency: "unbounded" }
          );

          // Try to send messages from remaining apps
          yield* chatManager.setActiveConversation(conversationIds[1]);
          yield* chatManager.sendMessage(conversationIds[0], "Test message");

          yield* Effect.sleep("100 millis");

          const messages = yield* chatManager.getMessages(conversationIds[1]);
          return messages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle concurrent operations gracefully
      expect(result.length).toBe(1);
      expect(result[0].content).toBe("Test message");
    });
  });

  describe("Resource Cleanup Error Handling", () => {
    it("should handle cleanup when apps are unregistered", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app" }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app",
            sourceAppConfig
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations
          const sourceConvId = yield* chatManager.startConversation(
            "agent-source",
            undefined,
            sourceAppConfig
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send a message
          yield* chatManager.sendMessage(
            sourceConvId,
            "Message before unregister"
          );
          yield* Effect.sleep("50 millis");

          // Unregister the source app
          yield* chatAppsManager.unregisterChatApp("source-app");

          // Try to send another message (should not crash)
          yield* chatManager
            .sendMessage(sourceConvId, "Message after unregister")
            .pipe(Effect.catchAll(() => Effect.void));

          yield* Effect.sleep("50 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive message sent before unregistration
      expect(result.length).toBe(1);
      expect(result[0].content).toBe("Message before unregister");
    });

    it("should handle state reset during active subscriptions", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app" }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app",
            sourceAppConfig
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations
          const sourceConvId = yield* chatManager.startConversation(
            "agent-source",
            undefined,
            sourceAppConfig
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send a message
          yield* chatManager.sendMessage(sourceConvId, "Message before reset");
          yield* Effect.sleep("50 millis");

          // Reset state
          yield* chatAppsManager.resetState();
          yield* chatManager.resetState();

          // Try to send another message (should not crash)
          yield* chatManager
            .sendMessage(sourceConvId, "Message after reset")
            .pipe(Effect.catchAll(() => Effect.void));

          yield* Effect.sleep("50 millis");

          // Try to get messages (should handle gracefully)
          const subscriberMessages = yield* chatManager
            .getMessages(subscriberConvId)
            .pipe(Effect.catchAll(() => Effect.succeed([])));

          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle state reset gracefully
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Message Bus Error Recovery", () => {
    it("should recover from subscriber errors", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];
          let errorCount = 0;

          // Set up subscriber that errors on certain messages
          yield* Effect.fork(
            Stream.fromPubSub(messageBus)
              .pipe(
                Stream.take(3),
                Stream.runForEach((message) =>
                  Effect.sync(() => {
                    if (message.message.content === "error-trigger") {
                      errorCount++;
                      throw new Error("Simulated subscriber error");
                    }
                    receivedMessages.push(message);
                  })
                )
              )
              .pipe(
                Effect.catchAll(() => Effect.void) // Catch and ignore errors
              )
          );

          // Publish messages including error-triggering one
          const messages: ChatAppBusMessage[] = [
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-1",
                content: "normal message",
                sender: "assistant",
                timestamp: new Date(),
              },
            },
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-2",
                content: "error-trigger",
                sender: "assistant",
                timestamp: new Date(),
              },
            },
            {
              sourceAppId: "app-1",
              message: {
                id: "msg-3",
                content: "recovery message",
                sender: "assistant",
                timestamp: new Date(),
              },
            },
          ];

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up

          for (const message of messages) {
            yield* chatAppsManager.publishMessage(message);
            yield* Effect.sleep("50 millis");
          }

          yield* Effect.sleep("150 millis");

          return {
            receivedMessages: receivedMessages.length,
            errorCount,
          };
        }).pipe(Effect.provide(testLayer))
      );

      // Should recover from errors and continue processing
      expect(result.receivedMessages).toBe(2); // Should receive non-error messages
      expect(result.errorCount).toBe(1); // Should have encountered the error
    });

    it("should handle bus overflow gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up slow subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(100),
              Stream.runForEach((message) =>
                Effect.gen(function* () {
                  yield* Effect.sleep("10 millis"); // Slow processing
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Publish messages rapidly
          const messages = Array.from({ length: 100 }, (_, i) => ({
            sourceAppId: `app-${i % 10}`,
            message: {
              id: `msg-${i}`,
              content: `Rapid message ${i}`,
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("2000 millis"); // Wait for processing

          return receivedMessages.length;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle high throughput without dropping messages
      expect(result).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle messages when no active conversation exists", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app" }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app",
            sourceAppConfig
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations but don't set active
          const sourceConvId = yield* chatManager.startConversation(
            "agent-source",
            undefined,
            sourceAppConfig
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          // Send message without active conversation
          yield* chatManager.sendMessage(
            sourceConvId,
            "Message without active conversation"
          );
          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should not receive messages when no active conversation
      expect(result.length).toBe(0);
    });

    it("should handle extremely long message content", async () => {
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

          // Create extremely long message content
          const longContent = "A".repeat(10000);

          const longMessage: ChatAppBusMessage = {
            sourceAppId: "app-1",
            message: {
              id: "msg-1",
              content: longContent,
              sender: "assistant",
              timestamp: new Date(),
            },
          };

          yield* Effect.sleep("50 millis"); // Give subscriber time to set up
          yield* chatAppsManager.publishMessage(longMessage);
          yield* Effect.sleep("150 millis");

          return receivedMessages;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.length).toBe(1);
      expect(result[0].message.content.length).toBe(10000);
    });

    it("should handle rapid subscription configuration changes", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app", maxTurns: 1 }],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app",
            sourceAppConfig
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Rapidly change subscription configuration
          const configChanges = [
            {
              ...subscriberAppConfig,
              subscriptions: [{ appId: "source-app", maxTurns: 2 }],
            },
            {
              ...subscriberAppConfig,
              subscriptions: [{ appId: "source-app", maxTurns: 3 }],
            },
            {
              ...subscriberAppConfig,
              subscriptions: [{ appId: "source-app", maxTurns: 1 }],
            },
            { ...subscriberAppConfig, subscriptions: [] },
            {
              ...subscriberAppConfig,
              subscriptions: [{ appId: "source-app", maxTurns: 5 }],
            },
          ];

          yield* Effect.forEach(
            configChanges,
            (config) =>
              chatAppsManager.updateChatAppConfig("subscriber-app", config),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("100 millis");

          // Verify final configuration
          const finalInstance = yield* chatAppsManager.getChatAppInstance(
            "subscriber-app"
          );
          return finalInstance.config.subscriptions;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle rapid changes and end up with the final configuration
      expect(result).toEqual([{ appId: "source-app", maxTurns: 5 }]);
    });
  });
});
