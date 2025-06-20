import type { WebSocketServiceApi } from "@/services/websocket/api";
import { WebSocketError } from "@/services/websocket/errors";
import type { ProtocolMessage } from "@buddy/protocol";
import { Effect, Layer, Queue, Ref, Stream } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import {
  AgentEndpointNotFoundError,
  AgentEndpointResolverService,
} from "../AgentEndpointResolverService";
import {
  AgentRuntimeError,
  ChatRuntimeService,
  type ChatRuntimeServiceApi,
} from "../ChatRuntimeService";

// Mock Services using proper Effect.Service pattern
class MockWebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const connectionState = yield* Ref.make(false);
      const connectionHistory = yield* Ref.make<string[]>([]);
      const sentMessages = yield* Ref.make<any[]>([]);
      const instanceId = crypto.randomUUID();

      return {
        connect: (url: string) =>
          Effect.gen(function* () {
            yield* Ref.update(connectionHistory, (history) => [
              ...history,
              `connect:${url}`,
            ]);
            yield* Ref.set(connectionState, true);
          }),

        disconnect: () =>
          Effect.gen(function* () {
            yield* Ref.update(connectionHistory, (history) => [
              ...history,
              "disconnect",
            ]);
            yield* Ref.set(connectionState, false);
          }),

        cleanup: () =>
          Effect.gen(function* () {
            yield* Queue.shutdown(messageQueue);
            yield* Ref.set(connectionState, false);
          }),

        send: (message: any) =>
          Effect.gen(function* () {
            const isConnected = yield* Ref.get(connectionState);
            if (!isConnected) {
              return yield* Effect.fail(
                new WebSocketError({
                  message: "Not connected",
                  cause: new Error("WebSocket not connected"),
                }),
              );
            }
            yield* Ref.update(sentMessages, (msgs) => [...msgs, message]);
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
              new WebSocketError({
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

// Test Layer
const TestLayer = Layer.mergeAll(
  MockWebSocketService.Default,
  AgentEndpointResolverService.Default,
  ChatRuntimeService.Default,
);

describe("ChatRuntimeService - Simple Test Suite", () => {
  let runtimeService: ChatRuntimeService;
  let mockWebSocketService: any;

  beforeEach(async () => {
    const services = await Effect.runPromise(
      Effect.gen(function* () {
        const runtime = yield* ChatRuntimeService;
        const ws = yield* MockWebSocketService;
        return { runtime, ws };
      }).pipe(Effect.provide(TestLayer)),
    );

    runtimeService = services.runtime;
    mockWebSocketService = services.ws;
  });

  describe("Service Structure", () => {
    it("should have correct service structure", () => {
      expect(runtimeService).toBeDefined();
      expect(typeof runtimeService.establishSession).toBe("function");
      expect(typeof runtimeService.start).toBe("function");
      expect(typeof runtimeService.stop).toBe("function");
      expect(typeof runtimeService.sendMessage).toBe("function");
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
            expect(session.agentId).toBe("test-agent");
            expect(session.chatId).toBe("test-chat");
            expect(session.prompt).toBe("Test prompt");
            expect(typeof session.send).toBe("function");

            return session;
          }),
        ).pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeDefined();
    });

    it("should handle endpoint resolution errors", async () => {
      const result = await Effect.runPromise(
        Effect.scoped(
          runtimeService.establishSession("invalid-agent", "test-chat"),
        ).pipe(Effect.provide(TestLayer), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AgentRuntimeError);
      }
    });
  });

  describe("Service Lifecycle", () => {
    it("should start and stop service", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          yield* runtimeService.start();
          const state = yield* Stream.take(runtimeService.getState, 1).pipe(
            Stream.runCollect,
          );
          expect(state.length).toBeGreaterThan(0);

          yield* runtimeService.stop();
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Resource Management", () => {
    it("should clean up resources properly", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const session = yield* runtimeService.establishSession(
              "test-agent",
              "test-chat",
            );

            // Session should be created
            expect(session).toBeDefined();

            // Resources should be cleaned up when scope exits
          }),
        ).pipe(Effect.provide(TestLayer)),
      );

      // Verify cleanup occurred
      const connectionHistory = await Effect.runPromise(
        mockWebSocketService._test
          .getConnectionHistory()
          .pipe(Effect.provide(TestLayer)),
      );

      expect(connectionHistory).toContain("disconnect");
    });
  });
});
