import { ChatManager } from "@/features/chatapps/chatapp/managers/chat";
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import type { ChatAppBusMessage } from "@/features/chatapps/managers/chatapps/types";
import { Effect, Layer, Stream } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const testLayer = Layer.mergeAll(ChatManager.Default, ChatAppsManager.Default);

describe("ChatApp Communication Performance", () => {
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

  describe("Message Throughput", () => {
    it("should handle high message volume", async () => {
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

          // Generate many messages
          const messages = Array.from({ length: 1000 }, (_, i) => ({
            sourceAppId: `app-${i % 10}`,
            message: {
              id: `msg-${i}`,
              content: `High volume message ${i}`,
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          const startTime = Date.now();

          // Publish messages concurrently
          yield* Effect.forEach(
            messages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("1000 millis");
          const endTime = Date.now();

          return {
            messagesProcessed: receivedMessages.length,
            duration: endTime - startTime,
            throughput:
              receivedMessages.length / ((endTime - startTime) / 1000),
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.messagesProcessed).toBe(1000);
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.throughput).toBeGreaterThan(100); // Should process at least 100 messages/second
    });

    it("should maintain performance with many subscribers", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const subscriberResults: number[] = [];

          // Set up multiple subscribers
          const numSubscribers = 50;
          for (let i = 0; i < numSubscribers; i++) {
            const subscriberMessages: ChatAppBusMessage[] = [];

            yield* Effect.fork(
              Stream.fromPubSub(messageBus)
                .pipe(
                  Stream.take(100),
                  Stream.runForEach((message) =>
                    Effect.sync(() => {
                      subscriberMessages.push(message);
                    })
                  )
                )
                .pipe(
                  Effect.andThen(() => {
                    subscriberResults.push(subscriberMessages.length);
                    return Effect.void;
                  })
                )
            );
          }

          // Publish messages
          const messages = Array.from({ length: 100 }, (_, i) => ({
            sourceAppId: `app-${i % 5}`,
            message: {
              id: `msg-${i}`,
              content: `Multi-subscriber message ${i}`,
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

          yield* Effect.sleep("2000 millis");
          const endTime = Date.now();

          return {
            subscriberCount: subscriberResults.length,
            averageMessagesPerSubscriber:
              subscriberResults.reduce((a, b) => a + b, 0) /
              subscriberResults.length,
            duration: endTime - startTime,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.subscriberCount).toBe(50);
      expect(result.averageMessagesPerSubscriber).toBe(100);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it("should handle burst message patterns", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(500),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          // Create burst pattern: 5 bursts of 100 messages each
          const burstResults = [];

          for (let burst = 0; burst < 5; burst++) {
            const burstMessages = Array.from({ length: 100 }, (_, i) => ({
              sourceAppId: `app-${burst}`,
              message: {
                id: `burst-${burst}-msg-${i}`,
                content: `Burst ${burst} message ${i}`,
                sender: "assistant" as const,
                timestamp: new Date(),
              },
            }));

            const burstStartTime = Date.now();

            yield* Effect.forEach(
              burstMessages,
              (message) => chatAppsManager.publishMessage(message),
              { concurrency: "unbounded" }
            );

            yield* Effect.sleep("100 millis");
            const burstEndTime = Date.now();

            burstResults.push({
              burstNumber: burst,
              duration: burstEndTime - burstStartTime,
            });

            // Small delay between bursts
            yield* Effect.sleep("50 millis");
          }

          yield* Effect.sleep("500 millis");

          return {
            totalMessagesReceived: receivedMessages.length,
            burstResults,
            averageBurstDuration:
              burstResults.reduce((a, b) => a + b.duration, 0) /
              burstResults.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.totalMessagesReceived).toBe(500);
      expect(result.burstResults.length).toBe(5);
      expect(result.averageBurstDuration).toBeLessThan(1000); // Each burst should complete quickly
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent app registration and messaging", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Concurrently register many apps
          const appConfigs = Array.from({ length: 20 }, (_, i) => ({
            id: `app-${i}`,
            name: `App ${i}`,
            agentId: `agent-${i}`,
            toolbarId: `toolbar-${i}`,
            subscriptions: i > 0 ? [{ appId: `app-${i - 1}` }] : [],
          }));

          const registrationStartTime = Date.now();

          yield* Effect.forEach(
            appConfigs,
            (config) =>
              chatAppsManager.registerChatApp("ws-1", config.id, config),
            { concurrency: "unbounded" }
          );

          const registrationEndTime = Date.now();

          // Start conversations concurrently
          const conversationStartTime = Date.now();

          const conversationIds = yield* Effect.forEach(
            appConfigs,
            (config) =>
              chatManager.startConversation(config.agentId, undefined, config),
            { concurrency: "unbounded" }
          );

          const conversationEndTime = Date.now();

          // Send messages concurrently
          const messagingStartTime = Date.now();

          yield* chatManager.setActiveConversation(conversationIds[1]);

          yield* Effect.forEach(
            conversationIds.slice(0, 10),
            (convId) =>
              chatManager.sendMessage(convId, "Concurrent test message"),
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("200 millis");
          const messagingEndTime = Date.now();

          // Check results
          const messagesReceived = yield* chatManager.getMessages(
            conversationIds[1]
          );

          return {
            appsRegistered: appConfigs.length,
            conversationsStarted: conversationIds.length,
            messagesReceived: messagesReceived.length,
            registrationTime: registrationEndTime - registrationStartTime,
            conversationTime: conversationEndTime - conversationStartTime,
            messagingTime: messagingEndTime - messagingStartTime,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.appsRegistered).toBe(20);
      expect(result.conversationsStarted).toBe(20);
      expect(result.messagesReceived).toBeGreaterThan(0);
      expect(result.registrationTime).toBeLessThan(2000);
      expect(result.conversationTime).toBeLessThan(2000);
      expect(result.messagingTime).toBeLessThan(1000);
    });

    it("should handle concurrent subscription updates", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          // Register base apps
          const baseApps = Array.from({ length: 10 }, (_, i) => ({
            id: `app-${i}`,
            name: `App ${i}`,
            agentId: `agent-${i}`,
            toolbarId: `toolbar-${i}`,
            subscriptions: [],
          }));

          yield* Effect.forEach(
            baseApps,
            (config) =>
              chatAppsManager.registerChatApp("ws-1", config.id, config),
            { concurrency: "unbounded" }
          );

          // Concurrently update subscriptions
          const updateStartTime = Date.now();

          const updateOperations = baseApps.map((app, i) => ({
            ...app,
            subscriptions: Array.from({ length: 5 }, (_, j) => ({
              appId: `app-${(i + j + 1) % 10}`,
              maxTurns: j + 1,
            })),
          }));

          yield* Effect.forEach(
            updateOperations,
            (config) => chatAppsManager.updateChatAppConfig(config.id, config),
            { concurrency: "unbounded" }
          );

          const updateEndTime = Date.now();

          // Verify final configurations
          const finalConfigs = yield* Effect.forEach(
            baseApps,
            (app) => chatAppsManager.getChatAppInstance(app.id),
            { concurrency: "unbounded" }
          );

          return {
            appsUpdated: finalConfigs.length,
            updateTime: updateEndTime - updateStartTime,
            averageSubscriptions:
              finalConfigs.reduce(
                (total, app) => total + (app.config.subscriptions?.length || 0),
                0
              ) / finalConfigs.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.appsUpdated).toBe(10);
      expect(result.updateTime).toBeLessThan(2000);
      expect(result.averageSubscriptions).toBe(5);
    });

    it("should handle concurrent message processing with different priorities", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Register apps with different subscription configurations
          const highPriorityApp = {
            id: "high-priority",
            name: "High Priority App",
            agentId: "agent-high",
            toolbarId: "toolbar-high",
          };

          const mediumPriorityApp = {
            id: "medium-priority",
            name: "Medium Priority App",
            agentId: "agent-medium",
            toolbarId: "toolbar-medium",
          };

          const subscriberApp = {
            id: "subscriber",
            name: "Subscriber App",
            agentId: "agent-subscriber",
            toolbarId: "toolbar-subscriber",
            subscriptions: [
              { appId: "high-priority", maxTurns: 10 },
              { appId: "medium-priority", maxTurns: 5 },
            ],
          };

          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "high-priority",
            highPriorityApp
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "medium-priority",
            mediumPriorityApp
          );
          yield* chatAppsManager.registerChatApp(
            "ws-1",
            "subscriber",
            subscriberApp
          );

          // Start conversations
          const highPriorityConvId = yield* chatManager.startConversation(
            "agent-high",
            undefined,
            highPriorityApp
          );
          const mediumPriorityConvId = yield* chatManager.startConversation(
            "agent-medium",
            undefined,
            mediumPriorityApp
          );
          const subscriberConvId = yield* chatManager.startConversation(
            "agent-subscriber",
            undefined,
            subscriberApp
          );

          yield* chatManager.setActiveConversation(subscriberConvId);

          // Send messages concurrently from both priority levels
          const startTime = Date.now();

          const highPriorityMessages = Array.from({ length: 8 }, (_, i) =>
            chatManager.sendMessage(
              highPriorityConvId,
              `High priority message ${i}`
            )
          );

          const mediumPriorityMessages = Array.from({ length: 3 }, (_, i) =>
            chatManager.sendMessage(
              mediumPriorityConvId,
              `Medium priority message ${i}`
            )
          );

          yield* Effect.forEach(
            [...highPriorityMessages, ...mediumPriorityMessages],
            (messageEffect) => messageEffect,
            { concurrency: "unbounded" }
          );

          yield* Effect.sleep("300 millis");
          const endTime = Date.now();

          const subscriberMessages = yield* chatManager.getMessages(
            subscriberConvId
          );

          return {
            totalMessagesReceived: subscriberMessages.length,
            highPriorityReceived: subscriberMessages.filter((m) =>
              m.content.includes("High priority")
            ).length,
            mediumPriorityReceived: subscriberMessages.filter((m) =>
              m.content.includes("Medium priority")
            ).length,
            processingTime: endTime - startTime,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.totalMessagesReceived).toBe(11); // 8 high + 3 medium
      expect(result.highPriorityReceived).toBe(8);
      expect(result.mediumPriorityReceived).toBe(3);
      expect(result.processingTime).toBeLessThan(2000);
    });
  });

  describe("Memory and Resource Management", () => {
    it("should handle large message payloads efficiently", async () => {
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

          // Create large message payloads
          const largeMessages = Array.from({ length: 10 }, (_, i) => ({
            sourceAppId: `app-${i}`,
            message: {
              id: `large-msg-${i}`,
              content: "X".repeat(50000), // 50KB per message
              sender: "assistant" as const,
              timestamp: new Date(),
            },
          }));

          const startTime = Date.now();

          yield* Effect.forEach(
            largeMessages,
            (message) => chatAppsManager.publishMessage(message),
            { concurrency: 5 } // Limit concurrency for large payloads
          );

          yield* Effect.sleep("1000 millis");
          const endTime = Date.now();

          return {
            messagesProcessed: receivedMessages.length,
            averageMessageSize:
              receivedMessages.reduce(
                (total, msg) => total + msg.message.content.length,
                0
              ) / receivedMessages.length,
            processingTime: endTime - startTime,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.messagesProcessed).toBe(10);
      expect(result.averageMessageSize).toBe(50000);
      expect(result.processingTime).toBeLessThan(5000);
    });

    it("should handle rapid app lifecycle operations", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const cycleResults = [];

          // Perform multiple register/unregister cycles
          for (let cycle = 0; cycle < 10; cycle++) {
            const cycleStartTime = Date.now();

            // Register apps
            const apps = Array.from({ length: 20 }, (_, i) => ({
              id: `cycle-${cycle}-app-${i}`,
              name: `Cycle ${cycle} App ${i}`,
              agentId: `agent-${cycle}-${i}`,
              toolbarId: `toolbar-${cycle}-${i}`,
              subscriptions:
                i > 0 ? [{ appId: `cycle-${cycle}-app-${i - 1}` }] : [],
            }));

            yield* Effect.forEach(
              apps,
              (config) =>
                chatAppsManager.registerChatApp("ws-1", config.id, config),
              { concurrency: "unbounded" }
            );

            // Unregister apps
            yield* Effect.forEach(
              apps,
              (config) => chatAppsManager.unregisterChatApp(config.id),
              { concurrency: "unbounded" }
            );

            const cycleEndTime = Date.now();

            cycleResults.push({
              cycle,
              duration: cycleEndTime - cycleStartTime,
            });
          }

          return {
            cyclesCompleted: cycleResults.length,
            averageCycleDuration:
              cycleResults.reduce((total, cycle) => total + cycle.duration, 0) /
              cycleResults.length,
            maxCycleDuration: Math.max(...cycleResults.map((c) => c.duration)),
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.cyclesCompleted).toBe(10);
      expect(result.averageCycleDuration).toBeLessThan(2000);
      expect(result.maxCycleDuration).toBeLessThan(5000);
    });

    it("should maintain performance under sustained load", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;

          const messageBus = yield* chatAppsManager.subscribeToBus();
          const receivedMessages: ChatAppBusMessage[] = [];

          // Set up subscriber
          yield* Effect.fork(
            Stream.fromPubSub(messageBus).pipe(
              Stream.take(2000),
              Stream.runForEach((message) =>
                Effect.sync(() => {
                  receivedMessages.push(message);
                })
              )
            )
          );

          const performanceMetrics = [];

          // Sustained load test: 10 rounds of 200 messages each
          for (let round = 0; round < 10; round++) {
            const roundStartTime = Date.now();

            const roundMessages = Array.from({ length: 200 }, (_, i) => ({
              sourceAppId: `app-${i % 10}`,
              message: {
                id: `round-${round}-msg-${i}`,
                content: `Sustained load round ${round} message ${i}`,
                sender: "assistant" as const,
                timestamp: new Date(),
              },
            }));

            yield* Effect.forEach(
              roundMessages,
              (message) => chatAppsManager.publishMessage(message),
              { concurrency: "unbounded" }
            );

            yield* Effect.sleep("100 millis");
            const roundEndTime = Date.now();

            performanceMetrics.push({
              round,
              duration: roundEndTime - roundStartTime,
              messagesPublished: roundMessages.length,
            });
          }

          yield* Effect.sleep("1000 millis");

          return {
            totalRounds: performanceMetrics.length,
            totalMessagesReceived: receivedMessages.length,
            averageRoundDuration:
              performanceMetrics.reduce(
                (total, metric) => total + metric.duration,
                0
              ) / performanceMetrics.length,
            performanceConsistency:
              Math.max(...performanceMetrics.map((m) => m.duration)) -
              Math.min(...performanceMetrics.map((m) => m.duration)),
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.totalRounds).toBe(10);
      expect(result.totalMessagesReceived).toBe(2000);
      expect(result.averageRoundDuration).toBeLessThan(1000);
      expect(result.performanceConsistency).toBeLessThan(2000); // Performance should be consistent
    });
  });

  describe("Scalability Tests", () => {
    it("should scale with increasing number of apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          const scaleResults = [];

          // Test with increasing numbers of apps
          const scales = [10, 25, 50, 100];

          for (const scale of scales) {
            const scaleStartTime = Date.now();

            // Register apps
            const apps = Array.from({ length: scale }, (_, i) => ({
              id: `scale-${scale}-app-${i}`,
              name: `Scale ${scale} App ${i}`,
              agentId: `agent-${scale}-${i}`,
              toolbarId: `toolbar-${scale}-${i}`,
              subscriptions:
                i > 0
                  ? [{ appId: `scale-${scale}-app-${Math.floor(i / 2)}` }]
                  : [],
            }));

            yield* Effect.forEach(
              apps,
              (config) =>
                chatAppsManager.registerChatApp("ws-1", config.id, config),
              { concurrency: "unbounded" }
            );

            // Start conversations
            const conversationIds = yield* Effect.forEach(
              apps,
              (config) =>
                chatManager.startConversation(
                  config.agentId,
                  undefined,
                  config
                ),
              { concurrency: "unbounded" }
            );

            // Send test messages
            yield* chatManager.setActiveConversation(conversationIds[1]);
            yield* chatManager.sendMessage(
              conversationIds[0],
              `Scale test message for ${scale} apps`
            );

            yield* Effect.sleep("100 millis");

            const scaleEndTime = Date.now();

            scaleResults.push({
              scale,
              duration: scaleEndTime - scaleStartTime,
              appsRegistered: apps.length,
              conversationsStarted: conversationIds.length,
            });

            // Cleanup for next scale test
            yield* Effect.forEach(
              apps,
              (config) => chatAppsManager.unregisterChatApp(config.id),
              { concurrency: "unbounded" }
            );
          }

          return {
            scaleTests: scaleResults,
            scalingEfficiency: scaleResults.map((r) => r.duration / r.scale),
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.scaleTests.length).toBe(4);
      expect(
        result.scaleTests.every(
          (test) => test.appsRegistered === test.conversationsStarted
        )
      ).toBe(true);

      // Performance should not degrade linearly with scale
      const efficiencies = result.scalingEfficiency;
      expect(efficiencies[3]).toBeLessThan(efficiencies[0] * 5); // 100 apps shouldn't take 10x longer than 10 apps
    });

    it("should handle complex subscription networks", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatManager = yield* ChatManager;
          const chatAppsManager = yield* ChatAppsManager;

          // Create a complex network: hub-and-spoke + mesh patterns
          const hubApps = Array.from({ length: 5 }, (_, i) => ({
            id: `hub-${i}`,
            name: `Hub ${i}`,
            agentId: `agent-hub-${i}`,
            toolbarId: `toolbar-hub-${i}`,
            subscriptions: [],
          }));

          const spokeApps = Array.from({ length: 20 }, (_, i) => ({
            id: `spoke-${i}`,
            name: `Spoke ${i}`,
            agentId: `agent-spoke-${i}`,
            toolbarId: `toolbar-spoke-${i}`,
            subscriptions: [{ appId: `hub-${i % 5}`, maxTurns: 3 }],
          }));

          const meshApps = Array.from({ length: 10 }, (_, i) => ({
            id: `mesh-${i}`,
            name: `Mesh ${i}`,
            agentId: `agent-mesh-${i}`,
            toolbarId: `toolbar-mesh-${i}`,
            subscriptions: Array.from({ length: 3 }, (_, j) => ({
              appId: `mesh-${(i + j + 1) % 10}`,
              maxTurns: 2,
            })),
          }));

          const allApps = [...hubApps, ...spokeApps, ...meshApps];

          const setupStartTime = Date.now();

          // Register all apps
          yield* Effect.forEach(
            allApps,
            (config) =>
              chatAppsManager.registerChatApp("ws-1", config.id, config),
            { concurrency: "unbounded" }
          );

          // Start conversations
          const conversationIds = yield* Effect.forEach(
            allApps,
            (config) =>
              chatManager.startConversation(config.agentId, undefined, config),
            { concurrency: "unbounded" }
          );

          const setupEndTime = Date.now();

          // Test message propagation
          const testStartTime = Date.now();

          // Set a spoke app as active and send from hub
          yield* chatManager.setActiveConversation(conversationIds[5]); // spoke-0
          yield* chatManager.sendMessage(conversationIds[0], "Hub message"); // hub-0

          // Set a mesh app as active and send from another mesh app
          yield* chatManager.setActiveConversation(conversationIds[25]); // mesh-0
          yield* chatManager.sendMessage(conversationIds[26], "Mesh message"); // mesh-1

          yield* Effect.sleep("300 millis");
          const testEndTime = Date.now();

          // Check results
          const spokeMessages = yield* chatManager.getMessages(
            conversationIds[5]
          );
          const meshMessages = yield* chatManager.getMessages(
            conversationIds[25]
          );

          return {
            totalApps: allApps.length,
            hubApps: hubApps.length,
            spokeApps: spokeApps.length,
            meshApps: meshApps.length,
            setupTime: setupEndTime - setupStartTime,
            testTime: testEndTime - testStartTime,
            spokeMessagesReceived: spokeMessages.length,
            meshMessagesReceived: meshMessages.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.totalApps).toBe(35);
      expect(result.setupTime).toBeLessThan(5000);
      expect(result.testTime).toBeLessThan(2000);
      expect(result.spokeMessagesReceived).toBe(1);
      expect(result.meshMessagesReceived).toBe(1);
    });
  });
});
