import { describe, it, expect, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { ChatBridge } from "../service";
import type {
  ChatBridgeMessage,
  ChatBridgeConnectionConfig,
} from "../types";
import { ChatBridgeStateError } from "../errors";
import {
  createChatBridgeMessage,
  createChatBridgeHandler,
} from "../types";

describe("ChatBridge", () => {
  let serviceLayer: Layer.Layer<ChatBridge>;

  beforeEach(() => {
    serviceLayer = ChatBridge.Default;
  });

  describe("Core Bridge Operations", () => {
    it("should initialize successfully", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            return yield* bridge.noop();
          }),
          serviceLayer
        )
      );

      expect(result).toBeUndefined();
    });

    it("should start the bridge", async () => {
      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            const isStarted = yield* bridge.isStarted();
            expect(isStarted).toBe(true);
          }),
          serviceLayer
        )
      );
    });

    it("should stop the bridge", async () => {
      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            yield* bridge.stop();
            const isStarted = yield* bridge.isStarted();
            expect(isStarted).toBe(false);
          }),
          serviceLayer
        )
      );
    });

    it("should restart the bridge", async () => {
      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            yield* bridge.restart();
            const isStarted = yield* bridge.isStarted();
            expect(isStarted).toBe(true);
          }),
          serviceLayer
        )
      );
    });
  });

  describe("Message Handling", () => {
    it("should register a message handler", async () => {
      const handlerId = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();

            const handler = createChatBridgeHandler(
              (message) => {
                console.log("Handler received:", message);
              },
              { name: "test-handler" }
            );

            return yield* bridge.registerHandler(handler);
          }),
          serviceLayer
        )
      );

      expect(typeof handlerId).toBe("string");
      expect(handlerId).toMatch(/^handler_\d+_[a-z0-9]+$/);
    });

    it("should send a message to registered handlers", async () => {
      let receivedMessage: ChatBridgeMessage | null = null;

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();

            const handler = createChatBridgeHandler(
              (message) => {
                receivedMessage = message;
              },
              { messageTypes: ["test"] }
            );

            yield* bridge.registerHandler(handler);

            const message = createChatBridgeMessage("test", { content: "Hello" });
            yield* bridge.sendMessage(message);
          }),
          serviceLayer
        )
      );

      expect(receivedMessage).not.toBeNull();
      expect(receivedMessage?.type).toBe("test");
      expect(receivedMessage?.payload).toEqual({ content: "Hello" });
    });

    it("should fail to send message when bridge is not started", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(
            Effect.gen(function* () {
              const bridge = yield* ChatBridge;
              const message = createChatBridgeMessage("test", { content: "Hello" });
              return yield* bridge.sendMessage(message);
            }),
            serviceLayer
          )
        )
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ChatBridgeStateError);
        expect(result.left.message).toBe("Bridge not started");
      }
    });
  });

  describe("Connection Management", () => {
    it("should establish a connection", async () => {
      const connection = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();

            const config: ChatBridgeConnectionConfig = {
              endpoint: "ws://localhost:8080",
              protocol: "websocket",
            };

            return yield* bridge.establishConnection(config);
          }),
          serviceLayer
        )
      );

      expect(connection.endpoint).toBe("ws://localhost:8080");
      expect(connection.protocol).toBe("websocket");
      expect(connection.status).toBe("connected");
      expect(connection.id).toMatch(/^conn_\d+_[a-z0-9]+$/);
    });

    it("should get connection status", async () => {
      const status = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();

            const config: ChatBridgeConnectionConfig = {
              endpoint: "ws://localhost:8080",
              protocol: "websocket",
            };

            const connection = yield* bridge.establishConnection(config);
            return yield* bridge.getConnectionStatus(connection.id);
          }),
          serviceLayer
        )
      );

      expect(status).toBe("connected");
    });
  });

  describe("Health and Monitoring", () => {
    it("should get health status", async () => {
      const health = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            return yield* bridge.getHealth();
          }),
          serviceLayer
        )
      );

      expect(health.status).toBe("healthy");
      expect(health.serviceId).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should get metrics", async () => {
      const metrics = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            return yield* bridge.getMetrics();
          }),
          serviceLayer
        )
      );

      expect(metrics.messageCount).toBe(0);
      expect(metrics.connectionCount).toBe(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should ping successfully", async () => {
      const latency = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const bridge = yield* ChatBridge;
            yield* bridge.start();
            return yield* bridge.ping();
          }),
          serviceLayer
        )
      );

      expect(typeof latency).toBe("number");
      expect(latency).toBeGreaterThanOrEqual(0);
    });
  });
});
