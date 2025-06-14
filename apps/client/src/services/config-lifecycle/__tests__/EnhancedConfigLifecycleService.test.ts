import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnhancedConfigLifecycleService } from "../EnhancedConfigLifecycleService";

// Mock fetch globally
global.fetch = vi.fn();

// Mock config for testing
const mockConfig: ChatAppConfig = {
  id: "test-config",
  name: "Test Config",
  type: "chat",
  theme: {
    name: "Test Theme",
    colors: {
      background: "#ffffff",
      text: "#000000",
      accent: "#3b82f6",
    },
  },
  themeId: "test-theme",
};

describe("EnhancedConfigLifecycleService", () => {
  let service: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/configs") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["test-config.json"]),
        });
      }

      if (url.includes("test-config.json")) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                version: "1.0",
                chatApps: [mockConfig],
                themes: { "test-theme": mockConfig.theme },
              }),
            ),
          headers: {
            get: (name: string) =>
              name === "last-modified" ? new Date().toISOString() : null,
          },
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("{}"),
      });
    });

    // Create service instance with layer
    service = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* EnhancedConfigLifecycleService;
      }).pipe(Effect.provide(EnhancedConfigLifecycleService.Default)),
    );
  });

  afterEach(() => {
    vi.clearAllTimers?.();
  });

  describe("Basic Operations", () => {
    it("should load configs successfully", async () => {
      const configs = await Effect.runPromise(service.loadConfigs());

      expect(configs).toHaveLength(1);
      expect(configs[0]).toMatchObject({
        id: "test-config",
        name: "Test Config",
      });
    });

    it("should track save status correctly", async () => {
      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Get initial save status
      const initialStatus = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(initialStatus).toBe("saved");
    });

    it("should update config and mark as dirty", async () => {
      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Update config
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", { name: "Updated Name" }),
      );

      // Check save status
      const status = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(status).toBe("dirty");
    });
  });

  describe("Auto-save Functionality", () => {
    it("should auto-save after debounce delay", async () => {
      vi.useFakeTimers();

      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Update config (should trigger auto-save)
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", {
          name: "Auto-save Test",
        }),
      );

      // Initially should be dirty
      let status = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(status).toBe("dirty");

      // Fast-forward time to trigger debounced save
      vi.advanceTimersByTime(2500); // 2.5 seconds (more than 2 second debounce)

      // Allow promises to resolve
      await vi.runAllTimersAsync();

      // Should now be saved
      status = await Effect.runPromise(service.getSaveStatus("test-config"));
      expect(status).toBe("saved");

      vi.useRealTimers();
    });

    it("should cancel previous debounced save when new update comes", async () => {
      vi.useFakeTimers();

      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // First update
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", { name: "First Update" }),
      );

      // Wait 1 second (less than debounce delay)
      vi.advanceTimersByTime(1000);

      // Second update (should cancel first save)
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", { name: "Second Update" }),
      );

      // Wait for debounce to complete
      vi.advanceTimersByTime(2500);
      await vi.runAllTimersAsync();

      // Should have saved only once (the second update)
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/configs",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Second Update"),
        }),
      );

      vi.useRealTimers();
    });
  });

  describe("Immediate Save Operations", () => {
    it("should save immediately with updateConfigWithSave", async () => {
      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Update with immediate save
      await Effect.runPromise(
        service.updateConfigWithSave("test-config", { name: "Immediate Save" }),
      );

      // Should be saved immediately
      const status = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(status).toBe("saved");

      // Should have called save API
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/configs",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Immediate Save"),
        }),
      );
    });

    it("should save explicitly with saveConfig", async () => {
      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Update config (marks as dirty)
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", {
          name: "Manual Save Test",
        }),
      );

      // Explicitly save
      await Effect.runPromise(service.saveConfig("test-config"));

      // Should be saved
      const status = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(status).toBe("saved");
    });
  });

  describe("State Management", () => {
    it("should toggle auto-save setting", async () => {
      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Get initial state
      let state = await Effect.runPromise(service.getState());
      const initialAutoSave = state.autoSaveEnabled;

      // Toggle auto-save
      await Effect.runPromise(service.toggleAutoSave());

      // Check state changed
      state = await Effect.runPromise(service.getState());
      expect(state.autoSaveEnabled).toBe(!initialAutoSave);
    });

    it("should track multiple configs independently", async () => {
      // Mock multiple configs
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === "/api/configs") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(["config1.json", "config2.json"]),
          });
        }

        if (url.includes("config1.json")) {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  version: "1.0",
                  chatApps: [{ ...mockConfig, id: "config1" }],
                  themes: {},
                }),
              ),
            headers: { get: () => new Date().toISOString() },
          });
        }

        if (url.includes("config2.json")) {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  version: "1.0",
                  chatApps: [{ ...mockConfig, id: "config2" }],
                  themes: {},
                }),
              ),
            headers: { get: () => new Date().toISOString() },
          });
        }

        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      // Load configs
      await Effect.runPromise(service.loadConfigs());

      // Update first config
      await Effect.runPromise(
        service.updateConfigImmediate("config1", { name: "Updated Config 1" }),
      );

      // Check save statuses
      const status1 = await Effect.runPromise(service.getSaveStatus("config1"));
      const status2 = await Effect.runPromise(service.getSaveStatus("config2"));

      expect(status1).toBe("dirty");
      expect(status2).toBe("saved");
    });
  });

  describe("Error Handling", () => {
    it("should handle save errors gracefully", async () => {
      // Mock save failure
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (options?.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });
        }

        // Return success for other requests
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["test-config.json"]),
          text: () =>
            Promise.resolve(
              JSON.stringify({
                version: "1.0",
                chatApps: [mockConfig],
                themes: {},
              }),
            ),
          headers: { get: () => new Date().toISOString() },
        });
      });

      // Load configs first
      await Effect.runPromise(service.loadConfigs());

      // Try to save (should fail)
      await expect(
        Effect.runPromise(service.saveConfig("test-config")),
      ).rejects.toThrow();

      // Status should be error
      const status = await Effect.runPromise(
        service.getSaveStatus("test-config"),
      );
      expect(status).toBe("error");
    });
  });

  describe("Subscription System", () => {
    it("should notify subscribers of state changes", async () => {
      const mockCallback = vi.fn();

      // Subscribe to changes
      const subscription = await Effect.runPromise(
        service.subscribe(mockCallback),
      );

      // Load configs (should trigger callback)
      await Effect.runPromise(service.loadConfigs());

      // Update config (should trigger callback)
      await Effect.runPromise(
        service.updateConfigImmediate("test-config", {
          name: "Subscription Test",
        }),
      );

      // Should have been called multiple times
      expect(mockCallback).toHaveBeenCalledTimes(2);

      // Cleanup
      subscription.unsubscribe();
    });
  });
});
