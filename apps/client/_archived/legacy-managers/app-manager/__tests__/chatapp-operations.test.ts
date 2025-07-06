import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { AppManager } from "../service";
import {
  WorkspaceNotFoundError,
  WorkspaceValidationError,
  ChatAppNotFoundError,
} from "../errors";

describe("AppManager - ChatApp Operations", () => {
  const TestLayer = Layer.mergeAll(
    NodeFileSystem.layer,
    AppManager.Default
  );

  let cleanup: (() => Effect.Effect<void>) | null = null;

  beforeEach(async () => {
    cleanup = null;
  });

  afterEach(async () => {
    if (cleanup) {
      await Effect.runPromise(cleanup().pipe(Effect.provide(TestLayer)));
    }
  });

  describe("addChatAppToWorkspace", () => {
    test("should add chat app to existing workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Add a chat app to the workspace
        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Test Chat App",
          agentId: "agent-1",
          status: "stashed",
        });

        expect(chatApp).toBeDefined();
        expect(chatApp.name).toBe("Test Chat App");
        expect(chatApp.agentId).toBe("agent-1");
        expect(chatApp.status).toBe("stashed");
        expect(chatApp.workspaceId).toBe(workspace.id);
        expect(chatApp.id).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should add multiple chat apps to workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Multi-App Workspace",
          availableAgents: ["agent-1", "agent-2"],
        });

        // Add multiple chat apps
        const chatApp1 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Chat App 1",
          agentId: "agent-1",
          status: "stashed",
        });

        const chatApp2 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Chat App 2",
          agentId: "agent-2",
          status: "compact",
        });

        const chatApp3 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Chat App 3",
          agentId: "agent-1",
          status: "expanded",
        });

        // Verify all apps were added
        const chatApps = yield* manager.getChatAppsInWorkspace(workspace.id);
        expect(chatApps).toHaveLength(3);
        expect(chatApps.some((app) => app.id === chatApp1.id)).toBe(true);
        expect(chatApps.some((app) => app.id === chatApp2.id)).toBe(true);
        expect(chatApps.some((app) => app.id === chatApp3.id)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when adding chat app to non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to add chat app to non-existent workspace
        const result = yield* Effect.either(
          manager.addChatAppToWorkspace("non-existent-workspace", {
            name: "Test App",
            agentId: "agent-1",
            status: "stashed",
          })
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle different chat app statuses", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Status Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Add chat apps with different statuses
        const stashedApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Stashed App",
          agentId: "agent-1",
          status: "stashed",
        });

        const compactApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Compact App",
          agentId: "agent-1",
          status: "compact",
        });

        const expandedApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Expanded App",
          agentId: "agent-1",
          status: "expanded",
        });

        const closedApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Closed App",
          agentId: "agent-1",
          status: "closed",
        });

        expect(stashedApp.status).toBe("stashed");
        expect(compactApp.status).toBe("compact");
        expect(expandedApp.status).toBe("expanded");
        expect(closedApp.status).toBe("closed");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after adding chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "State Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Get initial state
        const initialState = yield* manager.getState();
        const initialAppCount = Object.keys(initialState.chatApps).length;

        // Add a chat app
        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "State Test App",
          agentId: "agent-1",
          status: "stashed",
        });

        // Verify state was updated
        const updatedState = yield* manager.getState();
        const finalAppCount = Object.keys(updatedState.chatApps).length;

        expect(finalAppCount).toBe(initialAppCount + 1);
        expect(updatedState.chatApps[chatApp.id]).toBeDefined();
        expect(updatedState.chatApps[chatApp.id].name).toBe("State Test App");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getChatAppsInWorkspace", () => {
    test("should return empty array for workspace with no chat apps", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Empty Workspace",
          availableAgents: ["agent-1"],
        });

        // Get chat apps (should be empty)
        const chatApps = yield* manager.getChatAppsInWorkspace(workspace.id);

        expect(chatApps).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should return all chat apps in workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "App Collection Workspace",
          availableAgents: ["agent-1", "agent-2"],
        });

        // Add multiple chat apps
        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "App 1",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "App 2",
          agentId: "agent-2",
          status: "compact",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "App 3",
          agentId: "agent-1",
          status: "expanded",
        });

        // Get all chat apps
        const chatApps = yield* manager.getChatAppsInWorkspace(workspace.id);

        expect(chatApps).toHaveLength(3);
        expect(chatApps.some((app) => app.name === "App 1")).toBe(true);
        expect(chatApps.some((app) => app.name === "App 2")).toBe(true);
        expect(chatApps.some((app) => app.name === "App 3")).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when getting chat apps for non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to get chat apps for non-existent workspace
        const result = yield* Effect.either(
          manager.getChatAppsInWorkspace("non-existent-workspace")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should isolate chat apps between workspaces", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create two workspaces
        const workspace1 = yield* manager.createWorkspace({
          name: "Workspace 1",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Workspace 2",
          availableAgents: ["agent-2"],
        });

        // Add chat apps to each workspace
        yield* manager.addChatAppToWorkspace(workspace1.id, {
          name: "App in Workspace 1",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace2.id, {
          name: "App in Workspace 2",
          agentId: "agent-2",
          status: "compact",
        });

        // Verify isolation
        const apps1 = yield* manager.getChatAppsInWorkspace(workspace1.id);
        const apps2 = yield* manager.getChatAppsInWorkspace(workspace2.id);

        expect(apps1).toHaveLength(1);
        expect(apps2).toHaveLength(1);
        expect(apps1[0].name).toBe("App in Workspace 1");
        expect(apps2[0].name).toBe("App in Workspace 2");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("removeChatAppFromWorkspace", () => {
    test("should remove chat app from workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "Removal Test Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "App to Remove",
          agentId: "agent-1",
          status: "stashed",
        });

        // Verify app exists
        const appsBefore = yield* manager.getChatAppsInWorkspace(workspace.id);
        expect(appsBefore).toHaveLength(1);

        // Remove the chat app
        yield* manager.removeChatAppFromWorkspace(workspace.id, chatApp.id);

        // Verify app was removed
        const appsAfter = yield* manager.getChatAppsInWorkspace(workspace.id);
        expect(appsAfter).toHaveLength(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when removing non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Try to remove non-existent chat app
        const result = yield* Effect.either(
          manager.removeChatAppFromWorkspace(workspace.id, "non-existent-app")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatAppNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when removing from non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to remove chat app from non-existent workspace
        const result = yield* Effect.either(
          manager.removeChatAppFromWorkspace(
            "non-existent-workspace",
            "some-app-id"
          )
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should remove only targeted chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add multiple chat apps
        const workspace = yield* manager.createWorkspace({
          name: "Selective Removal Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp1 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Keep This App",
          agentId: "agent-1",
          status: "stashed",
        });

        const chatApp2 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Remove This App",
          agentId: "agent-1",
          status: "compact",
        });

        const chatApp3 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Keep This Too",
          agentId: "agent-1",
          status: "expanded",
        });

        // Remove only the second app
        yield* manager.removeChatAppFromWorkspace(workspace.id, chatApp2.id);

        // Verify only the targeted app was removed
        const remainingApps = yield* manager.getChatAppsInWorkspace(
          workspace.id
        );
        expect(remainingApps).toHaveLength(2);
        expect(remainingApps.some((app) => app.id === chatApp1.id)).toBe(true);
        expect(remainingApps.some((app) => app.id === chatApp2.id)).toBe(false);
        expect(remainingApps.some((app) => app.id === chatApp3.id)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after removing chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "State Update Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "App to Remove",
          agentId: "agent-1",
          status: "stashed",
        });

        // Verify app exists in state
        const stateBefore = yield* manager.getState();
        expect(stateBefore.chatApps[chatApp.id]).toBeDefined();

        // Remove the chat app
        yield* manager.removeChatAppFromWorkspace(workspace.id, chatApp.id);

        // Verify app was removed from state
        const stateAfter = yield* manager.getState();
        expect(stateAfter.chatApps[chatApp.id]).toBeUndefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("updateChatAppStatus", () => {
    test("should update chat app status", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "Status Update Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Status Test App",
          agentId: "agent-1",
          status: "stashed",
        });

        // Update the status
        yield* manager.updateChatAppStatus(chatApp.id, "expanded");

        // Verify status was updated
        const updatedApps = yield* manager.getChatAppsInWorkspace(workspace.id);
        const updatedApp = updatedApps.find((app) => app.id === chatApp.id);
        expect(updatedApp?.status).toBe("expanded");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update through all valid statuses", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "Status Cycle Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Status Cycle App",
          agentId: "agent-1",
          status: "stashed",
        });

        const statuses = ["stashed", "compact", "expanded", "closed"] as const;

        // Cycle through all statuses
        for (const status of statuses) {
          yield* manager.updateChatAppStatus(chatApp.id, status);

          const apps = yield* manager.getChatAppsInWorkspace(workspace.id);
          const app = apps.find((a) => a.id === chatApp.id);
          expect(app?.status).toBe(status);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when updating status of non-existent chat app", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to update status of non-existent chat app
        const result = yield* Effect.either(
          manager.updateChatAppStatus("non-existent-app", "expanded")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatAppNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after status change", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "State Status Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "State Status App",
          agentId: "agent-1",
          status: "stashed",
        });

        // Update the status
        yield* manager.updateChatAppStatus(chatApp.id, "compact");

        // Verify state was updated
        const state = yield* manager.getState();
        expect(state.chatApps[chatApp.id].status).toBe("compact");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent status updates", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace and add a chat app
        const workspace = yield* manager.createWorkspace({
          name: "Concurrent Status Workspace",
          availableAgents: ["agent-1"],
        });

        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Concurrent Status App",
          agentId: "agent-1",
          status: "stashed",
        });

        // Attempt concurrent status updates
        const updates = [
          manager.updateChatAppStatus(chatApp.id, "compact"),
          manager.updateChatAppStatus(chatApp.id, "expanded"),
          manager.updateChatAppStatus(chatApp.id, "closed"),
        ];

        const results = yield* Effect.all(
          updates.map((update) => Effect.either(update)),
          { concurrency: "unbounded" }
        );

        // At least one should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBeGreaterThan(0);

        // App should still exist with some final status
        const finalApps = yield* manager.getChatAppsInWorkspace(workspace.id);
        const finalApp = finalApps.find((app) => app.id === chatApp.id);
        expect(finalApp).toBeDefined();
        expect(["stashed", "compact", "expanded", "closed"]).toContain(
          finalApp?.status
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getStashedChatApps", () => {
    test("should return only stashed chat apps", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Stashed Apps Workspace",
          availableAgents: ["agent-1"],
        });

        // Add chat apps with different statuses
        const stashedApp1 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Stashed App 1",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Compact App",
          agentId: "agent-1",
          status: "compact",
        });

        const stashedApp2 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Stashed App 2",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Expanded App",
          agentId: "agent-1",
          status: "expanded",
        });

        // Get only stashed apps
        const stashedApps = yield* manager.getStashedChatApps(workspace.id);

        expect(stashedApps).toHaveLength(2);
        expect(stashedApps.some((app) => app.id === stashedApp1.id)).toBe(true);
        expect(stashedApps.some((app) => app.id === stashedApp2.id)).toBe(true);
        stashedApps.forEach((app) => {
          expect(app.status).toBe("stashed");
        });
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should return empty array when no stashed apps exist", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "No Stashed Apps Workspace",
          availableAgents: ["agent-1"],
        });

        // Add non-stashed apps
        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Compact App",
          agentId: "agent-1",
          status: "compact",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Expanded App",
          agentId: "agent-1",
          status: "expanded",
        });

        // Get stashed apps (should be empty)
        const stashedApps = yield* manager.getStashedChatApps(workspace.id);

        expect(stashedApps).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update when apps are stashed/unstashed", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Dynamic Stashing Workspace",
          availableAgents: ["agent-1"],
        });

        // Add an expanded app
        const chatApp = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Dynamic App",
          agentId: "agent-1",
          status: "expanded",
        });

        // Initially no stashed apps
        const initialStashed = yield* manager.getStashedChatApps(workspace.id);
        expect(initialStashed).toHaveLength(0);

        // Stash the app
        yield* manager.updateChatAppStatus(chatApp.id, "stashed");

        // Now should have one stashed app
        const afterStashing = yield* manager.getStashedChatApps(workspace.id);
        expect(afterStashing).toHaveLength(1);
        expect(afterStashing[0].id).toBe(chatApp.id);

        // Unstash the app
        yield* manager.updateChatAppStatus(chatApp.id, "compact");

        // Should be empty again
        const afterUnstashing = yield* manager.getStashedChatApps(workspace.id);
        expect(afterUnstashing).toHaveLength(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("ChatApp Integration", () => {
    test("should maintain chat app consistency across workspace operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Integration Test Workspace",
          availableAgents: ["agent-1", "agent-2"],
        });

        // Add chat apps
        const chatApp1 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Integration App 1",
          agentId: "agent-1",
          status: "stashed",
        });

        const chatApp2 = yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Integration App 2",
          agentId: "agent-2",
          status: "compact",
        });

        // Update workspace (should not affect chat apps)
        yield* manager.updateWorkspace(workspace.id, {
          name: "Updated Integration Workspace",
        });

        // Verify chat apps are still intact
        const appsAfterUpdate = yield* manager.getChatAppsInWorkspace(
          workspace.id
        );
        expect(appsAfterUpdate).toHaveLength(2);
        expect(appsAfterUpdate.some((app) => app.id === chatApp1.id)).toBe(
          true
        );
        expect(appsAfterUpdate.some((app) => app.id === chatApp2.id)).toBe(
          true
        );

        // Update chat app status
        yield* manager.updateChatAppStatus(chatApp1.id, "expanded");

        // Verify workspace is still intact
        const updatedWorkspace = yield* manager.getCurrentWorkspace();
        // Note: getCurrentWorkspace might return null if not set as current
        const state = yield* manager.getState();
        expect(state.workspaces[workspace.id]).toBeDefined();
        expect(state.workspaces[workspace.id].name).toBe(
          "Updated Integration Workspace"
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle workspace stats with chat apps", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Stats Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Initially no apps
        const initialStats = yield* manager.getWorkspaceStats(workspace.id);
        expect(initialStats.totalChatApps).toBe(0);
        expect(initialStats.activeChatApps).toBe(0);
        expect(initialStats.expandedChatApps).toBe(0);

        // Add chat apps with different statuses
        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Stashed App",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Compact App",
          agentId: "agent-1",
          status: "compact",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Expanded App",
          agentId: "agent-1",
          status: "expanded",
        });

        yield* manager.addChatAppToWorkspace(workspace.id, {
          name: "Closed App",
          agentId: "agent-1",
          status: "closed",
        });

        // Check updated stats
        const finalStats = yield* manager.getWorkspaceStats(workspace.id);
        expect(finalStats.totalChatApps).toBe(4);
        expect(finalStats.activeChatApps).toBe(3); // stashed, compact, expanded (not closed)
        expect(finalStats.expandedChatApps).toBe(1);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
