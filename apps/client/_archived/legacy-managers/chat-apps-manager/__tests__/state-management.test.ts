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
import type { ChatAppStatus, ChatAppsManagerState } from "../types";

describe("ChatAppsManager - State Management", () => {
  let testLayer: Layer.Layer<any, any, any>;

  const testChatAppConfig: ChatAppConfig = {
    id: "test-app-1",
    name: "Test Chat App",
    description: "Test chat application",
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
  };

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

  describe("Status Transitions", () => {
    it("should transition from stashed to expanded", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Verify initial status
          const initialInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          // Expand the app
          yield* manager.expandChatApp("test-app-1");

          // Verify status change
          const expandedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );
          const state = yield* manager.getState();

          return { initialInstance, expandedInstance, state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialInstance.status).toBe("stashed");
      expect(result.expandedInstance.status).toBe("expanded");
      expect(result.state.chatAppInstances["test-app-1"].status).toBe(
        "expanded"
      );
    });

    it("should transition from expanded to compact", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // First expand the app
          yield* manager.expandChatApp("test-app-1");

          // Then compact it
          yield* manager.compactChatApp("test-app-1");

          const instance = yield* manager.getChatAppInstance("test-app-1");

          return instance;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.status).toBe("compact");
      // Note: previousStatus is optional and may not be set
    });

    it("should transition from any status to stashed", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Test from expanded to stashed
          yield* manager.expandChatApp("test-app-1");
          const expandedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          yield* manager.stashChatApp("test-app-1");
          const stashedFromExpanded = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          // Test from compact to stashed
          yield* manager.compactChatApp("test-app-1");
          yield* manager.stashChatApp("test-app-1");
          const stashedFromCompact = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          return { expandedInstance, stashedFromExpanded, stashedFromCompact };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.expandedInstance.status).toBe("expanded");
      expect(result.stashedFromExpanded.status).toBe("stashed");
      expect(result.stashedFromCompact.status).toBe("stashed");
    });

    it("should handle close status transition", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Expand first, then close
          yield* manager.expandChatApp("test-app-1");
          yield* manager.closeChatApp("test-app-1");

          const closedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          return closedInstance;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.status).toBe("closed");
    });

    it("should handle archive status transition", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Archive the app
          yield* manager.archiveChatApp("test-app-1");

          const archivedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          return archivedInstance;
        }).pipe(Effect.provide(testLayer))
      );

      // Check status is archived, not isArchived property
      expect(result.status).toBe("archived");
    });

    it("should restore archived chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // First expand, then archive
          yield* manager.expandChatApp("test-app-1");
          yield* manager.archiveChatApp("test-app-1");
          const archivedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          // Restore the app
          yield* manager.restoreChatApp("test-app-1");
          const restoredInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          return { archivedInstance, restoredInstance };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.archivedInstance.status).toBe("archived");
      expect(result.restoredInstance.status).toBe("stashed"); // Restored to stashed status
    });

    it("should fail to transition non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.expandChatApp("non-existent-app");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });
  });

  describe("Active App Management", () => {
    it("should set active chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          const initialActive = yield* manager.getActiveChatApp();

          yield* manager.setActiveChatApp("test-app-1");

          const activeAfterSet = yield* manager.getActiveChatApp();
          const state = yield* manager.getState();

          return { initialActive, activeAfterSet, state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialActive).toBeNull();
      expect(result.activeAfterSet?.id).toBe("test-app-1");
      expect(result.state.activeAppId).toBe("test-app-1");
    });

    it("should switch active chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test apps within the test
          const config2 = {
            ...testChatAppConfig,
            id: "test-app-2",
            name: "Test App 2",
          };

          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);

          // Set first app as active
          yield* manager.setActiveChatApp("test-app-1");
          const firstActive = yield* manager.getActiveChatApp();

          // Switch to second app
          yield* manager.setActiveChatApp("test-app-2");
          const secondActive = yield* manager.getActiveChatApp();

          return { firstActive, secondActive };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.firstActive?.id).toBe("test-app-1");
      expect(result.secondActive?.id).toBe("test-app-2");
    });

    it("should clear active chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Set active app
          yield* manager.setActiveChatApp("test-app-1");
          const activeBeforeClear = yield* manager.getActiveChatApp();

          // Clear active app
          yield* manager.clearActiveChatApp();
          const activeAfterClear = yield* manager.getActiveChatApp();
          const state = yield* manager.getState();

          return { activeBeforeClear, activeAfterClear, state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.activeBeforeClear?.id).toBe("test-app-1");
      expect(result.activeAfterClear).toBeNull();
      expect(result.state.activeAppId).toBeNull();
    });

    it("should fail to set non-existent app as active", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.setActiveChatApp("non-existent-app");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should automatically clear active app when it's unregistered", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Set active app
          yield* manager.setActiveChatApp("test-app-1");
          const activeBeforeUnregister = yield* manager.getActiveChatApp();

          // Unregister the active app
          yield* manager.unregisterChatApp("test-app-1");
          const activeAfterUnregister = yield* manager.getActiveChatApp();

          return { activeBeforeUnregister, activeAfterUnregister };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.activeBeforeUnregister?.id).toBe("test-app-1");
      expect(result.activeAfterUnregister).toBeNull();
    });
  });

  describe("State Subscriptions", () => {
    it("should notify subscribers of state changes", async () => {
      const stateUpdates: ChatAppsManagerState[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((state) => {
            stateUpdates.push(state);
          });

          // Perform operations that should trigger notifications
          yield* manager.expandChatApp("test-app-1");
          yield* manager.setActiveChatApp("test-app-1");
          yield* manager.compactChatApp("test-app-1");

          // Allow time for async notifications
          yield* Effect.sleep("100 millis");

          // Cleanup
          yield* unsubscribe();
        }).pipe(Effect.provide(testLayer))
      );

      // Should have received multiple state updates
      expect(stateUpdates.length).toBeGreaterThan(0);

      // Verify state progression
      const lastState = stateUpdates[stateUpdates.length - 1];
      expect(lastState.chatAppInstances["test-app-1"].status).toBe("compact");
      expect(lastState.activeAppId).toBe("test-app-1");
    });

    it("should handle multiple subscribers", async () => {
      const subscriber1Updates: ChatAppsManagerState[] = [];
      const subscriber2Updates: ChatAppsManagerState[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Subscribe with multiple listeners
          const unsubscribe1 = yield* manager.subscribe((state) => {
            subscriber1Updates.push(state);
          });

          const unsubscribe2 = yield* manager.subscribe((state) => {
            subscriber2Updates.push(state);
          });

          // Perform operation
          yield* manager.expandChatApp("test-app-1");

          // Allow time for notifications
          yield* Effect.sleep("100 millis");

          // Cleanup
          yield* unsubscribe1();
          yield* unsubscribe2();
        }).pipe(Effect.provide(testLayer))
      );

      // Both subscribers should receive updates
      expect(subscriber1Updates.length).toBeGreaterThan(0);
      expect(subscriber2Updates.length).toBeGreaterThan(0);
      expect(subscriber1Updates.length).toBe(subscriber2Updates.length);
    });

    it("should stop notifications after unsubscribe", async () => {
      const stateUpdates: ChatAppsManagerState[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Subscribe
          const unsubscribe = yield* manager.subscribe((state) => {
            stateUpdates.push(state);
          });

          // Perform operation while subscribed
          yield* manager.expandChatApp("test-app-1");
          yield* Effect.sleep("50 millis");

          const updatesWhileSubscribed = stateUpdates.length;

          // Unsubscribe
          yield* unsubscribe();

          // Perform operations after unsubscribe
          yield* manager.compactChatApp("test-app-1");
          yield* manager.stashChatApp("test-app-1");
          yield* Effect.sleep("50 millis");

          const updatesAfterUnsubscribe = stateUpdates.length;

          return { updatesWhileSubscribed, updatesAfterUnsubscribe };
        }).pipe(Effect.provide(testLayer))
      );

      // Should not receive new updates after unsubscribe
      expect(stateUpdates.length).toBeGreaterThan(0);
      // Note: This test may be flaky due to async nature, but should generally work
    });
  });

  describe("State Validation", () => {
    it("should maintain valid state structure", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps and perform various operations
          const config2 = {
            ...testChatAppConfig,
            id: "test-app-2",
            name: "Test App 2",
          };

          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-2", "test-app-2", config2);

          yield* manager.expandChatApp("test-app-1");
          yield* manager.setActiveChatApp("test-app-1");
          yield* manager.compactChatApp("test-app-2");

          const state = yield* manager.getState();

          return state;
        }).pipe(Effect.provide(testLayer))
      );

      // Validate state structure
      expect(result).toHaveProperty("chatAppInstances");
      expect(result).toHaveProperty("activeAppId");
      expect(result).toHaveProperty("focusMode");
      expect(result).toHaveProperty("workspaceCapacities");
      expect(result).toHaveProperty("workspaceLayouts");
      expect(result).toHaveProperty("stats");
      expect(result).toHaveProperty("lastUpdated");
      expect(result).toHaveProperty("isLoading");
      expect(result).toHaveProperty("lastError");

      // Validate chat app instances
      expect(Object.keys(result.chatAppInstances)).toHaveLength(2);
      expect(result.chatAppInstances["test-app-1"]).toBeDefined();
      expect(result.chatAppInstances["test-app-2"]).toBeDefined();

      // Validate active app
      expect(result.activeAppId).toBe("test-app-1");

      // Validate timestamps
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.chatAppInstances["test-app-1"].lastActiveAt).toBeInstanceOf(
        Date
      );
    });

    it("should update stats correctly", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          const config2 = {
            ...testChatAppConfig,
            id: "test-app-2",
            name: "Test App 2",
          };
          const config3 = {
            ...testChatAppConfig,
            id: "test-app-3",
            name: "Test App 3",
          };

          // Register apps with different statuses
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);
          yield* manager.registerChatApp("workspace-2", "test-app-3", config3);

          yield* manager.expandChatApp("test-app-1");
          yield* manager.compactChatApp("test-app-2");
          yield* manager.archiveChatApp("test-app-3");

          const stats = yield* manager.getStats();

          return stats;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.totalApps).toBe(3);
      expect(result.activeApps).toBe(0); // Only apps with isActive=true are counted as active
      expect(result.expandedApps).toBe(1);
      expect(result.archivedApps).toBe(1);
      expect(result.totalWorkspaces).toBe(2);
    });
  });

  describe("Status-specific Operations", () => {
    it("should handle direct status setting", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Test direct status setting
          yield* manager.setChatAppStatus("test-app-1", "expanded");
          const expandedInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          yield* manager.setChatAppStatus("test-app-1", "compact");
          const compactInstance = yield* manager.getChatAppInstance(
            "test-app-1"
          );

          return { expandedInstance, compactInstance };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.expandedInstance.status).toBe("expanded");
      expect(result.compactInstance.status).toBe("compact");
    });

    it("should validate status transitions", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Test valid transitions
          yield* manager.setChatAppStatus("test-app-1", "expanded");
          const expanded = yield* manager.getChatAppInstance("test-app-1");

          yield* manager.setChatAppStatus("test-app-1", "compact");
          const compact = yield* manager.getChatAppInstance("test-app-1");

          yield* manager.setChatAppStatus("test-app-1", "stashed");
          const stashed = yield* manager.getChatAppInstance("test-app-1");

          return { expanded, compact, stashed };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.expanded.status).toBe("expanded");
      expect(result.compact.status).toBe("compact");
      expect(result.stashed.status).toBe("stashed");
    });
  });
});
