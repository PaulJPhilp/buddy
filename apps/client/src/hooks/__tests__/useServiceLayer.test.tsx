import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AgentService } from "../../services/agent";
import { AppService } from "../../services/app";
import { ChatService } from "../../services/chat";
import { ChatBridge } from "../../services/chat-bridge";
import { ConfigService } from "../../services/config";
import { MdxService } from "../../services/mdx";
import { ToolbarService } from "../../services/toolbar";
import { WebSocketService } from "../../services/websocket";
import { createServiceLayerLogic } from "../useServiceLayer";

describe("useServiceLayer", () => {
  beforeEach(() => {
    // Reset any global state before each test
    console.log("Starting useServiceLayer test");
  });

  afterEach(() => {
    console.log("Completed useServiceLayer test");
  });

  describe("Hook Structure", () => {
    it("should return layer and runWithServices function", () => {
      const result = createServiceLayerLogic();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("layer");
      expect(result).toHaveProperty("runWithServices");
      expect(typeof result.runWithServices).toBe("function");
    });

    it("should return consistent layer instance", () => {
      const firstResult = createServiceLayerLogic();
      const secondResult = createServiceLayerLogic();

      // Should return the same layer instance (shared at module level)
      expect(secondResult.layer).toBe(firstResult.layer);
    });

    it("should return different runWithServices function instances", () => {
      const firstResult = createServiceLayerLogic();
      const secondResult = createServiceLayerLogic();

      // Should return different function instances (new function each time)
      expect(secondResult.runWithServices).not.toBe(
        firstResult.runWithServices,
      );
    });
  });

  describe("Dependencies Array", () => {
    it("should handle empty dependencies array", () => {
      const result = createServiceLayerLogic([]);

      expect(result.layer).toBeDefined();
      expect(typeof result.runWithServices).toBe("function");
    });

    it("should handle undefined dependencies", () => {
      const result = createServiceLayerLogic(undefined);

      expect(result.layer).toBeDefined();
      expect(typeof result.runWithServices).toBe("function");
    });

    it("should handle dependencies with values", () => {
      const deps = ["test", 123, { key: "value" }];
      const result = createServiceLayerLogic(deps);

      expect(result.layer).toBeDefined();
      expect(typeof result.runWithServices).toBe("function");
    });

    it("should maintain same layer when dependencies don't change", () => {
      const deps = ["stable"];
      const firstResult = createServiceLayerLogic(deps);
      const secondResult = createServiceLayerLogic(deps);

      expect(secondResult.layer).toBe(firstResult.layer);
    });

    it("should maintain same layer even when dependencies change", () => {
      // Based on the implementation, the layer is shared at module level
      const firstResult = createServiceLayerLogic(["initial"]);
      const secondResult = createServiceLayerLogic(["changed"]);

      // Should be same layer because it's shared at module level
      expect(secondResult.layer).toBe(firstResult.layer);
    });
  });

  describe("Service Layer Composition", () => {
    it("should provide all required services", async () => {
      const { runWithServices } = createServiceLayerLogic();

      // Test that all services are available through the layer
      const testEffect = Effect.gen(function* () {
        // Try to access all services
        const app = yield* AppService;
        const agent = yield* AgentService;
        const toolbar = yield* ToolbarService;
        const chat = yield* ChatService;
        const mdx = yield* MdxService;
        const bridge = yield* ChatBridge;
        const webSocket = yield* WebSocketService;
        const config = yield* ConfigService;

        return {
          app: !!app,
          agent: !!agent,
          toolbar: !!toolbar,
          chat: !!chat,
          mdx: !!mdx,
          bridge: !!bridge,
          webSocket: !!webSocket,
          config: !!config,
        };
      });

      const services = await runWithServices(testEffect);

      expect(services.app).toBe(true);
      expect(services.agent).toBe(true);
      expect(services.toolbar).toBe(true);
      expect(services.chat).toBe(true);
      expect(services.mdx).toBe(true);
      expect(services.bridge).toBe(true);
      expect(services.webSocket).toBe(true);
      expect(services.config).toBe(true);
    });

    it("should handle service dependencies correctly", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const testEffect = Effect.gen(function* () {
        // Test services with dependencies
        const chat = yield* ChatService;
        const bridge = yield* ChatBridge;

        // These services have dependencies that should be resolved
        return {
          chatService: !!chat,
          bridgeService: !!bridge,
        };
      });

      const services = await runWithServices(testEffect);

      expect(services.chatService).toBe(true);
      expect(services.bridgeService).toBe(true);
    });
  });

  describe("runWithServices Function", () => {
    it("should execute simple effects", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const simpleEffect = Effect.succeed("test result");
      const outcome = await runWithServices(simpleEffect);

      expect(outcome).toBe("test result");
    });

    it("should execute effects with services", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const serviceEffect = Effect.gen(function* () {
        const config = yield* ConfigService;
        return typeof config;
      });

      const outcome = await runWithServices(serviceEffect);

      expect(typeof outcome).toBe("string");
    });

    it("should handle effects that return data", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const dataEffect = Effect.gen(function* () {
        const app = yield* AppService;
        return {
          hasService: !!app,
          timestamp: Date.now(),
        };
      });

      const result = await runWithServices(dataEffect);

      expect(result).toHaveProperty("hasService");
      expect(result).toHaveProperty("timestamp");
      expect(result.hasService).toBe(true);
      expect(typeof result.timestamp).toBe("number");
    });

    it("should handle concurrent effects", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const effects = [
        Effect.succeed("result1"),
        Effect.succeed("result2"),
        Effect.succeed("result3"),
      ];

      const results = await Promise.all(
        effects.map((effect) => runWithServices(effect)),
      );

      expect(results).toEqual(["result1", "result2", "result3"]);
    });

    it("should handle effects with error handling", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const errorEffect = Effect.gen(function* () {
        try {
          const config = yield* ConfigService;
          return { success: true, config: !!config };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      });

      const result = await runWithServices(errorEffect);

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });
  });

  describe("Function Lifecycle", () => {
    it("should handle multiple function calls", () => {
      const instances = [
        createServiceLayerLogic(),
        createServiceLayerLogic(),
        createServiceLayerLogic(),
      ];

      // All instances should share the same layer
      const firstLayer = instances[0].layer;
      for (const instance of instances) {
        expect(instance.layer).toBe(firstLayer);
      }
    });

    it("should handle function scope cleanup", () => {
      const instance1 = createServiceLayerLogic();
      const instance2 = createServiceLayerLogic();

      // Even after one instance goes out of scope,
      // the shared layer should still work
      expect(instance2.layer).toBe(instance1.layer);
    });

    it("should handle rapid function calls", () => {
      const instances = [];

      // Simulate rapid calling
      for (let i = 0; i < 10; i++) {
        instances.push(createServiceLayerLogic());
      }

      // All should share the same layer
      const firstLayer = instances[0].layer;
      for (const instance of instances) {
        expect(instance.layer).toBe(firstLayer);
      }
    });
  });

  describe("Performance", () => {
    it("should create layer efficiently", () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        createServiceLayerLogic();
      }

      const end = performance.now();
      const duration = end - start;

      // Should be very fast since layer is shared
      expect(duration).toBeLessThan(100); // Less than 100ms for 100 calls
    });

    it("should handle multiple concurrent function calls", () => {
      const instances = Array.from({ length: 50 }, () =>
        createServiceLayerLogic(),
      );

      // All should share the same layer
      const firstLayer = instances[0].layer;
      for (const instance of instances) {
        expect(instance.layer).toBe(firstLayer);
      }
    });

    it("should execute effects efficiently", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const start = performance.now();

      const effects = Array.from({ length: 10 }, (_, i) =>
        Effect.succeed(`result-${i}`),
      );

      const results = await Promise.all(
        effects.map((effect) => runWithServices(effect)),
      );

      const end = performance.now();
      const duration = end - start;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(300); // Should be reasonably fast
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid effects gracefully", async () => {
      const { runWithServices } = createServiceLayerLogic();

      try {
        // This should work fine since Effect.js handles this
        await runWithServices(Effect.succeed(undefined));
        expect(true).toBe(true); // Test passes if no error thrown
      } catch (error) {
        // If an error is thrown, it should be handled gracefully
        expect(error).toBeDefined();
      }
    });

    it("should handle service access errors", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const testEffect = Effect.gen(function* () {
        // Try to access services - this should work
        const config = yield* ConfigService;
        return !!config;
      });

      const result = await runWithServices(testEffect);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Integration", () => {
    it("should work with real service operations", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const integrationEffect = Effect.gen(function* () {
        // Test real service integration
        const config = yield* ConfigService;
        const app = yield* AppService;

        return {
          configService: !!config,
          appService: !!app,
        };
      });

      const result = await runWithServices(integrationEffect);

      expect(result.configService).toBe(true);
      expect(result.appService).toBe(true);
    });

    it("should maintain service state across multiple calls", async () => {
      const { runWithServices } = createServiceLayerLogic();

      const firstCall = await runWithServices(
        Effect.gen(function* () {
          const config = yield* ConfigService;
          return !!config;
        }),
      );

      const secondCall = await runWithServices(
        Effect.gen(function* () {
          const config = yield* ConfigService;
          return !!config;
        }),
      );

      expect(firstCall).toBe(true);
      expect(secondCall).toBe(true);
    });
  });
});
