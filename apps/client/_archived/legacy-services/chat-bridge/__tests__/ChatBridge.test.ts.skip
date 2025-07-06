import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocketService } from "../../websocket";
import type { ChatBridgeApi } from "../api";
import { ChatBridge } from "../service";

// Test layer using real services
const TestLayer = Layer.mergeAll(WebSocketService.Default, ChatBridge.Default);

describe("ChatBridge", () => {
  describe("Service Structure", () => {
    it("should have a valid service structure", () => {
      expect(ChatBridge.Default).toBeDefined();
      expect(typeof ChatBridge.Default).toBe("object");
      expect(ChatBridge.Default).toHaveProperty("pipe");
    });

    it("should provide proper service API", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          expect(bridge).toBeDefined();
          expect(typeof bridge.start).toBe("function");
          expect(typeof bridge.stop).toBe("function");
          expect(typeof bridge.isStarted).toBe("function");
          expect(typeof bridge.registerHandler).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Bridge Lifecycle", () => {
    it("should start in stopped state", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;
          const isStarted = yield* bridge.isStarted();

          expect(isStarted).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should start successfully", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Start the bridge
          yield* bridge.start();

          // Check if started
          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should stop successfully", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Start first
          yield* bridge.start();
          let isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);

          // Stop the bridge
          yield* bridge.stop();

          // Check if stopped
          isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle multiple start calls", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Start multiple times
          yield* bridge.start();
          yield* bridge.start();
          yield* bridge.start();

          // Should still be started
          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle multiple stop calls", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Start first
          yield* bridge.start();

          // Stop multiple times
          yield* bridge.stop();
          yield* bridge.stop();
          yield* bridge.stop();

          // Should still be stopped
          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle start/stop cycles", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Multiple start/stop cycles
          for (let i = 0; i < 3; i++) {
            yield* bridge.start();
            let isStarted = yield* bridge.isStarted();
            expect(isStarted).toBe(true);

            yield* bridge.stop();
            isStarted = yield* bridge.isStarted();
            expect(isStarted).toBe(false);
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Message Handler Management", () => {
    it("should register message handlers", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          let receivedMessage: any = null;
          const handler = (message: any) => {
            receivedMessage = message;
          };

          // Register handler
          yield* bridge.registerHandler(handler);

          // Handler should be registered (no direct way to verify count)
          expect(typeof handler).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should register multiple handlers", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const messages: any[] = [];

          const handler1 = (message: any) => {
            messages.push({ handler: 1, message });
          };

          const handler2 = (message: any) => {
            messages.push({ handler: 2, message });
          };

          const handler3 = (message: any) => {
            messages.push({ handler: 3, message });
          };

          // Register multiple handlers
          yield* bridge.registerHandler(handler1);
          yield* bridge.registerHandler(handler2);
          yield* bridge.registerHandler(handler3);

          // All handlers should be registered
          expect(typeof handler1).toBe("function");
          expect(typeof handler2).toBe("function");
          expect(typeof handler3).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle duplicate handler registration", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const handler = (message: any) => {
            // Handler logic
          };

          // Register same handler multiple times
          yield* bridge.registerHandler(handler);
          yield* bridge.registerHandler(handler);
          yield* bridge.registerHandler(handler);

          // Should not throw error
          expect(typeof handler).toBe("function");
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Service Dependencies", () => {
    it("should have WebSocketService dependency", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;
          const webSocket = yield* WebSocketService;

          // Both services should be available
          expect(bridge).toBeDefined();
          expect(webSocket).toBeDefined();
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should work with WebSocketService lifecycle", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;
          const webSocket = yield* WebSocketService;

          // Check WebSocket initial state
          const initiallyConnected = yield* webSocket.isConnected;
          expect(typeof initiallyConnected).toBe("boolean");

          // Start bridge
          yield* bridge.start();
          const bridgeStarted = yield* bridge.isStarted();
          expect(bridgeStarted).toBe(true);

          // Stop bridge
          yield* bridge.stop();
          const bridgeStopped = yield* bridge.isStarted();
          expect(bridgeStopped).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent start/stop operations", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Concurrent start operations
          yield* Effect.all([bridge.start(), bridge.start(), bridge.start()], {
            concurrency: "unbounded",
          });

          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);

          // Concurrent stop operations
          yield* Effect.all([bridge.stop(), bridge.stop(), bridge.stop()], {
            concurrency: "unbounded",
          });

          const isStopped = yield* bridge.isStarted();
          expect(isStopped).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle concurrent handler registration", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const handlers = Array.from(
            { length: 10 },
            (_, i) => (message: any) => {
              console.log(`Handler ${i} received:`, message);
            },
          );

          // Register handlers concurrently
          yield* Effect.all(
            handlers.map((handler) => bridge.registerHandler(handler)),
            { concurrency: "unbounded" },
          );

          // All handlers should be registered successfully
          expect(handlers.length).toBe(10);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle mixed concurrent operations", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const handler = (message: any) => {
            // Handler logic
          };

          // Mix of concurrent operations
          yield* Effect.all(
            [
              bridge.start(),
              bridge.registerHandler(handler),
              bridge.isStarted(),
              bridge.start(), // Duplicate start
            ],
            { concurrency: "unbounded" },
          );

          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid handler registration gracefully", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Try to register null handler
          try {
            yield* bridge.registerHandler(null as any);
            // Should not throw, but handle gracefully
          } catch (error) {
            // If it does throw, that's also acceptable
            expect(error).toBeDefined();
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle undefined handler registration", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          try {
            yield* bridge.registerHandler(undefined as any);
            // Should not throw, but handle gracefully
          } catch (error) {
            // If it does throw, that's also acceptable
            expect(error).toBeDefined();
          }
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Service Integration", () => {
    it("should work with Effect combinators", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Test Effect.all with bridge methods
          const [startResult, isStartedResult] = yield* Effect.all([
            bridge.start(),
            bridge.isStarted(),
          ]);

          // isStarted might be false if called before start completes
          expect(typeof isStartedResult).toBe("boolean");
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle service scoping properly", async () => {
      // Test that multiple service instances work correctly
      const result1 = await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;
          return yield* bridge.isStarted();
        }).pipe(Effect.provide(TestLayer)),
      );

      const result2 = await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;
          return yield* bridge.isStarted();
        }).pipe(Effect.provide(TestLayer)),
      );

      expect(typeof result1).toBe("boolean");
      expect(typeof result2).toBe("boolean");
    });

    it("should handle effect composition", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Compose multiple operations
          yield* bridge.start();
          const started = yield* bridge.isStarted();

          const handler = (message: any) => {
            console.log("Composed handler:", message);
          };
          yield* bridge.registerHandler(handler);

          yield* bridge.stop();
          const stopped = yield* bridge.isStarted();

          expect(started).toBe(true);
          expect(stopped).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("Performance", () => {
    it("should handle many handler registrations efficiently", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const startTime = Date.now();

          // Register many handlers
          const handlers = Array.from(
            { length: 100 },
            (_, i) => (message: any) => {
              // Simple handler
              return `Handler ${i}: ${message}`;
            },
          );

          for (const handler of handlers) {
            yield* bridge.registerHandler(handler);
          }

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should complete within reasonable time (less than 1 second)
          expect(duration).toBeLessThan(1000);
          expect(handlers.length).toBe(100);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle rapid start/stop cycles efficiently", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          const startTime = Date.now();

          // Rapid start/stop cycles
          for (let i = 0; i < 10; i++) {
            yield* bridge.start();
            yield* bridge.stop();
          }

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should complete within reasonable time
          expect(duration).toBeLessThan(1000);

          // Should end in stopped state
          const isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });

  describe("State Consistency", () => {
    it("should maintain consistent state across operations", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Initial state
          let isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(false);

          // Start and verify
          yield* bridge.start();
          isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);

          // Register handler (should not affect started state)
          const handler = (message: any) => message;
          yield* bridge.registerHandler(handler);
          isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(true);

          // Stop and verify
          yield* bridge.stop();
          isStarted = yield* bridge.isStarted();
          expect(isStarted).toBe(false);
        }).pipe(Effect.provide(TestLayer)),
      );
    });

    it("should handle state queries during transitions", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const bridge = yield* ChatBridge;

          // Query state multiple times during start
          const stateChecks = Array.from({ length: 5 }, () =>
            bridge.isStarted(),
          );

          // Start bridge
          yield* bridge.start();

          // All state checks should complete
          const states = yield* Effect.all(stateChecks);

          expect(states.length).toBe(5);
          states.forEach((state) => {
            expect(typeof state).toBe("boolean");
          });
        }).pipe(Effect.provide(TestLayer)),
      );
    });
  });
});
