import { Effect, Layer, Either } from "effect";
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

describe("ChatAppsManager - Capacity Management", () => {
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

  describe("Workspace Capacity Configuration", () => {
    it("should set workspace max expanded apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Set capacity limit
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 3);

          // Get the configured limit
          const maxApps = yield* manager.getWorkspaceMaxExpandedApps(
            "workspace-1"
          );

          return maxApps;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBe(3);
    });

    it("should use default capacity when not explicitly set", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Get capacity for workspace without explicit setting
          const maxApps = yield* manager.getWorkspaceMaxExpandedApps(
            "new-workspace"
          );

          return maxApps;
        }).pipe(Effect.provide(testLayer))
      );

      // Should return default value (from constants)
      expect(result).toBe(2); // DEFAULT_MAX_EXPANDED_APPS from types
    });

    it("should update workspace capacity", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Set initial capacity
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);
          const initialCapacity = yield* manager.getWorkspaceMaxExpandedApps(
            "workspace-1"
          );

          // Update capacity
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 5);
          const updatedCapacity = yield* manager.getWorkspaceMaxExpandedApps(
            "workspace-1"
          );

          return { initialCapacity, updatedCapacity };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialCapacity).toBe(2);
      expect(result.updatedCapacity).toBe(5);
    });

    it("should validate capacity limits", async () => {
      // Test setting invalid capacity (negative)
      const program1 = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.setWorkspaceMaxExpandedApps("workspace-1", -1);
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program1)).rejects.toThrow();

      // Test setting invalid capacity (zero)
      const program2 = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 0);
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program2)).rejects.toThrow();
    });
  });

  describe("Expanded Apps Tracking", () => {
    it("should track expanded apps in workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps in workspace
          for (let i = 1; i <= 5; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Set workspace capacity
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Initially no expanded apps
          const initialExpanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Expand some apps
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");

          const afterExpanding = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Compact one app
          yield* manager.compactChatApp("test-app-1");

          const afterCompacting = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { initialExpanded, afterExpanding, afterCompacting };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialExpanded).toHaveLength(0);
      expect(result.afterExpanding).toHaveLength(2);
      expect(result.afterExpanding.map((app) => app.id)).toContain(
        "test-app-1"
      );
      expect(result.afterExpanding.map((app) => app.id)).toContain(
        "test-app-2"
      );
      expect(result.afterCompacting).toHaveLength(1);
      expect(result.afterCompacting[0].id).toBe("test-app-2");
    });

    it("should return empty array for workspace with no expanded apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "empty-workspace"
          );

          return expandedApps;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toHaveLength(0);
    });

    it("should distinguish between workspaces", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps in workspace-1
          for (let i = 1; i <= 5; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          // Register app in different workspace
          const config = createTestConfig("test-app-6", "App 6");
          yield* manager.registerChatApp("workspace-2", "test-app-6", config);

          // Set workspace capacity
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Expand apps in different workspaces
          yield* manager.expandChatApp("test-app-1"); // workspace-1
          yield* manager.expandChatApp("test-app-6"); // workspace-2

          const workspace1Expanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );
          const workspace2Expanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-2"
          );

          return { workspace1Expanded, workspace2Expanded };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.workspace1Expanded).toHaveLength(1);
      expect(result.workspace1Expanded[0].id).toBe("test-app-1");
      expect(result.workspace2Expanded).toHaveLength(1);
      expect(result.workspace2Expanded[0].id).toBe("test-app-6");
    });
  });

  describe("Capacity Enforcement", () => {
    it("should enforce capacity limits when expanding apps", async () => {
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

          // Set strict capacity limit
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Expand apps up to limit
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");

          const atLimit = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Try to expand beyond limit - should fail or auto-compact others
          const expandResult = yield* Effect.either(
            manager.expandChatApp("test-app-3")
          );

          const afterAttempt = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { atLimit, expandResult, afterAttempt };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.atLimit).toHaveLength(2);

      // Should either fail or enforce limit by compacting others
      if (Either.isRight(result.expandResult)) {
        // If expansion succeeded, should still respect limit
        expect(result.afterAttempt).toHaveLength(2);
        expect(result.afterAttempt.map((app) => app.id)).toContain(
          "test-app-3"
        );
      } else {
        // If expansion failed, should maintain current state
        expect(result.afterAttempt).toHaveLength(2);
      }
    });

    it("should enforce capacity limits manually", async () => {
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

          // First expand apps with a higher capacity limit
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 4);
          yield* manager.setChatAppStatus("test-app-1", "expanded");
          yield* manager.setChatAppStatus("test-app-2", "expanded");
          yield* manager.setChatAppStatus("test-app-3", "expanded");
          yield* manager.setChatAppStatus("test-app-4", "expanded");

          const beforeEnforcement = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Now reduce capacity limit to force enforcement
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Manually enforce capacity limits
          yield* manager.enforceCapacityLimits("workspace-1");

          const afterEnforcement = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { beforeEnforcement, afterEnforcement };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeEnforcement).toHaveLength(4);
      expect(result.afterEnforcement).toHaveLength(2);
    });

    it("should handle capacity enforcement with no expanded apps", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Enforce capacity on workspace with no expanded apps
          yield* manager.enforceCapacityLimits("workspace-1");

          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          expect(expandedApps).toHaveLength(0);
        }).pipe(Effect.provide(testLayer))
      );
    });

    it("should handle capacity enforcement on non-existent workspace", async () => {
      // Should handle gracefully (not throw)
      await expect(
        Effect.runPromise(
          Effect.gen(function* () {
            const manager = yield* ChatAppsManager;
            yield* manager.enforceCapacityLimits("non-existent-workspace");
          }).pipe(Effect.provide(testLayer))
        )
      ).resolves.toBeUndefined();
    });
  });

  describe("Bulk Capacity Operations", () => {
    it("should expand multiple apps with capacity awareness", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register apps in multiple workspaces
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

          // Set different capacities
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);
          yield* manager.setWorkspaceMaxExpandedApps("workspace-2", 1);

          // Try to expand multiple apps in workspace-1 (capacity: 2)
          yield* manager.expandMultipleChatApps([
            "ws1-app-1",
            "ws1-app-2",
            "ws1-app-3",
          ]);

          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return expandedApps;
        }).pipe(Effect.provide(testLayer))
      );

      // Should respect capacity limit
      expect(result).toHaveLength(2);
      expect(result.map((app) => app.id)).toContain("ws1-app-1");
      expect(result.map((app) => app.id)).toContain("ws1-app-2");
    });

    it("should handle mixed workspace apps in bulk operations", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register apps in multiple workspaces
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

          // Set different capacities
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);
          yield* manager.setWorkspaceMaxExpandedApps("workspace-2", 1);

          // Try to expand apps from different workspaces
          yield* manager.expandMultipleChatApps([
            "ws1-app-1",
            "ws2-app-1",
            "ws1-app-2",
            "ws2-app-2",
          ]);

          const workspace1Expanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );
          const workspace2Expanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-2"
          );

          return { workspace1Expanded, workspace2Expanded };
        }).pipe(Effect.provide(testLayer))
      );

      // Each workspace should respect its own capacity
      expect(result.workspace1Expanded).toHaveLength(2); // capacity: 2
      expect(result.workspace2Expanded).toHaveLength(1); // capacity: 1
    });

    it("should handle bulk operations with non-existent apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register apps in multiple workspaces
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

          // Set different capacities
          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);
          yield* manager.setWorkspaceMaxExpandedApps("workspace-2", 1);

          // Include non-existent apps in bulk operation
          const expandResult = yield* Effect.either(
            manager.expandMultipleChatApps([
              "ws1-app-1",
              "non-existent-app",
              "ws1-app-2",
            ])
          );

          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { expandResult, expandedApps };
        }).pipe(Effect.provide(testLayer))
      );

      // Should handle partial success or complete failure gracefully
      if (Either.isRight(result.expandResult)) {
        // If operation succeeded, valid apps should be expanded
        expect(result.expandedApps.length).toBeGreaterThan(0);
      }
      // If operation failed, should maintain consistent state
    });
  });

  describe("Capacity and Focus Mode Integration", () => {
    it("should ignore capacity limits in focus mode", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Enter focus mode
          yield* manager.enterFocusMode("test-app-1");

          const focusedApp = yield* manager.getFocusedApp();
          const expandedApps = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { focusedApp, expandedApps };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.focusedApp?.id).toBe("test-app-1");
      // In focus mode, only the focused app should be visible/expanded
      expect(result.expandedApps).toHaveLength(1);
      expect(result.expandedApps[0].id).toBe("test-app-1");
    });

    it("should restore capacity limits after exiting focus mode", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          for (let i = 1; i <= 3; i++) {
            const config = createTestConfig(`test-app-${i}`, `App ${i}`);
            yield* manager.registerChatApp(
              "workspace-1",
              `test-app-${i}`,
              config
            );
          }

          yield* manager.setWorkspaceMaxExpandedApps("workspace-1", 2);

          // Expand apps before focus mode
          yield* manager.expandChatApp("test-app-1");
          yield* manager.expandChatApp("test-app-2");

          const beforeFocus = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          // Enter and exit focus mode
          yield* manager.enterFocusMode("test-app-1");
          yield* manager.exitFocusMode();

          const afterFocus = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          return { beforeFocus, afterFocus };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeFocus).toHaveLength(2);
      expect(result.afterFocus).toHaveLength(2); // Should restore previous state
    });
  });

  describe("Capacity Statistics", () => {
    it("should provide accurate workspace capacity statistics", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Create complex workspace setup
          for (let ws = 1; ws <= 2; ws++) {
            for (let app = 1; app <= 4; app++) {
              const config = createTestConfig(
                `ws${ws}-app-${app}`,
                `WS${ws} App ${app}`
              );
              yield* manager.registerChatApp(
                `workspace-${ws}`,
                `ws${ws}-app-${app}`,
                config
              );
            }
            yield* manager.setWorkspaceMaxExpandedApps(`workspace-${ws}`, 2);
          }

          // Set various statuses
          yield* manager.expandChatApp("ws1-app-1");
          yield* manager.expandChatApp("ws1-app-2");
          yield* manager.compactChatApp("ws1-app-3");
          yield* manager.expandChatApp("ws2-app-1");
          yield* manager.archiveChatApp("ws2-app-4");

          const ws1Stats = yield* manager.getWorkspaceStats("workspace-1");
          const ws2Stats = yield* manager.getWorkspaceStats("workspace-2");
          const globalStats = yield* manager.getStats();

          return { ws1Stats, ws2Stats, globalStats };
        }).pipe(Effect.provide(testLayer))
      );

      // Workspace 1: 4 apps total, 2 expanded, 1 compact, 1 stashed
      expect(result.ws1Stats.totalApps).toBe(4);
      expect(result.ws1Stats.expandedApps).toBe(2);
      expect(result.ws1Stats.compactApps).toBe(1);

      // Workspace 2: 4 apps total, 1 expanded, 1 archived
      expect(result.ws2Stats.totalApps).toBe(4);
      expect(result.ws2Stats.expandedApps).toBe(1);
      expect(result.ws2Stats.archivedApps).toBe(1);

      // Global stats
      expect(result.globalStats.totalApps).toBe(8);
      expect(result.globalStats.expandedApps).toBe(3);
      expect(result.globalStats.totalWorkspaces).toBe(2);
    });

    it("should track capacity utilization", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Create complex workspace setup
          for (let ws = 1; ws <= 2; ws++) {
            for (let app = 1; app <= 4; app++) {
              const config = createTestConfig(
                `ws${ws}-app-${app}`,
                `WS${ws} App ${app}`
              );
              yield* manager.registerChatApp(
                `workspace-${ws}`,
                `ws${ws}-app-${app}`,
                config
              );
            }
            yield* manager.setWorkspaceMaxExpandedApps(`workspace-${ws}`, 2);
          }

          // Set various statuses
          yield* manager.expandChatApp("ws1-app-1");
          yield* manager.expandChatApp("ws1-app-2");
          yield* manager.compactChatApp("ws1-app-3");
          yield* manager.expandChatApp("ws2-app-1");
          yield* manager.archiveChatApp("ws2-app-4");

          const ws1Capacity = yield* manager.getWorkspaceMaxExpandedApps(
            "workspace-1"
          );
          const ws1Expanded = yield* manager.getExpandedAppsInWorkspace(
            "workspace-1"
          );

          const utilizationRate = ws1Expanded.length / ws1Capacity;

          return {
            capacity: ws1Capacity,
            expanded: ws1Expanded.length,
            utilizationRate,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.capacity).toBe(2);
      expect(result.expanded).toBe(2);
      expect(result.utilizationRate).toBe(1.0); // 100% utilization
    });
  });
});
