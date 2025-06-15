import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigLifecycleService } from "../ConfigLifecycleService";

// Mock fetch globally
global.fetch = vi.fn();

const mockChatAppConfig: ChatAppConfig = {
  id: "test-config",
  name: "Test Config",
  agentId: "test-agent",
  toolbarId: "test-toolbar",
  themeId: "test-theme",
  theme: {
    colors: {
      primary: "blue-600",
      secondary: "gray-100",
    },
  },
};

describe("ConfigLifecycleService - XState Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should manage state transitions correctly", async () => {
    const mockFetch = fetch as any;

    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: "test-config.json", lastModified: Date.now(), size: 1000 },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              chatApps: [mockChatAppConfig],
                "test-theme": mockChatAppConfig.theme,
              },
            }),
          ),
      });

    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;

      // Get initial state
      const initialState = yield* service.getState();
      expect(initialState.configs).toHaveLength(0);
      expect(initialState.loading).toBe(false);
      expect(initialState.activeConfigId).toBe(null);

      // Load configs
      const configs = yield* service.loadConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("test-config");

      // Get state after loading
      const loadedState = yield* service.getState();
      expect(loadedState.configs).toHaveLength(1);
      expect(loadedState.loading).toBe(false);

      // Set active config
      yield* service.setActive("test-config");
      const activeState = yield* service.getState();
      expect(activeState.activeConfigId).toBe("test-config");

      // Toggle config open
      yield* service.toggleOpen("test-config");
      const openState = yield* service.getState();
      expect(openState.openConfigs.has("test-config")).toBe(true);

      // Toggle config closed
      yield* service.toggleOpen("test-config");
      const closedState = yield* service.getState();
      expect(closedState.openConfigs.has("test-config")).toBe(false);

      // Change display mode
      yield* service.setDisplayMode("compact");
      const compactState = yield* service.getState();
      expect(compactState.displayMode).toBe("compact");

      return compactState;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    expect(result.configs).toHaveLength(1);
    expect(result.activeConfigId).toBe("test-config");
    expect(result.displayMode).toBe("compact");
  });

  it("should handle subscription to state changes", async () => {
    const mockFetch = fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;
      const stateChanges: any[] = [];

      // Subscribe to state changes
      const subscription = yield* service.subscribe((state) => {
        stateChanges.push(state);
      });

      // Trigger some state changes
      yield* service.setActive("test-id");
      yield* service.setDisplayMode("compact");
      yield* service.toggleOpen("test-id");

      // Cleanup
      subscription.unsubscribe();

      return stateChanges;
    });

    const stateChanges = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    // Should have received state changes
    expect(stateChanges.length).toBeGreaterThan(0);

    // Check that the final state has our changes
    const finalState = stateChanges[stateChanges.length - 1];
    expect(finalState.activeConfigId).toBe("test-id");
    expect(finalState.displayMode).toBe("compact");
    expect(finalState.openConfigs.has("test-id")).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const mockFetch = fetch as any;
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;
      return yield* service.loadConfigs();
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(ConfigLifecycleService.Default),
        Effect.either,
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.message).toContain("Failed to fetch config file list");
    }
  });

  it("should handle config updates correctly", async () => {
    const mockFetch = fetch as any;

    // Mock initial load
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: "test-config.json", lastModified: Date.now(), size: 1000 },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              chatApps: [mockChatAppConfig],
            }),
          ),
      })
      // Mock save operation
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const program = Effect.gen(function* () {
      const service = yield* ConfigLifecycleService;

      // Load initial configs
      yield* service.loadConfigs();

      // Update a config
      yield* service.updateConfig("test-config", {
        name: "Updated Test Config",
      });

      // Get final state
      const finalState = yield* service.getState();
      return finalState;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ConfigLifecycleService.Default)),
    );

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].name).toBe("Updated Test Config");
  });
});
