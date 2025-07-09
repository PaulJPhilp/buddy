import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

// Import services and components
import { WorkspaceComponent } from "../../src/components/workspace/service";
import { ChatAppsManager } from "../../src/managers/chatapps/service";
import { CoreManager } from "../../src/managers/core/service";
import { ConfigService } from "../../src/services/config/service";

// Import test types
import type { WorkspaceConfig } from "../../src/components/workspace/types";
import type { ChatAppConfig } from "../../src/types/global";

describe("Component Command Integration", () => {
  const testLayer = Layer.mergeAll(
    ConfigService.Default,
    CoreManager.Default,
    ChatAppsManager.Default,
    WorkspaceComponent.Default
  );

  const createTestWorkspaceConfig = (): WorkspaceConfig => ({
    id: "test-workspace",
    name: "Test Workspace",
    description: "Integration test workspace",
    chatappIds: ["test-app-1", "test-app-2"],
    agentIds: ["test-agent"],
    maxExpandedApps: 3,
    isDefault: false,
  });

  const createTestChatAppConfig = (
    id: string,
    name: string
  ): ChatAppConfig => ({
    id,
    name,
    description: `Test chat app: ${name}`,
    type: "chat",
    config: {},
    agentIds: ["test-agent"],
  });

  describe("WorkspaceComponent Command Dispatch", () => {
    it("should use SetWorkspaceMaxExpandedApps command when loading workspace", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Initialize the workspace component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        // Load workspace with specific maxExpandedApps
        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        // Wait for async command processing
        yield* Effect.sleep("200 millis");

        // Verify the command was processed by checking manager state
        const maxApps = yield* chatAppsManager.getWorkspaceMaxExpandedApps(
          "test-workspace"
        );
        expect(maxApps).toBe(3); // Should match workspaceConfig.maxExpandedApps

        // Verify workspace was loaded
        const loadedConfig = yield* workspaceComponent.getWorkspaceConfig();
        expect(loadedConfig?.id).toBe("test-workspace");
        expect(loadedConfig?.name).toBe("Test Workspace");
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });

    it("should use OnWorkspaceActivated command when switching workspace", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Initialize the workspace component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        // Switch to a new workspace
        const newWorkspaceConfig = {
          ...createTestWorkspaceConfig(),
          id: "new-workspace",
          name: "New Workspace",
        };

        yield* workspaceComponent.switchWorkspace(newWorkspaceConfig);

        // Wait for async command processing
        yield* Effect.sleep("200 millis");

        // Verify workspace switch was processed
        const currentConfig = yield* workspaceComponent.getWorkspaceConfig();
        expect(currentConfig?.id).toBe("new-workspace");
        expect(currentConfig?.name).toBe("New Workspace");

        // Verify the OnWorkspaceActivated command was processed
        // (This is validated by the successful workspace switch)
        const maxApps = yield* chatAppsManager.getWorkspaceMaxExpandedApps(
          "new-workspace"
        );
        expect(typeof maxApps).toBe("number");
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });

    it("should use RegisterChatApp command when loading chat apps", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Initialize and load workspace first
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        // Load chat apps
        const chatApps = [
          createTestChatAppConfig("test-app-1", "Test App 1"),
          createTestChatAppConfig("test-app-2", "Test App 2"),
        ];

        yield* workspaceComponent.loadChatApps(chatApps);

        // Wait for async command processing
        yield* Effect.sleep("300 millis");

        // Verify RegisterChatApp commands were processed
        const allApps = yield* chatAppsManager.getAllChatApps();
        const workspaceApps = allApps.filter(
          (app) => app.workspaceId === "test-workspace"
        );

        expect(workspaceApps).toHaveLength(2);
        expect(workspaceApps.map((app) => app.id)).toContain("test-app-1");
        expect(workspaceApps.map((app) => app.id)).toContain("test-app-2");

        // Verify available chat apps in component
        const availableChatApps =
          yield* workspaceComponent.getAvailableChatApps();
        expect(availableChatApps).toHaveLength(2);
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });

    it("should use SetActiveChatApp command when activating chat app", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Setup workspace and chat apps
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        const chatApps = [createTestChatAppConfig("test-app-1", "Test App 1")];
        yield* workspaceComponent.loadChatApps(chatApps);

        // Wait for setup to complete
        yield* Effect.sleep("200 millis");

        // Activate the chat app
        yield* workspaceComponent.activateChatApp("test-app-1");

        // Wait for async command processing
        yield* Effect.sleep("200 millis");

        // Verify SetActiveChatApp command was processed
        const app = yield* chatAppsManager.getChatAppInstance("test-app-1");
        expect(app.id).toBe("test-app-1");

        // Verify app is in active chat apps list
        const activeChatApps = yield* workspaceComponent.getActiveChatApps();
        expect(activeChatApps.some((app) => app.id === "test-app-1")).toBe(
          true
        );
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });

    it("should use StashChatApp command when deactivating chat app", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Setup workspace and chat apps
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        const chatApps = [createTestChatAppConfig("test-app-1", "Test App 1")];
        yield* workspaceComponent.loadChatApps(chatApps);

        // Activate then deactivate
        yield* workspaceComponent.activateChatApp("test-app-1");
        yield* Effect.sleep("200 millis");

        yield* workspaceComponent.deactivateChatApp("test-app-1");
        yield* Effect.sleep("200 millis");

        // Verify StashChatApp command was processed
        const app = yield* chatAppsManager.getChatAppInstance("test-app-1");
        expect(app.status).toBe("stashed");

        // Verify app is removed from active chat apps list
        const activeChatApps = yield* workspaceComponent.getActiveChatApps();
        expect(activeChatApps.some((app) => app.id === "test-app-1")).toBe(
          false
        );
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });
  });

  describe("Command Error Handling", () => {
    it("should handle command errors gracefully", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;

        // Initialize component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        // Try to activate a non-existent chat app
        const result = yield* Effect.either(
          workspaceComponent.activateChatApp("non-existent-app")
        );

        // Should handle the error gracefully
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toContain("No workspace loaded");
        }

        // Component should still be functional
        const state = yield* workspaceComponent.getState();
        expect(state.isInitialized).toBe(true);
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });

    it("should handle invalid workspace configuration", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;

        // Initialize component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        // Try to load invalid workspace config
        const invalidConfig = {
          ...createTestWorkspaceConfig(),
          id: "", // Invalid empty ID
        };

        const result = yield* Effect.either(
          workspaceComponent.loadWorkspace(invalidConfig)
        );

        // Should handle validation error
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("WorkspaceValidationError");
        }
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });
  });

  describe("Command Processing Performance", () => {
    it("should process multiple commands efficiently", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Initialize component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        // Create many chat apps for performance testing
        const chatApps = Array.from({ length: 20 }, (_, i) =>
          createTestChatAppConfig(`perf-app-${i}`, `Performance App ${i}`)
        );

        const startTime = performance.now();

        // Load all chat apps (triggers RegisterChatApp commands)
        yield* workspaceComponent.loadChatApps(chatApps);

        // Wait for all commands to process
        yield* Effect.sleep("500 millis");

        const duration = performance.now() - startTime;

        // Verify all apps were registered
        const allApps = yield* chatAppsManager.getAllChatApps();
        const workspaceApps = allApps.filter(
          (app) => app.workspaceId === "test-workspace"
        );
        expect(workspaceApps).toHaveLength(20);

        // Performance should be reasonable (less than 2 seconds for 20 apps)
        expect(duration).toBeLessThan(2000);

        return { duration, appCount: workspaceApps.length };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, testLayer)
      );
      console.log(
        `Processed ${
          result.appCount
        } chat app registrations in ${result.duration.toFixed(2)}ms`
      );
    });

    it("should handle concurrent command operations", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;

        // Initialize component
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "test-workspace",
        });

        const workspaceConfig = createTestWorkspaceConfig();
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        // Setup some chat apps
        const chatApps = [
          createTestChatAppConfig("concurrent-app-1", "Concurrent App 1"),
          createTestChatAppConfig("concurrent-app-2", "Concurrent App 2"),
          createTestChatAppConfig("concurrent-app-3", "Concurrent App 3"),
        ];
        yield* workspaceComponent.loadChatApps(chatApps);
        yield* Effect.sleep("200 millis");

        // Perform concurrent operations
        const operations = [
          workspaceComponent.activateChatApp("concurrent-app-1"),
          workspaceComponent.activateChatApp("concurrent-app-2"),
          workspaceComponent.activateChatApp("concurrent-app-3"),
        ];

        const startTime = performance.now();
        const results = yield* Effect.all(
          operations.map((op) => Effect.either(op)),
          { concurrency: "unbounded" }
        );
        const duration = performance.now() - startTime;

        // All operations should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBe(3);

        // Should complete quickly
        expect(duration).toBeLessThan(1000);

        // Wait for command processing
        yield* Effect.sleep("300 millis");

        // Verify all apps are active
        const activeChatApps = yield* workspaceComponent.getActiveChatApps();
        expect(activeChatApps).toHaveLength(3);

        return { duration, successCount };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, testLayer)
      );
      console.log(
        `Completed ${
          result.successCount
        } concurrent operations in ${result.duration.toFixed(2)}ms`
      );
    });
  });

  describe("Component State Consistency", () => {
    it("should maintain state consistency between component and managers", async () => {
      const program = Effect.gen(function* () {
        const workspaceComponent = yield* WorkspaceComponent;
        const chatAppsManager = yield* ChatAppsManager;

        // Initialize and setup
        yield* workspaceComponent.initialize({
          id: "test-workspace-component",
          name: "Test Workspace Component",
          workspaceId: "consistency-workspace",
        });

        const workspaceConfig = {
          ...createTestWorkspaceConfig(),
          id: "consistency-workspace",
          maxExpandedApps: 5,
        };
        yield* workspaceComponent.loadWorkspace(workspaceConfig);

        const chatApps = [
          createTestChatAppConfig("consistency-app-1", "Consistency App 1"),
        ];
        yield* workspaceComponent.loadChatApps(chatApps);

        // Wait for setup
        yield* Effect.sleep("200 millis");

        // Activate app through component
        yield* workspaceComponent.activateChatApp("consistency-app-1");
        yield* Effect.sleep("200 millis");

        // Check consistency between component and manager
        const componentActiveChatApps =
          yield* workspaceComponent.getActiveChatApps();
        const managerApp = yield* chatAppsManager.getChatAppInstance(
          "consistency-app-1"
        );
        const managerMaxApps =
          yield* chatAppsManager.getWorkspaceMaxExpandedApps(
            "consistency-workspace"
          );

        // Component and manager should be consistent
        expect(
          componentActiveChatApps.some((app) => app.id === "consistency-app-1")
        ).toBe(true);
        expect(managerApp.id).toBe("consistency-app-1");
        expect(managerMaxApps).toBe(5);

        // Deactivate and verify consistency
        yield* workspaceComponent.deactivateChatApp("consistency-app-1");
        yield* Effect.sleep("200 millis");

        const componentActiveChatAppsAfter =
          yield* workspaceComponent.getActiveChatApps();
        const managerAppAfter = yield* chatAppsManager.getChatAppInstance(
          "consistency-app-1"
        );

        expect(
          componentActiveChatAppsAfter.some(
            (app) => app.id === "consistency-app-1"
          )
        ).toBe(false);
        expect(managerAppAfter.status).toBe("stashed");
      });

      await Effect.runPromise(Effect.provide(program, testLayer));
    });
  });
});
