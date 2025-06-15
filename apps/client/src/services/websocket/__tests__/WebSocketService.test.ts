import { Effect, Stream } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocketConnectionManager } from "../WebSocketConnectionManager";
import { WebSocketError, WebSocketService } from "../WebSocketService";
import { TEST_WS_URL, testServer } from "./setup";

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
        expect(service).toBeDefined();
        expect(service._tag).toBe("WebSocketService");
      });

      expect(() =>
        Effect.runSync(
          testEffect.pipe(
            Effect.provide(WebSocketService.Default),
            Effect.provide(WebSocketConnectionManager.Default),
          ),
        ),
      ).not.toThrow();
    });
  });

  describe("service creation", () => {
    it("should create service successfully", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          expect(service).toBeDefined();
          expect(service._tag).toBe("WebSocketService");
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });

    it("should have isConnected property as Effect", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          const isConnected = yield* service.isConnected;
          expect(typeof isConnected).toBe("boolean");
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });

    it("should have messageStream property", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          expect(service.messageStream).toBeDefined();
          // Check that it has stream-like properties
          expect(service.messageStream).toHaveProperty("pipe");
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });
  });

  describe("connection management", () => {
    it("should connect to WebSocket server without errors", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          yield* service.connect(TEST_WS_URL);
          const isConnected = yield* service.isConnected;
          expect(isConnected).toBe(true);
          yield* service.disconnect();
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });

    it("should handle disconnect after connect", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          yield* service.connect(TEST_WS_URL);
          yield* service.disconnect();
          const isConnected = yield* service.isConnected;
          expect(isConnected).toBe(false);
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });

    it("should handle connection to invalid URL", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          // Use catchAllDefect to handle both errors and defects
          const result = yield* Effect.either(
            service.connect("ws://invalid-url:9998").pipe(
              Effect.catchAllDefect((defect) =>
                Effect.fail(
                  new WebSocketError({
                    code: "CONNECT_ERROR",
                    message: "Connection failed due to defect",
                    cause: defect,
                  }),
                ),
              ),
            ),
          );
          expect(result._tag).toBe("Left");
          if (result._tag === "Left") {
            expect(result.left).toBeInstanceOf(WebSocketError);
            expect(result.left.code).toBe("CONNECT_ERROR");
          }
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });
  });

  describe("message handling", () => {
    it("should have working message stream", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          expect(service.messageStream).toBeDefined();
          // Check that it has stream-like properties
          expect(service.messageStream).toHaveProperty("pipe");
          expect(typeof service.messageStream.pipe).toBe("function");
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });

    it("should fail to send message when not connected", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* WebSocketService;
          const result = yield* Effect.either(
            service.send({ type: "test", text: "test" }),
          );
          expect(result._tag).toBe("Left");
          expect(result.left).toBeInstanceOf(WebSocketError);
          expect(result.left.code).toBe("NOT_CONNECTED");
        }).pipe(
          Effect.provide(WebSocketService.Default),
          Effect.provide(WebSocketConnectionManager.Default),
        ),
      );
    });
  });
});
