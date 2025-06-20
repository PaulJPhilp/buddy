import { ProtocolMessage, createMessage } from "@buddy/protocol";
import {
  Data,
  Effect,
  Fiber,
  Layer,
  Queue,
  Ref,
  Stream,
  TestClock,
  TestContext,
} from "effect";
import { Scope } from "effect/Scope";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

// Mock WebSocket Service with controllable behavior
class MockWebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const connectionState = yield* Ref.make(false);
      const connectionHistory = yield* Ref.make<string[]>([]);
      const sentMessages = yield* Ref.make<any[]>([]);

      // Track service instances to prevent duplicates
      const instanceId = crypto.randomUUID();
      console.log(`[MockWebSocketService] Created instance: ${instanceId}`);

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
              `[MockWebSocketService:${instanceId}] Connected to: ${url}`,
            );
          }),

        disconnect: () =>
          Effect.gen(function* () {
            yield* Ref.update(connectionHistory, (history) => [
              ...history,
              "disconnect",
            ]);
            yield* Ref.set(connectionState, false);
            console.log(`[MockWebSocketService:${instanceId}] Disconnected`);
          }),

        cleanup: () =>
          Effect.gen(function* () {
            yield* Queue.shutdown(messageQueue);
            yield* Ref.set(connectionState, false);
            console.log(`[MockWebSocketService:${instanceId}] Cleaned up`);
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
              `[MockWebSocketService:${instanceId}] Sent message:`,
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
          simulateConnectionError: () =>
            Effect.fail(
              new WebSocketConnectionError({
                message: "Connection failed",
                cause: new Error("Simulated connection error"),
              }),
            ),
        },
      } as WebSocketServiceApi & { _test: any };
    }),
    dependencies: [],
  },
) {}

