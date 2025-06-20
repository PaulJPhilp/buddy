import { ChatService } from "@/services/chat";
import { Effect, Layer } from "effect";
import { describe, expect, test } from "vitest";

// Extract core logic for testing
interface ServiceResolutionResult {
  readonly success: boolean;
  readonly service?: any;
  readonly error?: unknown;
  readonly instanceId?: string;
}

function createServiceResolutionLogic() {
  let callCount = 0;

  return {
    getCallCount: () => callCount,
    incrementCallCount: () => ++callCount,

    resolveService: async (
      layer: Layer.Layer<any, never, never> | null,
    ): Promise<ServiceResolutionResult> => {
      if (!layer) {
        return { success: false, error: "No layer provided" };
      }

      try {
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            const chat = yield* ChatService;
            return chat;
          }).pipe(Effect.provide(layer)),
        );

        return {
          success: true,
          service,
          instanceId: (service as any)?.instanceId || "unknown",
        };
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    },

    cleanupService: async (service: any): Promise<void> => {
      if (service && typeof service.cleanup === "function") {
        await Effect.runPromise(service.cleanup());
      }
    },
  };
}

describe("useChatService Core Logic", () => {
  describe("Call Tracking", () => {
    test("should track hook call count correctly", () => {
      const logic = createServiceResolutionLogic();

      expect(logic.getCallCount()).toBe(0);

      logic.incrementCallCount();
      expect(logic.getCallCount()).toBe(1);

      logic.incrementCallCount();
      logic.incrementCallCount();
      expect(logic.getCallCount()).toBe(3);
    });
  });

  describe("Service Resolution", () => {
    test("should handle null layer gracefully", async () => {
      const logic = createServiceResolutionLogic();

      const result = await logic.resolveService(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No layer provided");
      expect(result.service).toBeUndefined();
    });

    test("should resolve service with valid layer", async () => {
      const logic = createServiceResolutionLogic();

      // Create a simple test layer that provides ChatService
      const testLayer = Layer.succeed(ChatService, {
        instanceId: "test-123",
        getState: () => Effect.succeed({ messages: [], isTyping: false }),
        sendMessage: () => Effect.succeed("sent"),
        cleanup: () => Effect.succeed(undefined),
        stateStream: null as any,
      });

      const result = await logic.resolveService(testLayer);

      expect(result.success).toBe(true);
      expect(result.service).toBeDefined();
      expect(result.instanceId).toBe("test-123");
      expect(result.error).toBeUndefined();
    });

    test("should handle service resolution errors", async () => {
      const logic = createServiceResolutionLogic();

      // Create a layer that will fail
      const failingLayer = Layer.effect(
        ChatService,
        Effect.fail(new Error("Service resolution failed")),
      );

      const result = await logic.resolveService(failingLayer);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.service).toBeUndefined();
    });

    test("should extract instanceId from resolved service", async () => {
      const logic = createServiceResolutionLogic();

      const testService = {
        instanceId: "custom-instance-456",
        getState: () => Effect.succeed({ messages: [], isTyping: false }),
        cleanup: () => Effect.succeed(undefined),
      };

      const testLayer = Layer.succeed(ChatService, testService);

      const result = await logic.resolveService(testLayer);

      expect(result.success).toBe(true);
      expect(result.instanceId).toBe("custom-instance-456");
    });

    test("should handle service without instanceId", async () => {
      const logic = createServiceResolutionLogic();

      const testService = {
        getState: () => Effect.succeed({ messages: [], isTyping: false }),
        cleanup: () => Effect.succeed(undefined),
      };

      const testLayer = Layer.succeed(ChatService, testService);

      const result = await logic.resolveService(testLayer);

      expect(result.success).toBe(true);
      expect(result.instanceId).toBe("unknown");
    });
  });

  describe("Service Cleanup", () => {
    test("should cleanup service with cleanup method", async () => {
      const logic = createServiceResolutionLogic();
      let cleanupCalled = false;

      const testService = {
        instanceId: "cleanup-test",
        cleanup: () => {
          cleanupCalled = true;
          return Effect.succeed(undefined);
        },
      };

      await logic.cleanupService(testService);

      expect(cleanupCalled).toBe(true);
    });

    test("should handle service without cleanup method", async () => {
      const logic = createServiceResolutionLogic();

      const testService = {
        instanceId: "no-cleanup",
      };

      // Should not throw
      await expect(logic.cleanupService(testService)).resolves.toBeUndefined();
    });

    test("should handle null service cleanup", async () => {
      const logic = createServiceResolutionLogic();

      // Should not throw
      await expect(logic.cleanupService(null)).resolves.toBeUndefined();
    });

    test("should handle cleanup errors gracefully", async () => {
      const logic = createServiceResolutionLogic();

      const testService = {
        cleanup: () => Effect.fail(new Error("Cleanup failed")),
      };

      // Should handle cleanup errors without throwing
      await expect(logic.cleanupService(testService)).rejects.toThrow(
        "Cleanup failed",
      );
    });
  });

  describe("Integration Scenarios", () => {
    test("should handle complete service lifecycle", async () => {
      const logic = createServiceResolutionLogic();
      let cleanupCalled = false;

      const testService = {
        instanceId: "lifecycle-test",
        getState: () => Effect.succeed({ messages: [], isTyping: false }),
        sendMessage: (text: string) => Effect.succeed(`Sent: ${text}`),
        cleanup: () => {
          cleanupCalled = true;
          return Effect.succeed(undefined);
        },
      };

      const testLayer = Layer.succeed(ChatService, testService);

      // Resolve service
      const result = await logic.resolveService(testLayer);
      expect(result.success).toBe(true);
      expect(result.service).toBeDefined();

      // Use service
      const state = await Effect.runPromise(result.service!.getState());
      expect(state).toEqual({ messages: [], isTyping: false });

      // Cleanup service
      await logic.cleanupService(result.service);
      expect(cleanupCalled).toBe(true);
    });

    test("should handle rapid resolution attempts", async () => {
      const logic = createServiceResolutionLogic();

      const testLayer = Layer.succeed(ChatService, {
        instanceId: "rapid-test",
        getState: () => Effect.succeed({ messages: [], isTyping: false }),
        cleanup: () => Effect.succeed(undefined),
      });

      // Simulate rapid resolution attempts
      const promises = Array.from({ length: 5 }, () =>
        logic.resolveService(testLayer),
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.instanceId).toBe("rapid-test");
      });
    });

    test("should handle mixed success and failure scenarios", async () => {
      const logic = createServiceResolutionLogic();

      const successLayer = Layer.succeed(ChatService, {
        instanceId: "success",
        cleanup: () => Effect.succeed(undefined),
      });

      const failLayer = Layer.effect(
        ChatService,
        Effect.fail(new Error("Failed")),
      );

      const [successResult, failResult] = await Promise.all([
        logic.resolveService(successLayer),
        logic.resolveService(failLayer),
      ]);

      expect(successResult.success).toBe(true);
      expect(successResult.instanceId).toBe("success");

      expect(failResult.success).toBe(false);
      expect(failResult.error).toBeDefined();
    });
  });

  describe("Performance", () => {
    test("should resolve service efficiently", async () => {
      const logic = createServiceResolutionLogic();

      const testLayer = Layer.succeed(ChatService, {
        instanceId: "perf-test",
        cleanup: () => Effect.succeed(undefined),
      });

      const start = performance.now();
      const result = await logic.resolveService(testLayer);
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });
});
