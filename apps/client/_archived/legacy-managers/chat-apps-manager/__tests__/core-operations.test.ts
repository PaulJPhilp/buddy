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

describe("ChatAppsManager - Core Operations", () => {
  let testLayer: Layer.Layer<any, any, any>;

  // Test configuration
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
    // Create real service layer for integration testing
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

  describe("Chat App Registration", () => {
    it("should register a new chat app successfully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the chat app
          const instance = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Verify the instance was created correctly
          expect(instance.id).toBe("test-app-1");
          expect(instance.workspaceId).toBe("workspace-1");
          expect(instance.config).toEqual(testChatAppConfig);
          expect(instance.status).toBe("stashed"); // Default status
          expect(instance.status).not.toBe("archived"); // Not archived by default

          return instance;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toBeDefined();
    });

    it("should fail to register chat app with duplicate ID", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;

        // Register first app
        yield* manager.registerChatApp(
          "workspace-1",
          "test-app-1",
          testChatAppConfig
        );

        // Try to register with same ID - should fail
        yield* manager.registerChatApp(
          "workspace-1",
          "test-app-1",
          testChatAppConfig
        );
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should register multiple chat apps in same workspace", async () => {
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

          // Register multiple apps
          const instance1 = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          const instance2 = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-2",
            config2
          );
          const instance3 = yield* manager.registerChatApp(
            "workspace-1",
            "test-app-3",
            config3
          );

          // Verify all apps in workspace
          const appsInWorkspace = yield* manager.getChatAppsInWorkspace(
            "workspace-1"
          );

          return { instance1, instance2, instance3, appsInWorkspace };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.appsInWorkspace).toHaveLength(3);
      expect(result.appsInWorkspace.map((app) => app.id)).toContain(
        "test-app-1"
      );
      expect(result.appsInWorkspace.map((app) => app.id)).toContain(
        "test-app-2"
      );
      expect(result.appsInWorkspace.map((app) => app.id)).toContain(
        "test-app-3"
      );
    });

    it("should register chat apps in different workspaces", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          const config2 = {
            ...testChatAppConfig,
            id: "test-app-2",
            name: "Test App 2",
          };

          // Register apps in different workspaces
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-2", "test-app-2", config2);

          const workspace1Apps = yield* manager.getChatAppsInWorkspace(
            "workspace-1"
          );
          const workspace2Apps = yield* manager.getChatAppsInWorkspace(
            "workspace-2"
          );
          const allApps = yield* manager.getAllChatApps();

          return { workspace1Apps, workspace2Apps, allApps };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.workspace1Apps).toHaveLength(1);
      expect(result.workspace2Apps).toHaveLength(1);
      expect(result.allApps).toHaveLength(2);
      expect(result.workspace1Apps[0].id).toBe("test-app-1");
      expect(result.workspace2Apps[0].id).toBe("test-app-2");
    });
  });

  describe("Chat App Retrieval", () => {
    it("should get chat app instance by ID", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app within the test
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          const instance = yield* manager.getChatAppInstance("test-app-1");
          return instance;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.id).toBe("test-app-1");
      expect(result.config.name).toBe("Test Chat App");
    });

    it("should fail to get non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.getChatAppInstance("non-existent-app");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should get all chat apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test data within the test
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

          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);
          yield* manager.registerChatApp("workspace-2", "test-app-3", config3);

          const allApps = yield* manager.getAllChatApps();
          return allApps;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toHaveLength(3);
      const appIds = result.map((app) => app.id);
      expect(appIds).toContain("test-app-1");
      expect(appIds).toContain("test-app-2");
      expect(appIds).toContain("test-app-3");
    });

    it("should get chat apps in specific workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test data within the test
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

          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);
          yield* manager.registerChatApp("workspace-2", "test-app-3", config3);

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

      const ws1Ids = result.workspace1Apps.map((app) => app.id);
      expect(ws1Ids).toContain("test-app-1");
      expect(ws1Ids).toContain("test-app-2");

      expect(result.workspace2Apps[0].id).toBe("test-app-3");
    });

    it("should return empty array for workspace with no apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;
          const emptyWorkspaceApps = yield* manager.getChatAppsInWorkspace(
            "empty-workspace"
          );
          return emptyWorkspaceApps;
        }).pipe(Effect.provide(testLayer))
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("Chat App Unregistration", () => {
    it("should unregister chat app successfully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test data within the test
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

          // Verify app exists before unregistration
          const beforeUnregister = yield* manager.getAllChatApps();

          // Unregister the app
          yield* manager.unregisterChatApp("test-app-1");

          // Verify app is removed
          const afterUnregister = yield* manager.getAllChatApps();

          return { beforeUnregister, afterUnregister };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.beforeUnregister).toHaveLength(2);
      expect(result.afterUnregister).toHaveLength(1);
      expect(result.afterUnregister[0].id).toBe("test-app-2");
    });

    it("should fail to unregister non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatAppsManager;
        yield* manager.unregisterChatApp("non-existent-app");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should handle unregistering active chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register test data within the test
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

          // Set app as active
          yield* manager.setActiveChatApp("test-app-1");
          const activeBefore = yield* manager.getActiveChatApp();

          // Unregister the active app
          yield* manager.unregisterChatApp("test-app-1");

          // Verify active app is cleared
          const activeAfter = yield* manager.getActiveChatApp();

          return { activeBefore, activeAfter };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.activeBefore?.id).toBe("test-app-1");
      expect(result.activeAfter).toBeNull();
    });

    it("should clean up chat instances when unregistering", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register the app first
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          // Unregister should clean up chat instance
          yield* manager.unregisterChatApp("test-app-1");

          // Verify app is completely removed
          const allApps = yield* manager.getAllChatApps();
          expect(allApps.map((app) => app.id)).not.toContain("test-app-1");
        }).pipe(Effect.provide(testLayer))
      );
    });
  });

  describe("State Management Integration", () => {
    it("should update manager state when registering apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          const initialState = yield* manager.getState();

          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );

          const updatedState = yield* manager.getState();

          return { initialState, updatedState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(Object.keys(result.initialState.chatAppInstances)).toHaveLength(0);
      expect(Object.keys(result.updatedState.chatAppInstances)).toHaveLength(1);
      expect(result.updatedState.chatAppInstances["test-app-1"]).toBeDefined();
    });

    it("should maintain consistent state across operations", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatAppsManager;

          // Register multiple apps
          yield* manager.registerChatApp(
            "workspace-1",
            "test-app-1",
            testChatAppConfig
          );
          const config2 = {
            ...testChatAppConfig,
            id: "test-app-2",
            name: "Test App 2",
          };
          yield* manager.registerChatApp("workspace-1", "test-app-2", config2);

          // Check state consistency
          const state = yield* manager.getState();
          const allApps = yield* manager.getAllChatApps();
          const workspaceApps = yield* manager.getChatAppsInWorkspace(
            "workspace-1"
          );

          return { state, allApps, workspaceApps };
        }).pipe(Effect.provide(testLayer))
      );

      // State should be consistent across different access methods
      expect(Object.keys(result.state.chatAppInstances)).toHaveLength(2);
      expect(result.allApps).toHaveLength(2);
      expect(result.workspaceApps).toHaveLength(2);

      // Verify all methods return the same apps
      const stateAppIds = Object.keys(result.state.chatAppInstances);
      const allAppIds = result.allApps.map((app) => app.id);
      const workspaceAppIds = result.workspaceApps.map((app) => app.id);

      expect(stateAppIds.sort()).toEqual(allAppIds.sort());
      expect(stateAppIds.sort()).toEqual(workspaceAppIds.sort());
    });
  });
});
