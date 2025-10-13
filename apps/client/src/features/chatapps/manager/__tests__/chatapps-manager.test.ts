import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoreManager } from "../../core";
import { ChatAppsManager } from "../service";
import type { ChatAppInstance } from "../types";

describe("ChatAppsManager", () => {
  const testLayer = Layer.merge(CoreManager.Default, ChatAppsManager.Default);

  const testChatAppConfig = {
    id: "test-app",
    name: "Test App",
    description: "A test chat app",
    version: "1.0.0",
    agents: [],
    settings: {},
  };

  describe("Basic Operations", () => {
    it("should initialize with empty state", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;
          const state = yield* manager.getState();
          return state;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.chatAppInstances).toEqual({});
      expect(result.activeAppId).toBeNull();
      expect(result.stats.totalApps).toBe(0);
      expect(result.focusMode.isActive).toBe(false);
    });

    it("should register a chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;
          const instance = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          return instance;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.id).toBe("test-app-1");
      expect(result.workspaceId).toBe("workspace-1");
      expect(result.status).toBe("stashed");
      expect(result.isActive).toBe(false);
      expect(result.config).toEqual(testChatAppConfig);
    });

    it("should prevent duplicate registration", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.registerChatApp(
          "workspace-1",
          "test-app-1",
          testChatAppConfig
        );
        // Try to register same app again
        yield* manager.registerChatApp(
          "workspace-1",
          "test-app-1",
          testChatAppConfig
        );
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(testLayer)))
      ).rejects.toThrow("ChatApp already exists");
    });

    it("should unregister a chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register first
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Verify it exists
          const beforeState = yield* manager.getState();
          expect(Object.keys(beforeState.chatAppInstances)).toHaveLength(1);

          // Unregister
          yield* manager.unregisterChatApp("test-app-1");

          // Verify it's gone
          const afterState = yield* manager.getState();
          return afterState;
        }).pipe(Effect.provide(testLayer))
      );

      expect(Object.keys(result.chatAppInstances)).toHaveLength(0);
      expect(result.stats.totalApps).toBe(0);
    });

    it("should get chat app instance", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register first
          const registered = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Get instance
          const instance = yield* manager.getChatAppInstance("test-app-1");
          return { registered, instance };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.instance).toEqual(result.registered);
      expect(result.instance.id).toBe("test-app-1");
    });

    it("should get all chat apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          const config2 = { ...testChatAppConfig, id: "test-app-2" };
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);

          // Get all apps
          const allApps = yield* manager.getAllChatApps();
          return allApps;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toHaveLength(2);
      expect(result.map((app) => app.id).sort()).toEqual([
        "test-app-1",
        "test-app-2",
      ]);
    });

    it("should get chat apps in workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register apps in different workspaces
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp(
            "workspace-2",
            "test-app-2",
            testChatAppConfig
          );
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-3",
            testChatAppConfig
          );

          // Get apps in workspace-1
          const workspace1Apps = yield* manager.getChatAppsInWorkspace(
            "workspace-1"
          );
          const workspace2Apps = yield* manager.getChatAppsInWorkspace(
            "workspace-2"
          );

          return { workspace1Apps, workspace2Apps };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.workspace1Apps).toHaveLength(2);
      expect(result.workspace2Apps).toHaveLength(1);
      expect(result.workspace1Apps.map((app) => app.id).sort()).toEqual([
        "test-app-1",
        "test-app-3",
      ]);
      expect(result.workspace2Apps[0].id).toBe("test-app-2");
    });
  });

  describe("State Management", () => {
    it("should update stats when apps are registered", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Initial state
          const initialState = yield* manager.getState();
          expect(initialState.stats.totalApps).toBe(0);

          // Register an app
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Check updated stats
          const updatedState = yield* manager.getState();
          return updatedState;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stats.totalApps).toBe(1);
      expect(result.stats.stashedApps).toBe(1); // New apps start as stashed
      expect(result.stats.totalWorkspaces).toBe(1);
    });

    it("should handle subscriptions", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          let callbackCount = 0;
          let lastState: any = null;

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((state) => {
            callbackCount++;
            lastState = state;
          });

          // Register an app (should trigger callback)
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Wait a bit for callback
          yield* Effect.sleep(10);

          // Cleanup
          unsubscribe();

          return { callbackCount, lastState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.callbackCount).toBeGreaterThan(0);
      expect(result.lastState).toBeTruthy();
      expect(result.lastState.stats.totalApps).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.getChatAppInstance("non-existent-app");
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(testLayer)))
      ).rejects.toThrow("ChatApp not found");
    });

    it("should handle unregister non-existent app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.unregisterChatApp("non-existent-app");
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(testLayer)))
      ).rejects.toThrow("ChatApp not found");
    });
  });

  describe("Debug Operations", () => {
    it("should get all instances for debugging", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register some apps
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-2",
            testChatAppConfig
          );

          // Get debug info
          const instances = yield* manager.debugGetAllInstances();
          return instances;
        }).pipe(Effect.provide(testLayer))
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result["test-app-1"]).toBeTruthy();
      expect(result["test-app-2"]).toBeTruthy();
    });

    it("should reset state", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register some apps
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Verify state has apps
          const beforeReset = yield* manager.getState();
          expect(beforeReset.stats.totalApps).toBe(1);

          // Reset state
          yield* manager.debugResetState();

          // Verify state is empty
          const afterReset = yield* manager.getState();
          return afterReset;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stats.totalApps).toBe(0);
      expect(Object.keys(result.chatAppInstances)).toHaveLength(0);
    });
  });
});
