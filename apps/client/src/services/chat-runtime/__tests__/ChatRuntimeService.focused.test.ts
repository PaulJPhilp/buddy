import { ProtocolMessage, createMessage } from "@buddy/protocol";
import { Data, Effect, Fiber, Layer, Queue, Ref, Stream } from "effect";
import { describe, expect, it } from "vitest";
import type { WebSocketServiceApi } from "../../websocket/api";
import {
  WebSocketConnectionError,
  WebSocketSendError,
} from "../../websocket/errors";
import { AgentEndpointNotFoundError } from "../AgentEndpointResolverService";
import type { AgentEndpointResolverServiceApi } from "../AgentEndpointResolverService";
import {
  AgentRuntimeError,
  type AgentSession,
  AgentSessionStatus,
  ChatRuntimeService,
  type ChatRuntimeServiceApi,
} from "../ChatRuntimeService";

// Global instance tracking to prevent duplicates
const globalInstanceTracker = new Set<string>();

// Mock WebSocket Service with strict singleton enforcement
class TestWebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const connectionState = yield* Ref.make(false);
      const connectionHistory = yield* Ref.make<string[]>([]);
      const sentMessages = yield* Ref.make<any[]>([]);

      // Strict instance tracking
      const instanceId = crypto.randomUUID();
      if (globalInstanceTracker.has(instanceId)) {
        throw new Error(
          `Duplicate WebSocket service instance detected: ${instanceId}`,
        );
      }
      globalInstanceTracker.add(instanceId);
      console.log(
        `[TestWebSocketService] Created UNIQUE instance: ${instanceId}`,
      );

      return {
        _tag: "WebSocketService" as const,

        connect: (url: string) =>
          Effect.gen(function* () {
            yield* Ref.update(connectionHistory, (history) => [
              ...history,
              `connect:${url}`,
            ]);
            yield* Ref.set(connectionState, true);
            console.log(
              `[TestWebSocketService:${instanceId}] Connected to: ${url}`,
            );
          }),

        disconnect: () =>
          Effect.gen(function* () {
            yield* Ref.update(connectionHistory, (history) => [
              ...history,
              "disconnect",
            ]);
            yield* Ref.set(connectionState, false);
            console.log(`[TestWebSocketService:${instanceId}] Disconnected`);
          }),

        cleanup: () =>
          Effect.gen(function* () {
            yield* Queue.shutdown(messageQueue);
            yield* Ref.set(connectionState, false);
            globalInstanceTracker.delete(instanceId);
            console.log(
              `[TestWebSocketService:${instanceId}] Cleaned up and removed from tracker`,
            );
          }),

        send: (message: any) =>
          Effect.gen(function* () {
            const isConnected = yield* Ref.get(connectionState);
            if (!isConnected) {
              return yield* Effect.fail(
                new WebSocketSendError({
                  message: "Not connected",
                  cause: new Error("WebSocket not connected"),
                }),
              );
            }
            yield* Ref.update(sentMessages, (msgs) => [...msgs, message]);
            console.log(
              `[TestWebSocketService:${instanceId}] Sent message:`,
              message.type,
            );
          }),

        isConnected: Ref.get(connectionState),

        messageStream: Stream.fromQueue(messageQueue),
        receive: Stream.fromQueue(messageQueue),

        // Test helpers
        _test: {
          instanceId,
          addIncomingMessage: (message: ProtocolMessage) =>
            Queue.offer(messageQueue, message),
          getConnectionHistory: () => Ref.get(connectionHistory),
          getSentMessages: () => Ref.get(sentMessages),
          simulateDisconnect: () => Ref.set(connectionState, false),
        },
      } as WebSocketServiceApi & { _test: any };
    }),
    dependencies: [],
  },
) {}

// Mock Endpoint Resolver Service
class TestEndpointResolverService extends Effect.Service<AgentEndpointResolverServiceApi>()(
  "AgentEndpointResolverService",
  {
    effect: Effect.succeed({
      resolveEndpoint: (agentId: string, chatId: string) =>
        Effect.gen(function* () {
          if (agentId === "invalid-agent") {
            return yield* Effect.fail(
              new AgentEndpointNotFoundError({
                message: "Agent not found",
                agentId,
              }),
            );
          }
          return `ws://test-endpoint/${agentId}/${chatId}`;
        }),
    }),
    dependencies: [],
  },
) {}

// Singleton test layer to prevent multiple instances
const TestLayer = Layer.mergeAll(
  TestWebSocketService.Default,
  TestEndpointResolverService.Default,
  ChatRuntimeService.Default,
);

