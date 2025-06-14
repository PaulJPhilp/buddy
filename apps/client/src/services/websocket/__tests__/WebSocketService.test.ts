import { Effect, Stream } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocketError, WebSocketService } from "../WebSocketService";
import { testServer } from "./websocket-test-server";

describe("WebSocketService", () => {
  beforeAll(async () => {
    await testServer.start();
  });

  afterAll(async () => {
    await testServer.stop();
  });

  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(WebSocketService.Default).toBeDefined();
      expect(typeof WebSocketService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(WebSocketService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* WebSocketService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(WebSocketService.Default)),
      ).not.toThrow();
    });
  });

  describe("service creation", () => {
    it("should create service successfully", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;
            expect(service).toBeDefined();
            expect(service._tag).toBe("WebSocketService");
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });

    it("should have isConnected property as boolean", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;
            expect(typeof service.isConnected).toBe("boolean");
            expect(service.isConnected).toBe(false); // Initially disconnected
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });

    it("should have messageStream property", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;
            expect(service.messageStream).toBeDefined();
            // messageStream should be a Stream
            expect(typeof service.messageStream).toBe("object");
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });
  });

  describe("connection management", () => {
    it("should connect to WebSocket server without errors", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;

            // Initially not connected
            expect(service.isConnected).toBe(false);

            // Connect to test server - this should succeed without throwing
            yield* service.connect(testServer.getUrl());

            // The connection process completed successfully if we reach here
            expect(true).toBe(true);
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });

    it("should handle disconnect after connect", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;

            // Connect first
            yield* service.connect(testServer.getUrl());

            // Then disconnect - this should succeed without throwing
            yield* service.disconnect();

            // The disconnect process completed successfully if we reach here
            expect(true).toBe(true);
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });

    it("should handle connection to invalid URL", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;

            // Try to connect to invalid URL
            const result = yield* Effect.either(
              service.connect("ws://invalid-url:9999"),
            );

            expect(result._tag).toBe("Left");
            if (result._tag === "Left") {
              expect(result.left).toBeInstanceOf(WebSocketError);
            }

            // Should remain disconnected
            expect(service.isConnected).toBe(false);
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });
  });

  describe("message handling", () => {
    it("should have working message stream", async () => {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;

            // Connect to test server
            yield* service.connect(testServer.getUrl());

            // Get message stream
            const messageStream = service.messageStream;
            expect(messageStream).toBeDefined();

            // Stream should be a Stream object
            expect(typeof messageStream).toBe("object");
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );
    });

    it("should fail to send message when not connected", async () => {
      const result = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const service = yield* WebSocketService;

            // Ensure not connected
            expect(service.isConnected).toBe(false);

            // Try to send message - this should fail
            return yield* Effect.either(
              service.send({
                text: "test message",
                timestamp: new Date().toISOString(),
              }),
            );
          }),
        ).pipe(Effect.provide(WebSocketService.Default)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(WebSocketError);
      }
    });
  });
});
