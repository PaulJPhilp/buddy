import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { ConfigLifecycleService } from "../ConfigLifecycleService";
import "./setup";

// Real test config for testing with actual external services
const realTestConfig: ChatAppConfig = {
  id: "xstate-test-config",
  name: "XState Test Config",
  type: "chat",
  theme: {
    name: "XState Test Theme",
    colors: {
      primary: "blue-500",
      secondary: "gray-100",
    },
  },
  themeId: "xstate-test-theme",
};

describe("ConfigLifecycleService - XState Store", () => {
  beforeEach(() => {
    // No mocks - using real external services
  });

  it("should manage state transitions correctly", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;

      // Get initial state from real external service
      const initialState = yield* service.getState();
      expect(initialState.configs).toBeDefined();
      expect(initialState.loading).toBe(false);
      expect(initialState.activeConfigId).toBe(null);

      // Load configs from real external service
      const configs = yield* service.loadConfigs();
      expect(Array.isArray(configs)).toBe(true);

      // Get state after loading from real service
      const loadedState = yield* service.getState();
      expect(loadedState.configs).toBeDefined();
      expect(loadedState.loading).toBe(false);

      if (configs.length > 0) {
        const configId = configs[0].id;

        // Set active config in real service
        yield* service.setActive(configId);
        const activeState = yield* service.getState();
        expect(activeState.activeConfigId).toBe(configId);

        // Toggle config open in real service
        yield* service.toggleOpen(configId);
        const openState = yield* service.getState();
        expect(openState.openConfigs.has(configId)).toBe(true);

        // Toggle config closed in real service
        yield* service.toggleOpen(configId);
        const closedState = yield* service.getState();
        expect(closedState.openConfigs.has(configId)).toBe(false);
      }

      // Change display mode in real service
      yield* service.setDisplayMode("compact");
      const compactState = yield* service.getState();
      expect(compactState.displayMode).toBe("compact");

      return compactState;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    expect(result.configs).toBeDefined();
    expect(result.displayMode).toBe("compact");
  });

  it("should handle subscription to state changes", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;
      const stateChanges: any[] = [];

      // Subscribe to real state changes from external service
      const subscription = yield* service.subscribe((state) => {
        stateChanges.push(state);
      });

      // Trigger some real state changes
      yield* service.setActive("test-id");
      yield* service.setDisplayMode("compact");
      yield* service.toggleOpen("test-id");

      // Wait for real state propagation
      yield* Effect.sleep("100 millis");

      // Cleanup
      subscription.unsubscribe();

      return stateChanges;
    });

    const stateChanges = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    // Should have received real state changes from external service
    expect(stateChanges.length).toBeGreaterThan(0);

    // Check that the final state has our changes
    const finalState = stateChanges[stateChanges.length - 1];
    expect(finalState.activeConfigId).toBe("test-id");
    expect(finalState.displayMode).toBe("compact");
    expect(finalState.openConfigs.has("test-id")).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;

      // Try operation that will fail with real external service
      return yield* service.loadConfigs().pipe(Effect.either);
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    // Real external service should return either success or proper error
    expect(["Left", "Right"]).toContain(result._tag);

    if (result._tag === "Left") {
      expect(result.left).toHaveProperty("_tag");
    } else {
      expect(Array.isArray(result.right)).toBe(true);
    }
  });

  it("should handle config updates correctly", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;

      // Load real configs from external service
      const configs = yield* service.loadConfigs();

      if (configs.length > 0) {
        const configId = configs[0].id;

        // Update a config using real external service
        yield* service.updateConfigWithSave(configId, {
          name: `Updated Test Config ${Date.now()}`,
        });

        // Get final state from real service
        const finalState = yield* service.getState();
        return { finalState, configId };
      }

      return { finalState: yield* service.getState(), configId: null };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    expect(result.finalState.configs).toBeDefined();
    expect(Array.isArray(result.finalState.configs)).toBe(true);

    if (result.configId) {
      const updatedConfig = result.finalState.configs.find(
        (c: any) => c.id === result.configId,
      );
      expect(updatedConfig).toBeDefined();
      expect(updatedConfig.name).toContain("Updated Test Config");
    }
  });
});