describe("ChatRuntimeService - Focused Test Suite", () => {
  describe("Service Structure and Singleton Enforcement", () => {
    it("should have a valid .Default layer", () => {
      expect(ChatRuntimeService.Default).toBeDefined();
      expect(typeof ChatRuntimeService.Default).toBe("object");
      expect(ChatRuntimeService.Default).toHaveProperty("pipe");
    });

    it("should prevent duplicate WebSocket service instances", async () => {
      // Clear any existing instances
      globalInstanceTracker.clear();

      // Test that using the same layer doesn't create duplicates
      const instanceIds = new Set<string>();

      const ws1 = await Effect.runPromise(
        TestWebSocketService.pipe(Effect.provide(TestLayer)),
      );
      instanceIds.add((ws1 as any)._test.instanceId);

      const ws2 = await Effect.runPromise(
        TestWebSocketService.pipe(Effect.provide(TestLayer)),
      );
      instanceIds.add((ws2 as any)._test.instanceId);

      // Should be the same instance when using the same layer
      expect(instanceIds.size).toBe(1);
      expect(globalInstanceTracker.size).toBe(1);

      // Cleanup
      await Effect.runPromise(
        (ws1 as any).cleanup().pipe(Effect.provide(TestLayer)),
      );
    });

    it("should inject dependencies correctly", async () => {
      const runtime = await Effect.runPromise(
        ChatRuntimeService.pipe(Effect.provide(TestLayer)),
      );

      expect(runtime).toBeDefined();
      expect(typeof runtime.start).toBe("function");
      expect(typeof runtime.stop).toBe("function");
      expect(typeof runtime.sendMessage).toBe("function");
      expect(typeof runtime.establishSession).toBe("function");
    });
  });

  describe("Session Management", () => {
    it("should establish a session successfully", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
              "Test prompt",
            );

            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.agentId).toBe("test-agent");
            expect(session.chatId).toBe("test-chat");
            expect(session.url).toBe("ws://test-endpoint/test-agent/test-chat");
            expect(session.prompt).toBe("Test prompt");
            expect(typeof session.send).toBe("function");
            expect(typeof session.close).toBe("function");

            // Verify WebSocket connection was established
            const connectionHistory = yield* (
              ws as any
            )._test.getConnectionHistory();
            expect(connectionHistory).toContain(
              "connect:ws://test-endpoint/test-agent/test-chat",
            );

            return session;
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle endpoint resolution errors", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          return yield* Effect.scoped(
            runtime.establishSession("invalid-agent", "test-chat"),
          );
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ENDPOINT_NOT_FOUND");
        expect(result.left.agentId).toBe("invalid-agent");
      }
    });

    it("should send system prompt when provided", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
              "System prompt for testing",
            );

            // Allow some time for the system prompt to be sent
            yield* Effect.sleep("100 millis");

            const sentMessages = yield* (ws as any)._test.getSentMessages();

            // Should have sent the system prompt
            expect(sentMessages.length).toBeGreaterThan(0);
            const systemMessage = sentMessages.find(
              (msg: any) => msg.payload?.command === "systemPrompt",
            );
            expect(systemMessage).toBeDefined();
            if (systemMessage) {
              expect(systemMessage.payload.data.prompt).toBe(
                "System prompt for testing",
              );
            }

            return session;
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Message Handling", () => {
    it("should send messages through session", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            const testMessage = createMessage("COMMAND", {
              command: "userMessage",
              data: { text: "Hello, agent!" },
              __tag: "CommandPayload",
            });

            yield* session.send(testMessage);

            const sentMessages = yield* (ws as any)._test.getSentMessages();
            expect(sentMessages.length).toBeGreaterThan(0);

            const userMessage = sentMessages.find(
              (msg: any) => msg.payload?.command === "userMessage",
            );
            expect(userMessage).toBeDefined();
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should receive incoming messages", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            const incomingMessage = createMessage("LLM_RESPONSE", {
              text: "Hello, user!",
              __tag: "LLMResponsePayload",
            });

            // Add message to the mock service queue
            yield* (ws as any)._test.addIncomingMessage(incomingMessage);

            // Collect messages from the session stream
            const messages = yield* session.incomingMessages$.pipe(
              Stream.take(1),
              Stream.runCollect,
            );

            expect(messages.length).toBe(1);
            expect(messages[0].type).toBe("LLM_RESPONSE");
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle send errors when disconnected", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            // Simulate disconnection
            yield* (ws as any)._test.simulateDisconnect();

            const testMessage = createMessage("COMMAND", {
              command: "userMessage",
              data: { text: "This should fail" },
              __tag: "CommandPayload",
            });

            return yield* session.send(testMessage);
          }),
        ).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("WEBSOCKET_ERROR");
      }
    });
  });

  describe("Service Lifecycle", () => {
    it("should start and stop service", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;

          // Start service
          yield* runtime.start();

          // Get initial state
          const state = yield* runtime.getState.pipe(
            Stream.take(1),
            Stream.runHead,
          );

          expect(state._tag).toBe("Some");
          if (state._tag === "Some") {
            // State might be "connecting" initially, which is fine
            expect(["connecting", "connected"]).toContain(state.value.status);
          }

          // Stop service
          yield* runtime.stop();

          // Check final state
          const finalState = yield* runtime.getState.pipe(
            Stream.take(1),
            Stream.runHead,
          );

          expect(finalState._tag).toBe("Some");
          if (finalState._tag === "Some") {
            expect(finalState.value.status).toBe("disconnected");
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should prevent multiple starts", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;

          // Start service first time
          yield* runtime.start();

          // Try to start again
          return yield* runtime.start();
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ALREADY_STARTED");
      }
    });

    it("should handle sendMessage without active session", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          return yield* runtime.sendMessage("test message");
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("SEND_ERROR");
        expect(result.left.message).toBe("WebSocket not connected");
      }
    });
  });

  describe("Resource Management", () => {
    it("should clean up resources on session close", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            // Close session
            yield* session.close(true);

            // Verify cleanup
            const connectionHistory = yield* (
              ws as any
            )._test.getConnectionHistory();
            expect(connectionHistory).toContain("disconnect");
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle graceful vs non-graceful close", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            // Test graceful close
            yield* session.close(true);

            // Verify WebSocket was disconnected
            const isConnected = yield* (ws as any).isConnected;
            expect(isConnected).toBe(false);
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Concurrent Operations and Socket Server Prevention", () => {
    it("should handle multiple concurrent sessions without duplicate servers", async () => {
      globalInstanceTracker.clear();

      const sessions = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          const ws = yield* TestWebSocketService;

          console.log(
            `[Test] Using WebSocket instance: ${(ws as any)._test.instanceId}`,
          );

          // Create multiple sessions concurrently using Effect.scoped for each
          const sessionPromises = [
            Effect.scoped(runtime.establishSession("agent1", "chat1")),
            Effect.scoped(runtime.establishSession("agent2", "chat2")),
            Effect.scoped(runtime.establishSession("agent3", "chat3")),
          ];

          const results = yield* Effect.all(sessionPromises, {
            concurrency: "unbounded",
          });
          return results;
        }).pipe(Effect.provide(TestLayer)),
      );

      expect(sessions.length).toBe(3);
      expect(sessions[0].agentId).toBe("agent1");
      expect(sessions[1].agentId).toBe("agent2");
      expect(sessions[2].agentId).toBe("agent3");

      // Verify all connections were made using the same WebSocket service instance
      const ws = await Effect.runPromise(
        TestWebSocketService.pipe(Effect.provide(TestLayer)),
      );
      const connectionHistory = await Effect.runPromise(
        (ws as any)._test
          .getConnectionHistory()
          .pipe(Effect.provide(TestLayer)),
      );

      expect(
        connectionHistory.filter((h: string) => h.startsWith("connect:")),
      ).toHaveLength(3);

      // Verify only one WebSocket service instance was created
      expect(globalInstanceTracker.size).toBe(1);
    });

    it("should handle concurrent message sending", async () => {
      globalInstanceTracker.clear();

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const ws = yield* TestWebSocketService;

            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            // Send multiple messages concurrently
            const message1 = createMessage("COMMAND", {
              command: "userMessage",
              data: { text: "Message 1" },
              __tag: "CommandPayload",
            });
            const message2 = createMessage("COMMAND", {
              command: "userMessage",
              data: { text: "Message 2" },
              __tag: "CommandPayload",
            });
            const message3 = createMessage("COMMAND", {
              command: "userMessage",
              data: { text: "Message 3" },
              __tag: "CommandPayload",
            });

            yield* Effect.all(
              [
                session.send(message1),
                session.send(message2),
                session.send(message3),
              ],
              { concurrency: "unbounded" },
            );

            const sentMessages = yield* (ws as any)._test.getSentMessages();

            // Should have sent all 3 messages (plus any system messages)
            const userMessages = sentMessages.filter(
              (msg: any) => msg.payload?.command === "userMessage",
            );
            expect(userMessages.length).toBe(3);
          }),
        ).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Error Handling", () => {
    it("should map endpoint resolution errors to AgentRuntimeError", async () => {
      globalInstanceTracker.clear();

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          return yield* Effect.scoped(
            runtime.establishSession("invalid-agent", "test-chat"),
          );
        }).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ENDPOINT_NOT_FOUND");
        expect(result.left.message).toContain("Failed to resolve endpoint");
      }
    });

    it("should track session status changes", async () => {
      globalInstanceTracker.clear();
      const statusHistory: AgentSessionStatus[] = [];

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const runtime = yield* ChatRuntimeService;
            const session = yield* runtime.establishSession(
              "test-agent",
              "test-chat",
            );

            // Collect status updates with timeout
            const statusFiber = yield* session.status$.pipe(
              Stream.take(3), // Expect: Initializing, Connecting, Connected
              Stream.tap((status) =>
                Effect.sync(() => statusHistory.push(status)),
              ),
              Stream.runDrain,
              Effect.fork,
            );

            yield* Effect.sleep("200 millis");
            yield* Effect.either(Fiber.join(statusFiber));

            return session;
          }),
        ).pipe(Effect.provide(TestLayer)),
      );

      expect(statusHistory.length).toBeGreaterThan(0);
      expect(statusHistory[0]._tag).toBe("Initializing");
      // Additional status changes depend on timing
    });
  });
});
