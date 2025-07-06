import { Effect, Layer } from "effect";
import { describe, it, expect, beforeEach } from "vitest";
import type { ChatAppConfig } from "@/types/global";
import { ChatAppsManager } from "../service";
import { ChatManager } from "../../chat-manager";
import { AppManager } from "../../app-manager";
import { UrlService } from "../../../services/url";
import { ChatService } from "../../../services/chat";
import { WebSocketService } from "../../../services/websocket";
import { MdxService } from "../../../services/mdx";
import { AgentRegistryService } from "../../../services/agent-registry";
import type { FocusModeConfig } from "../types";

describe("ChatAppsManager - Focus Mode", () => {
  let testLayer: Layer.Layer<any, any, any>;

  const createTestConfig = (id: string, name: string): ChatAppConfig => ({
    id,
    name,
    description: `Test chat application ${name}`,
    icon: "💬",
    agentId: "test-agent",
    settings: {
      enableStreaming: true,
      enableHistory: true,
      maxMessages: 100,
    },
    layout: {
      defaultExpanded: false,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
    },
  });

  beforeEach(() => {
    testLayer = Layer.mergeAll(
      UrlService.Default,
      WebSocketService.Default,
      MdxService.Default,
      ChatService.Default,
      AgentRegistryService.Default,
      ChatManager.Default,
      AppManager.Default,
      ChatAppsManager.Default
    );
  });

  describe("Focus Mode Activation", () => {
    it("should enter focus mode successfully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps
          for (let i = 1; i <= 4; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Expand some apps initially
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");
          yield* manager.compactChatApp("test-app-3");

          const beforeFocus = yield* manager.isFocusModeActive();

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          const afterFocus = yield* manager.isFocusModeActive();
          const focusedApp = yield* manager.getFocusedApp();
          const state = yield* manager.getState();

          return { beforeFocus, afterFocus, focusedApp, state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeFocus).toBe(false);
      expect(result.afterFocus).toBe(true);
      expect(result.focusedApp?.id).toBe("test-app-1");
      expect(result.state.focusMode.isActive).toBe(true);
      expect(result.state.focusMode.focusedAppId).toBe("test-app-1");
    });

    it("should enter focus mode with custom configuration", async () => {
      const focusConfig: FocusModeConfig = {
        hideOtherApps: true,
        dimBackground: true,
        disableNotifications: true,
        lockNavigation: false,
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps
          for (let i = 1; i <= 4; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Enter focus mode with config
          yield* manager.enterFocusMode("test-app-1", focusConfig);

          const state = yield* manager.getState();

          return state.focusMode;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.isActive).toBe(true);
      expect(result.focusedAppId).toBe("test-app-1");
      expect(result.config?.hideOtherApps).toBe(true);
      expect(result.config?.dimBackground).toBe(true);
      expect(result.config?.disableNotifications).toBe(true);
      expect(result.config?.lockNavigation).toBe(false);
    });

    it("should fail to enter focus mode with non-existent app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.enterFocusMode("non-existent-app");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should switch focus between apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps
          for (let i = 1; i <= 4; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Enter focus mode with first app
          yield* manager.enterFocusMode("test-app-1");
          const firstFocus = yield* manager.getFocusedApp();

          // Switch focus to second app
          yield* manager.enterFocusMode("test-app-2");
          const secondFocus = yield* manager.getFocusedApp();

          const state = yield* manager.getState();

          return { firstFocus, secondFocus, state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.firstFocus?.id).toBe("test-app-1");
      expect(result.secondFocus?.id).toBe("test-app-2");
      expect(result.state.focusMode.focusedAppId).toBe("test-app-2");
      expect(result.state.focusMode.isActive).toBe(true);
    });
  });

  describe("Focus Mode Deactivation", () => {
    it("should exit focus mode successfully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Setup test apps
          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Setup initial state
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");
          yield* manager.compactChatApp("test-app-3");

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          const beforeExit = yield* manager.isFocusModeActive();
          const focusedBeforeExit = yield* manager.getFocusedApp();

          // Exit focus mode
          yield* manager.exitFocusMode();

          const afterExit = yield* manager.isFocusModeActive();
          const focusedAfterExit = yield* manager.getFocusedApp();
          const state = yield* manager.getState();

          return {
            beforeExit,
            focusedBeforeExit,
            afterExit,
            focusedAfterExit,
            state,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeExit).toBe(true);
      expect(result.focusedBeforeExit?.id).toBe("test-app-1");
      expect(result.afterExit).toBe(false);
      expect(result.focusedAfterExit).toBeNull();
      expect(result.state.focusMode.isActive).toBe(false);
      expect(result.state.focusMode.focusedAppId).toBeNull();
    });

    it("should restore previous app states after exiting focus mode", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Setup test apps
          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Setup initial state
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");
          yield* manager.compactChatApp("test-app-3");

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          // Exit focus mode
          yield* manager.exitFocusMode();

          // Check app states
          const app1 = yield* manager.getChatAppInstance("test-app-1");
          const app2 = yield* manager.getChatAppInstance("test-app-2");
          const app3 = yield* manager.getChatAppInstance("test-app-3");

          return { app1, app2, app3 };
        }).pipe(Effect.provide(testLayer))
      );

      // Apps should return to their previous states
      expect(result.app1.status).toBe("expanded");
      expect(result.app2.status).toBe("expanded");
      expect(result.app3.status).toBe("compact");
    });

    it("should handle exiting focus mode when not active", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Exit focus mode first
          yield* manager.exitFocusMode();

          // Try to exit again - should not throw
          yield* manager.exitFocusMode();

          const isActive = yield* manager.isFocusModeActive();
          expect(isActive).toBe(false);
        }).pipe(Effect.provide(testLayer))
      );
    });
  });

  describe("Focus Mode Enforcement", () => {
    it("should hide other apps when focus mode is active", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Setup multiple apps in different workspaces
          for (let i = 1; i <= 3; i++) {
            const config1 = createTestConfig(`ws1-app-${i}`, `WS1 App ${i}`);
            const config2 = createTestConfig(`ws2-app-${i}`, `WS2 App ${i}`);

            yield* manager.registerChatApp(
              "workspace-1",
              `ws1-app-${i}`,
              config1
            );
            yield* manager.registerChatApp(
              "workspace-2",
              `ws2-app-${i}`,
              config2
            );
          }

          // Expand apps in both workspaces
          yield* manager.expandChatApp("ws1-app-1");
          yield* manager.expandChatApp("ws1-app-2");
          yield* manager.expandChatApp("ws2-app-1");

          const beforeFocus = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Enter focus mode with hide other apps
          yield* manager.enterFocusMode("ws1-app-1", { hideOtherApps: true });

          const duringFocus = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );
          const allApps = yield* manager.getAllChatApps();

          return { beforeFocus, duringFocus, allApps };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeFocus).toHaveLength(2);
      expect(result.duringFocus).toHaveLength(1);
      expect(result.duringFocus[0].id).toBe("ws1-app-1");

      // Other apps should still exist but be hidden/stashed
      expect(result.allApps).toHaveLength(6); // All apps still exist
    });

    it("should prevent expanding other apps in focus mode", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Setup multiple apps in different workspaces
          for (let i = 1; i <= 3; i++) {
            const config1 = createTestConfig(`ws1-app-${i}`, `WS1 App ${i}`);
            const config2 = createTestConfig(`ws2-app-${i}`, `WS2 App ${i}`);

            yield* manager.registerChatApp(
              "workspace-1",
              `ws1-app-${i}`,
              config1
            );
            yield* manager.registerChatApp(
              "workspace-2",
              `ws2-app-${i}`,
              config2
            );
          }

          // Expand apps in both workspaces
          yield* manager.expandChatApp("ws1-app-1");
          yield* manager.expandChatApp("ws1-app-2");
          yield* manager.expandChatApp("ws2-app-1");

          // Enter focus mode
          yield* manager.enterFocusMode("ws1-app-1");

          // Try to expand another app - should fail or be ignored
          const expandResult = yield* Effect.either(
            manager.expandChatApp("ws1-app-2")
          );

          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );
          const focusedApp = yield* manager.getFocusedApp();

          return { expandResult, expandedApps, focusedApp };
        }).pipe(Effect.provide(testLayer))
      );

      // Should maintain focus on original app
      expect(result.focusedApp?.id).toBe("ws1-app-1");

      // Should either fail expansion or ignore it
      if (result.expandResult._tag === "Right") {
        // If expansion was allowed, should still maintain focus
        expect(result.expandedApps.length).toBeLessThanOrEqual(1);
      } else {
        // If expansion was blocked, only focused app should be expanded
        expect(result.expandedApps).toHaveLength(1);
        expect(result.expandedApps[0].id).toBe("ws1-app-1");
      }
    });

    it("should allow operations on the focused app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Setup multiple apps in different workspaces
          for (let i = 1; i <= 3; i++) {
            const config1 = createTestConfig(`ws1-app-${i}`, `WS1 App ${i}`);
            const config2 = createTestConfig(`ws2-app-${i}`, `WS2 App ${i}`);

            yield* manager.registerChatApp(
              "workspace-1",
              `ws1-app-${i}`,
              config1
            );
            yield* manager.registerChatApp(
              "workspace-2",
              `ws2-app-${i}`,
              config2
            );
          }

          // Expand apps in both workspaces
          yield* manager.expandChatApp("ws1-app-1");
          yield* manager.expandChatApp("ws1-app-2");
          yield* manager.expandChatApp("ws2-app-1");

          // Enter focus mode
          yield* manager.enterFocusMode("ws1-app-1");

          // Should be able to operate on focused app
          yield* manager.compactChatApp("ws1-app-1");
          const afterCompact = yield* manager.getChatAppInstance("ws1-app-1");

          yield* manager.expandChatApp("ws1-app-1");
          const afterExpand = yield* manager.getChatAppInstance("ws1-app-1");

          return { afterCompact, afterExpand };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.afterCompact.status).toBe("compact");
      expect(result.afterExpand.status).toBe("expanded");
    });
  });

  describe("Focus Mode State Management", () => {
    it("should notify subscribers of focus mode changes", async () => {
      const stateUpdates: any[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test apps
          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((state) => {
            stateUpdates.push({
              focusMode: state.focusMode,
              timestamp: Date.now(),
            });
          });

          // Perform focus mode operations
          yield* manager.enterFocusMode("test-app-1");
          yield* Effect.sleep("50 millis");

          yield* manager.enterFocusMode("test-app-2");
          yield* Effect.sleep("50 millis");

          yield* manager.exitFocusMode();
          yield* Effect.sleep("50 millis");

          // Cleanup
          yield* unsubscribe();
        }).pipe(Effect.provide(testLayer))
      );

      expect(stateUpdates.length).toBeGreaterThan(0);

      // Should have captured focus mode state changes
      const focusModeStates = stateUpdates.map((update) => update.focusMode);
      const activeStates = focusModeStates.filter((fm) => fm.isActive);
      const inactiveStates = focusModeStates.filter((fm) => !fm.isActive);

      expect(activeStates.length).toBeGreaterThan(0);
      expect(inactiveStates.length).toBeGreaterThan(0);
    });

    it("should maintain focus mode state consistency", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test apps
          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          // Get state multiple times - should be consistent
          const state1 = yield* manager.getState();
          const state2 = yield* manager.getState();
          const focusedApp = yield* manager.getFocusedApp();
          const isActive = yield* manager.isFocusModeActive();

          return { state1, state2, focusedApp, isActive };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state1.focusMode.isActive).toBe(true);
      expect(result.state2.focusMode.isActive).toBe(true);
      expect(result.state1.focusMode.focusedAppId).toBe("test-app-1");
      expect(result.state2.focusMode.focusedAppId).toBe("test-app-1");
      expect(result.focusedApp?.id).toBe("test-app-1");
      expect(result.isActive).toBe(true);
    });

    it("should handle focus mode with app unregistration", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test apps
          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          const beforeUnregister = yield* manager.isFocusModeActive();

          // Unregister the focused app
          yield* manager.unregisterChatApp("test-app-1");

          const afterUnregister = yield* manager.isFocusModeActive();
          const focusedApp = yield* manager.getFocusedApp();

          return { beforeUnregister, afterUnregister, focusedApp };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeUnregister).toBe(true);
      // Focus mode should be deactivated when focused app is unregistered
      expect(result.afterUnregister).toBe(false);
      expect(result.focusedApp).toBeNull();
    });
  });
});
