import type { ChatAppConfig } from "../../src/features/application/types/AppConfig";
import { ChatManager } from "../../src/features/chatapps/features/chatapp/managers/service";
import { ChatAppsManager } from "../../src/features/chatapps/manager/service";

// Use the ChatAppConfig to define SubscriptionConfig
type SubscriptionConfig = ChatAppConfig["subscriptions"][number]; // Correctly derive SubscriptionConfig

import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const testLayer = Layer.mergeAll(ChatManager.Default, ChatAppsManager.Default);

describe("ChatApp Subscription Configuration", () => {
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

  describe("Basic Subscription Configuration", () => {
    it("should configure simple subscription", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register source app
          const sourceAppConfig = {
            id: "source-app",
            name: "Source App",
            agentId: "agent-source",
            toolbarId: "toolbar-source",
          };

          // Register subscriber app
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app" }] as SubscriptionConfig[],
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

          // Verify subscription configuration
          const subscriberInstance = yield* chatAppsManager.getChatAppInstance(
            "subscriber-app"
          );
          return subscriberInstance.config.subscriptions;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toEqual([{ appId: "source-app" }]);
    });

    it("should configure subscription with maxTurns", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with maxTurns subscription
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
            subscriptions: [
              { appId: "source-app", maxTurns: 3 },
            ] as SubscriptionConfig[],
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

          // Verify subscription configuration
          const subscriberInstance = yield* chatAppsManager.getChatAppInstance(
            "subscriber-app"
          );
          return subscriberInstance.config.subscriptions;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toEqual([{ appId: "source-app", maxTurns: 3 }]);
    });

    it("should handle multiple subscriptions", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register multiple source apps
          const sourceApp1Config = {
            id: "source-app-1",
            name: "Source App 1",
            agentId: "agent-source-1",
            toolbarId: "toolbar-source-1",
          };

          const sourceApp2Config = {
            id: "source-app-2",
            name: "Source App 2",
            agentId: "agent-source-2",
            toolbarId: "toolbar-source-2",
          };

          // Register subscriber app with multiple subscriptions
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [
              { appId: "source-app-1", maxTurns: 2 },
              { appId: "source-app-2", maxTurns: 5 },
            ] as SubscriptionConfig[],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-1",
            sourceApp1Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-2",
            sourceApp2Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Verify subscription configuration
          const subscriberInstance = yield* chatAppsManager.getChatAppInstance(
            "subscriber-app"
          );
          return subscriberInstance.config.subscriptions;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toEqual([
        { appId: "source-app-1", maxTurns: 2 },
        { appId: "source-app-2", maxTurns: 5 },
      ]);
    });
  });

  describe("Subscription Filtering", () => {
    it("should only receive messages from subscribed apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register multiple source apps
          const sourceApp1Config = {
            id: "source-app-1",
            name: "Source App 1",
            agentId: "agent-source-1",
            toolbarId: "toolbar-source-1",
          };

          const sourceApp2Config = {
            id: "source-app-2",
            name: "Source App 2",
            agentId: "agent-source-2",
            toolbarId: "toolbar-source-2",
          };

          // Register subscriber app that only subscribes to source-app-1
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [{ appId: "source-app-1" }] as SubscriptionConfig[],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-1",
            sourceApp1Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-2",
            sourceApp2Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations
          const conv1Id = yield* chatManager.startConversation(
            "agent-source-1",
            undefined,
            sourceApp1Config
          );
          const conv2Id = yield* chatManager.startConversation(
            "agent-source-2",
            undefined,
            sourceApp2Config
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages from both source apps
          yield* chatManager.sendMessage(conv1Id, "Message from source-app-1");
          yield* chatManager.sendMessage(conv2Id, "Message from source-app-2");

          yield* Effect.sleep("100 millis");

          // Check messages in subscriber
          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should only receive message from source-app-1
      expect(result.length).toBe(1);
      expect(result[0].content).toBe("Message from source-app-1");
    });

    it("should handle subscription to non-existent app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register subscriber app that subscribes to non-existent app
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [
              { appId: "non-existent-app" },
            ] as SubscriptionConfig[],
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

          // Wait to ensure no crashes
          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle gracefully with no messages
      expect(result.length).toBe(0);
    });
  });

  describe("MaxTurns Configuration", () => {
    it("should enforce maxTurns limit", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with maxTurns = 2
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
            subscriptions: [
              { appId: "source-app", maxTurns: 2 },
            ] as SubscriptionConfig[],
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

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages beyond maxTurns limit
          yield* chatManager.sendMessage(sourceConvId, "Message 1");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 2");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 3"); // Should be ignored
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 4"); // Should be ignored

          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should only receive first 2 messages
      expect(result.length).toBe(2);
      expect(result[0].content).toBe("Message 1");
      expect(result[1].content).toBe("Message 2");
    });

    it("should handle different maxTurns for different subscriptions", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register source apps
          const sourceApp1Config = {
            id: "source-app-1",
            name: "Source App 1",
            agentId: "agent-source-1",
            toolbarId: "toolbar-source-1",
          };

          const sourceApp2Config = {
            id: "source-app-2",
            name: "Source App 2",
            agentId: "agent-source-2",
            toolbarId: "toolbar-source-2",
          };

          // Register subscriber with different maxTurns for each source
          const subscriberAppConfig = {
            id: "subscriber-app",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [
              { appId: "source-app-1", maxTurns: 1 },
              { appId: "source-app-2", maxTurns: 3 },
            ] as SubscriptionConfig[],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-1",
            sourceApp1Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "source-app-2",
            sourceApp2Config
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber-app",
            subscriberAppConfig
          );

          // Start conversations
          const sourceConv1Id = yield* chatManager.startConversation(
            "agent-source-1",
            undefined,
            sourceApp1Config
          );
          const sourceConv2Id = yield* chatManager.startConversation(
            "agent-source-2",
            undefined,
            sourceApp2Config
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberAppConfig
          );

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages from source-app-1 (maxTurns: 1)
          yield* chatManager.sendMessage(
            sourceConv1Id,
            "From App1 - Message 1"
          );
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(
            sourceConv1Id,
            "From App1 - Message 2"
          ); // Should be ignored

          // Send messages from source-app-2 (maxTurns: 3)
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(
            sourceConv2Id,
            "From App2 - Message 1"
          );
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(
            sourceConv2Id,
            "From App2 - Message 2"
          );
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(
            sourceConv2Id,
            "From App2 - Message 3"
          );
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(
            sourceConv2Id,
            "From App2 - Message 4"
          ); // Should be ignored

          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive 1 message from app1 and 3 messages from app2
      expect(result.length).toBe(4);
      expect(
        result.filter((msg) => msg.content.includes("From App1")).length
      ).toBe(1);
      expect(
        result.filter((msg) => msg.content.includes("From App2")).length
      ).toBe(3);
    });

    it("should handle unlimited subscriptions (no maxTurns)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps without maxTurns (unlimited)
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
            subscriptions: [{ appId: "source-app" }] as SubscriptionConfig[], // No maxTurns
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

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send many messages
          for (let i = 1; i <= 10; i++) {
            yield* chatManager.sendMessage(sourceConvId, `Message ${i}`);
            yield* Effect.sleep("20 millis");
          }

          yield* Effect.sleep("100 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          return subscriberMessages;
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive all 10 messages
      expect(result.length).toBe(10);
      for (let i = 1; i <= 10; i++) {
        expect(result[i - 1].content).toBe(`Message ${i}`);
      }
    });
  });

  describe("Turn Counting", () => {
    it("should track turn counts per subscription", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with maxTurns
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
            subscriptions: [
              { appId: "source-app", maxTurns: 3 },
            ] as SubscriptionConfig[],
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

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages incrementally and check turn counts
          const results = [];

          for (let i = 1; i <= 5; i++) {
            yield* chatManager.sendMessage(sourceConvId, `Message ${i}`);
            yield* Effect.sleep("50 millis");

            const messages = yield* chatManager.getMessages(subscriberConvId);
            results.push({
              messagesSent: i,
              messagesReceived: messages.length,
            });
          }

          return results;
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive messages up to maxTurns limit
      expect(result[0]).toEqual({ messagesSent: 1, messagesReceived: 1 });
      expect(result[1]).toEqual({ messagesSent: 2, messagesReceived: 2 });
      expect(result[2]).toEqual({ messagesSent: 3, messagesReceived: 3 });
      expect(result[3]).toEqual({ messagesSent: 4, messagesReceived: 3 }); // Limit reached
      expect(result[4]).toEqual({ messagesSent: 5, messagesReceived: 3 }); // Still at limit
    });

    it("should reset turn counts when conversation is reset", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with maxTurns
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
            subscriptions: [
              { appId: "source-app", maxTurns: 2 },
            ] as SubscriptionConfig[],
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

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages up to limit
          yield* chatManager.sendMessage(sourceConvId, "Message 1");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 2");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 3"); // Should be ignored

          yield* Effect.sleep("100 millis");

          const messagesBeforeReset = yield* chatManager.getMessages(
            subscriberConvId
          );

          // Reset conversation (this should reset turn counts)
          yield* chatManager.resetConversation(subscriberConvId);

          // Send more messages
          yield* chatManager.sendMessage(sourceConvId, "Message 4");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 5");
          yield* Effect.sleep("50 millis");

          const messagesAfterReset = yield* chatManager.getMessages(
            subscriberConvId
          );

          return {
            beforeReset: messagesBeforeReset.length,
            afterReset: messagesAfterReset.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive 2 messages before reset, then 2 more after reset
      expect(result.beforeReset).toBe(2);
      expect(result.afterReset).toBe(2);
    });
  });

  describe("Dynamic Subscription Updates", () => {
    it("should handle subscription configuration updates", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with initial subscription
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
            subscriptions: [
              { appId: "source-app", maxTurns: 1 },
            ] as SubscriptionConfig[],
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

          // Set subscriber as active
          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send message (should be received)
          yield* chatManager.sendMessage(sourceConvId, "Message 1");
          yield* Effect.sleep("50 millis");

          // Update subscription configuration
          const updatedConfig = {
            ...subscriberAppConfig,
            subscriptions: [
              { appId: "source-app", maxTurns: 3 },
            ] as SubscriptionConfig[],
          };

          yield* chatAppsManager.updateChatAppConfig(
            "subscriber-app",
            updatedConfig
          );

          // Send more messages
          yield* chatManager.sendMessage(sourceConvId, "Message 2");
          yield* Effect.sleep("50 millis");
          yield* chatManager.sendMessage(sourceConvId, "Message 3");
          yield* Effect.sleep("50 millis");

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );
          const updatedInstance = yield* chatAppsManager.getChatAppInstance(
            "subscriber-app"
          );

          return {
            messages: subscriberMessages,
            updatedSubscriptions: updatedInstance.config.subscriptions,
          };
        }).pipe(Effect.provide(testLayer))
      );

      // Should receive messages according to updated configuration
      expect(result.messages.length).toBe(3);
      expect(result.updatedSubscriptions).toEqual([
        { appId: "source-app", maxTurns: 3 },
      ]);
    });
  });
});