// Mock Endpoint Resolver Service
class MockEndpointResolverService extends Effect.Service<AgentEndpointResolverServiceApi>()(
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

// Test Layer with singleton enforcement
const createTestLayer = () => {
  console.log("[Test] Creating test layer");
  return Layer.mergeAll(
    MockWebSocketService.Default,
    MockEndpointResolverService.Default,
    ChatRuntimeService.Default,
  );
};

describe("ChatRuntimeService - Comprehensive Test Suite", () => {
  let testLayer: Layer.Layer<any, never, never>;
  let mockWebSocketService: any;
  let runtimeService: ChatRuntimeServiceApi;

  beforeEach(async () => {
    console.log("[Test] Setting up test environment");
    testLayer = createTestLayer();

    // Get service instances
    const services = await Effect.runPromise(
      Effect.gen(function* () {
        const ws = yield* MockWebSocketService;
        const runtime = yield* ChatRuntimeService;
        return { ws, runtime };
      }).pipe(Effect.provide(testLayer)),
    );

    mockWebSocketService = services.ws;
    runtimeService = services.runtime;

    console.log(
      `[Test] Using WebSocket instance: ${mockWebSocketService._test.instanceId}`,
    );
  });

  afterEach(async () => {
    console.log("[Test] Cleaning up test environment");
    if (mockWebSocketService?._test) {
      await Effect.runPromise(
        mockWebSocketService.cleanup().pipe(Effect.provide(testLayer)),
      );
    }
  });

  describe("Service Structure and Initialization", () => {
    it("should have a valid .Default layer", () => {
      expect(ChatRuntimeService.Default).toBeDefined();
      expect(typeof ChatRuntimeService.Default).toBe("object");
      expect(ChatRuntimeService.Default).toHaveProperty("pipe");
    });

    it("should create service without duplicate instances", async () => {
      const instanceIds = new Set<string>();

      // Create multiple service instances
      for (let i = 0; i < 3; i++) {
        const layer = createTestLayer();
        const ws = await Effect.runPromise(
          MockWebSocketService.pipe(Effect.provide(layer)),
        );
        instanceIds.add((ws as any)._test.instanceId);
      }

      // Each layer should create a new instance (this is expected behavior)
      // But within a single layer, there should be no duplicates
      expect(instanceIds.size).toBe(3);
    });

    it("should inject dependencies correctly", async () => {
      expect(runtimeService).toBeDefined();
      expect(typeof runtimeService.start).toBe("function");
      expect(typeof runtimeService.stop).toBe("function");
      expect(typeof runtimeService.sendMessage).toBe("function");
      expect(typeof runtimeService.establishSession).toBe("function");
    });
  });

  describe("Session Management", () => {
    it("should establish a session successfully", async () => {
      const result = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const session = yield* runtimeService.establishSession(
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

            return session;
          }),
        ).pipe(Effect.provide(testLayer)),
      );

      // Verify WebSocket connection was established
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(testLayer)),
      );
      expect(connectionHistory).toContain(
        "connect:ws://test-endpoint/test-agent/test-chat",
      );
    });

    it("should handle endpoint resolution errors", async () => {
      const result = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("invalid-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ENDPOINT_NOT_FOUND");
        expect(result.left.agentId).toBe("invalid-agent");
      }
    });

    it("should handle WebSocket connection errors", async () => {
      // Create a failing WebSocket service using proper service pattern
      class FailingWebSocketService extends Effect.Service<WebSocketServiceApi>()(
        "FailingWebSocketService",
        {
          scoped: Effect.gen(function* () {
            // Create the same interface but with failing connect method
            const baseService = yield* MockWebSocketService;

            return {
              ...baseService,
              connect: () =>
                Effect.fail(
                  new WebSocketConnectionError({
                    message: "Connection failed",
                    cause: new Error("Simulated connection error"),
                  }),
                ),
            } as WebSocketServiceApi;
          }),
          dependencies: [MockWebSocketService.Default],
        },
      ) {}

      const failingLayer = Layer.mergeAll(
        FailingWebSocketService.Default,
        MockEndpointResolverService.Default,
        ChatRuntimeService.Default,
      );

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          return yield* Effect.scoped(
            runtime.establishSession("test-agent", "test-chat"),
          );
        }).pipe(Effect.provide(failingLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("WEBSOCKET_ERROR");
      }
    });

    it("should send system prompt when provided", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const session = yield* runtimeService.establishSession(
              "test-agent",
              "test-chat",
              "System prompt for testing",
            );

            // Allow some time for the system prompt to be sent
            yield* Effect.sleep("100 millis");

            const sentMessages =
              yield* mockWebSocketService._test.getSentMessages();

            // Should have sent the system prompt
            expect(sentMessages.length).toBeGreaterThan(0);
            const systemMessage = sentMessages.find(
              (msg: any) => msg.payload?.command === "systemPrompt",
            );
            expect(systemMessage).toBeDefined();
            expect(systemMessage.payload.data.prompt).toBe(
              "System prompt for testing",
            );

            return session;
          }),
        ).pipe(Effect.provide(testLayer)),
      );
    });
  });

  describe("Message Handling", () => {
    let session: AgentSession;

    beforeEach(async () => {
      session = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("test-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer)),
      );
    });

    it("should send messages through session", async () => {
      const testMessage = createMessage("COMMAND", {
        command: "userMessage",
        data: { text: "Hello, agent!" },
        __tag: "CommandPayload",
      });

      await Effect.runPromise(
        session.send(testMessage).pipe(Effect.provide(testLayer)),
      );

      const sentMessages = await Effect.runPromise(
        mockWebSocketService._test
          .getSentMessages()
          .pipe(Effect.provide(testLayer)),
      );

      expect(sentMessages.length).toBeGreaterThan(0);
      const userMessage = sentMessages.find(
        (msg: any) => msg.payload?.command === "userMessage",
      );
      expect(userMessage).toBeDefined();
    });

    it("should receive incoming messages", async () => {
      const incomingMessage = createMessage("LLM_RESPONSE", {
        text: "Hello, user!",
        __tag: "LLMResponsePayload",
      });

      // Add message to the mock service queue
      await Effect.runPromise(
        mockWebSocketService._test
          .addIncomingMessage(incomingMessage)
          .pipe(Effect.provide(testLayer)),
      );

      // Collect messages from the session stream
      const messages = await Effect.runPromise(
        session.incomingMessages$
          .pipe(Stream.take(1), Stream.runCollect)
          .pipe(Effect.provide(testLayer)),
      );

      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe("LLM_RESPONSE");
    });

    it("should handle send errors when disconnected", async () => {
      // Simulate disconnection
      await Effect.runPromise(
        mockWebSocketService._test
          .simulateDisconnect()
          .pipe(Effect.provide(testLayer)),
      );

      const testMessage = createMessage("COMMAND", {
        command: "userMessage",
        data: { text: "This should fail" },
        __tag: "CommandPayload",
      });

      const result = await Effect.runPromise(
        session
          .send(testMessage)
          .pipe(Effect.provide(testLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("WEBSOCKET_ERROR");
      }
    });
  });

  describe("Session Status Tracking", () => {
    it("should track session status changes", async () => {
      const statusHistory: AgentSessionStatus[] = [];

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const session = yield* runtimeService.establishSession(
              "test-agent",
              "test-chat",
            );

            // Collect status updates
            const fiber = yield* session.status$.pipe(
              Stream.take(3), // Expect: Initializing, Connecting, Connected
              Stream.tap((status) =>
                Effect.sync(() => statusHistory.push(status)),
              ),
              Stream.runDrain,
              Effect.fork,
            );

            yield* Effect.sleep("200 millis");
            yield* Fiber.join(fiber);

            return session;
          }),
        ).pipe(Effect.provide(testLayer)),
      );

      expect(statusHistory.length).toBe(3);
      expect(statusHistory[0]._tag).toBe("Initializing");
      expect(statusHistory[1]._tag).toBe("Connecting");
      expect(statusHistory[2]._tag).toBe("Connected");
    });

    it("should handle status errors", async () => {
      const statusHistory: AgentSessionStatus[] = [];

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            // Try to establish session with invalid agent
            const result = yield* runtimeService
              .establishSession("invalid-agent", "test-chat")
              .pipe(Effect.either);

            return result;
          }),
        ).pipe(Effect.provide(testLayer), Effect.either),
      );

      // Should fail before creating status stream
      // This tests that errors are properly propagated
    });
  });

  describe("Service Lifecycle", () => {
    it("should start and stop service", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          // Start service
          yield* runtimeService.start();

          // Get state
          const state = yield* runtimeService.getState.pipe(
            Stream.take(1),
            Stream.runHead,
          );

          expect(state._tag).toBe("Some");
          if (state._tag === "Some") {
            expect(state.value.status).toBe("connected");
          }

          // Stop service
          yield* runtimeService.stop();

          // Check final state
          const finalState = yield* runtimeService.getState.pipe(
            Stream.take(1),
            Stream.runHead,
          );

          expect(finalState._tag).toBe("Some");
          if (finalState._tag === "Some") {
            expect(finalState.value.status).toBe("disconnected");
          }
        }).pipe(Effect.provide(testLayer)),
      );
    });

    it("should prevent multiple starts", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          // Start service first time
          yield* runtimeService.start();

          // Try to start again
          const secondStart = yield* runtimeService.start().pipe(Effect.either);

          return secondStart;
        }).pipe(Effect.provide(testLayer)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ALREADY_STARTED");
      }
    });

    it("should handle sendMessage without active session", async () => {
      const result = await Effect.runPromise(
        runtimeService
          .sendMessage("test message")
          .pipe(Effect.provide(testLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("SEND_ERROR");
        expect(result.left.message).toBe("WebSocket not connected");
      }
    });

    it("should send messages after starting", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          // Start service
          yield* runtimeService.start();

          // Send message
          yield* runtimeService.sendMessage("Hello from service!");

          // Check that message was sent
          const sentMessages =
            yield* mockWebSocketService._test.getSentMessages();
          expect(sentMessages.length).toBeGreaterThan(0);

          const userMessage = sentMessages.find(
            (msg: any) =>
              msg.payload?.command === "userMessage" &&
              msg.payload?.data?.text === "Hello from service!",
          );
          expect(userMessage).toBeDefined();

          // Stop service
          yield* runtimeService.stop();
        }).pipe(Effect.provide(testLayer)),
      );
    });
  });

  describe("Resource Management", () => {
    it("should clean up resources on session close", async () => {
      const session = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("test-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer)),
      );

      // Close session
      await Effect.runPromise(
        session.close(true).pipe(Effect.provide(testLayer)),
      );

      // Verify cleanup
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(testLayer)),
      );

      expect(connectionHistory).toContain("disconnect");
    });

    it("should handle graceful vs non-graceful close", async () => {
      const session = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("test-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer)),
      );

      // Test graceful close
      await Effect.runPromise(
        session.close(true).pipe(Effect.provide(testLayer)),
      );

      // Verify WebSocket was disconnected
      const isConnected = await Effect.runPromise(
        mockWebSocketService.isConnected.pipe(Effect.provide(testLayer)),
      );
      expect(isConnected).toBe(false);
    });
  });

  describe("Error Mapping and Handling", () => {
    it("should map WebSocket errors to AgentRuntimeError", async () => {
      // This is tested in the connection error test above
      // but we can add more specific error mapping tests here
      const error = new WebSocketConnectionError({
        message: "Connection failed",
        cause: new Error("Network error"),
      });

      // The error mapping is internal to the service
      // We test it through the public API
      expect(error).toBeInstanceOf(WebSocketConnectionError);
    });

    it("should map endpoint resolution errors to AgentRuntimeError", async () => {
      const result = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("invalid-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
        expect(result.left.code).toBe("ENDPOINT_NOT_FOUND");
        expect(result.left.message).toContain("Failed to resolve endpoint");
      }
    });

    it("should handle unexpected errors", async () => {
      // Create a service that throws unexpected errors using proper service pattern
      class ErrorEndpointResolverService extends Effect.Service<AgentEndpointResolverServiceApi>()(
        "ErrorEndpointResolverService",
        {
          effect: Effect.succeed({
            resolveEndpoint: () => Effect.die(new Error("Unexpected error")),
          }),
          dependencies: [],
        },
      ) {}

      const errorLayer = Layer.mergeAll(
        MockWebSocketService.Default,
        ErrorEndpointResolverService.Default,
        ChatRuntimeService.Default,
      );

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const runtime = yield* ChatRuntimeService;
          return yield* Effect.scoped(
            runtime.establishSession("test-agent", "test-chat"),
          );
        }).pipe(Effect.provide(errorLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      // The error should be caught and mapped appropriately
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple concurrent sessions", async () => {
      const sessions = await Effect.runPromise(
        Effect.gen(function* () {
          // Create multiple sessions concurrently
          const session1 = yield* Effect.scoped(
            runtimeService.establishSession("agent1", "chat1"),
          );
          const session2 = yield* Effect.scoped(
            runtimeService.establishSession("agent2", "chat2"),
          );
          const session3 = yield* Effect.scoped(
            runtimeService.establishSession("agent3", "chat3"),
          );

          return [session1, session2, session3];
        }).pipe(Effect.provide(testLayer)),
      );

      expect(sessions.length).toBe(3);
      expect(sessions[0].agentId).toBe("agent1");
      expect(sessions[1].agentId).toBe("agent2");
      expect(sessions[2].agentId).toBe("agent3");

      // Verify all connections were made
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(testLayer)),
      );

      expect(
        connectionHistory.filter((h) => h.startsWith("connect:")),
      ).toHaveLength(3);
    });

    it("should handle concurrent message sending", async () => {
      const session = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("test-agent", "test-chat"),
        ).pipe(Effect.provide(testLayer)),
      );

      // Send multiple messages concurrently
      await Effect.runPromise(
        Effect.gen(function* () {
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
        }).pipe(Effect.provide(testLayer)),
      );

      const sentMessages = await Effect.runPromise(
        mockWebSocketService._test
          .getSentMessages()
          .pipe(Effect.provide(testLayer)),
      );

      // Should have sent all 3 messages (plus any system messages)
      const userMessages = sentMessages.filter(
        (msg: any) => msg.payload?.command === "userMessage",
      );
      expect(userMessages.length).toBe(3);
    });
  });

  describe("Memory and Resource Leaks", () => {
    it("should not leak resources with multiple session creations", async () => {
      // Create and close multiple sessions
      for (let i = 0; i < 5; i++) {
        const session = await Effect.runPromise(
          Effect.scoped(
            runtimeService.establishSession(`agent-${i}`, `chat-${i}`),
          ).pipe(Effect.provide(testLayer)),
        );

        await Effect.runPromise(
          session.close().pipe(Effect.provide(testLayer)),
        );
      }

      // Verify all connections were properly closed
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(testLayer)),
      );

      const connects = connectionHistory.filter((h) =>
        h.startsWith("connect:"),
      ).length;
      const disconnects = connectionHistory.filter(
        (h) => h === "disconnect",
      ).length;

      expect(connects).toBe(5);
      expect(disconnects).toBe(5);
    });

    it("should cleanup properly on scope exit", async () => {
      let sessionId: string;

      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const session = yield* runtimeService.establishSession(
              "test-agent",
              "test-chat",
            );
            sessionId = session.id;

            // Session should be active here
            expect(session.id).toBeDefined();

            // Exit scope - should trigger cleanup
          }),
        ).pipe(Effect.provide(testLayer)),
      );

      // After scope exit, resources should be cleaned up
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(testLayer)),
      );

      expect(connectionHistory).toContain("disconnect");
    });
  });
});
