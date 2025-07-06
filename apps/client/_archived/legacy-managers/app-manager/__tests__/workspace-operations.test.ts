import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { AppManager } from "../service";
import {
  WorkspaceNotFoundError,
  WorkspaceValidationError,
  ChatAppNotFoundError,
} from "../errors";

describe("AppManager - Workspace Operations", () => {
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

  describe("createWorkspace", () => {
    test("should create workspace with required fields", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Test Workspace",
          description: "A test workspace",
          availableAgents: ["agent-1", "agent-2"],
        });

        expect(workspace).toBeDefined();
        expect(workspace.name).toBe("Test Workspace");
        expect(workspace.description).toBe("A test workspace");
        expect(workspace.availableAgents).toEqual(["agent-1", "agent-2"]);
        expect(workspace.id).toBeDefined();
        expect(workspace.createdAt).toBeInstanceOf(Date);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should create workspace with optional fields", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace with optional fields
        const workspace = yield* manager.createWorkspace({
          name: "Colorful Workspace",
          description: "A workspace with style",
          icon: "🎨",
          color: "#FF5733",
          availableAgents: ["agent-1"],
        });

        expect(workspace).toBeDefined();
        expect(workspace.name).toBe("Colorful Workspace");
        expect(workspace.icon).toBe("🎨");
        expect(workspace.color).toBe("#FF5733");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should create workspace with minimal required fields", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace with only required fields
        const workspace = yield* manager.createWorkspace({
          name: "Minimal Workspace",
          availableAgents: ["agent-1"],
        });

        expect(workspace).toBeDefined();
        expect(workspace.name).toBe("Minimal Workspace");
        expect(workspace.availableAgents).toEqual(["agent-1"]);
        expect(workspace.description).toBeUndefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle empty agent list", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create workspace with minimal agent list
        const workspace = yield* manager.createWorkspace({
          name: "Empty Agents Workspace",
          availableAgents: ["agent-1"],
        });

        expect(workspace).toBeDefined();
        expect(workspace.availableAgents).toEqual(["agent-1"]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle multiple agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create workspace with multiple agents
        const workspace = yield* manager.createWorkspace({
          name: "Multi-Agent Workspace",
          availableAgents: ["agent-1", "agent-2", "agent-3", "agent-4"],
        });

        expect(workspace).toBeDefined();
        expect(workspace.availableAgents).toHaveLength(4);
        expect(workspace.availableAgents).toContain("agent-1");
        expect(workspace.availableAgents).toContain("agent-4");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state after workspace creation", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Get initial state
        const initialState = yield* manager.getState();
        const initialWorkspaceCount = Object.keys(
          initialState.workspaces
        ).length;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "State Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Get updated state
        const updatedState = yield* manager.getState();
        const finalWorkspaceCount = Object.keys(updatedState.workspaces).length;

        expect(finalWorkspaceCount).toBe(initialWorkspaceCount + 1);
        expect(updatedState.workspaces[workspace.id]).toBeDefined();
        expect(updatedState.workspaces[workspace.id].name).toBe(
          "State Test Workspace"
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("updateWorkspace", () => {
    test("should update workspace name", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Original Name",
          availableAgents: ["agent-1"],
        });

        // Update the workspace name
        const updatedWorkspace = yield* manager.updateWorkspace(workspace.id, {
          name: "Updated Name",
        });

        expect(updatedWorkspace.name).toBe("Updated Name");
        expect(updatedWorkspace.id).toBe(workspace.id);
        expect(updatedWorkspace.availableAgents).toEqual(["agent-1"]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update workspace description", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Test Workspace",
          description: "Original description",
          availableAgents: ["agent-1"],
        });

        // Update the description
        const updatedWorkspace = yield* manager.updateWorkspace(workspace.id, {
          description: "Updated description",
        });

        expect(updatedWorkspace.description).toBe("Updated description");
        expect(updatedWorkspace.name).toBe("Test Workspace");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update multiple fields", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Original",
          description: "Original desc",
          availableAgents: ["agent-1"],
        });

        // Update multiple fields
        const updatedWorkspace = yield* manager.updateWorkspace(workspace.id, {
          name: "Updated Name",
          description: "Updated description",
          icon: "🆕",
          color: "#00FF00",
        });

        expect(updatedWorkspace.name).toBe("Updated Name");
        expect(updatedWorkspace.description).toBe("Updated description");
        expect(updatedWorkspace.icon).toBe("🆕");
        expect(updatedWorkspace.color).toBe("#00FF00");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when updating non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to update non-existent workspace
        const result = yield* Effect.either(
          manager.updateWorkspace("non-existent-id", { name: "New Name" })
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should preserve unchanged fields", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace with all fields
        const workspace = yield* manager.createWorkspace({
          name: "Complete Workspace",
          description: "Full description",
          icon: "📁",
          color: "#FF0000",
          availableAgents: ["agent-1", "agent-2"],
        });

        // Update only the name
        const updatedWorkspace = yield* manager.updateWorkspace(workspace.id, {
          name: "New Name Only",
        });

        expect(updatedWorkspace.name).toBe("New Name Only");
        expect(updatedWorkspace.description).toBe("Full description");
        expect(updatedWorkspace.icon).toBe("📁");
        expect(updatedWorkspace.color).toBe("#FF0000");
        expect(updatedWorkspace.availableAgents).toEqual([
          "agent-1",
          "agent-2",
        ]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getCurrentWorkspace", () => {
    test("should return null when no current workspace is set", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Get current workspace without setting one
        const currentWorkspace = yield* manager.getCurrentWorkspace();

        expect(currentWorkspace).toBeNull();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should return current workspace after setting", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create and set current workspace
        const workspace = yield* manager.createWorkspace({
          name: "Current Workspace",
          availableAgents: ["agent-1"],
        });

        yield* manager.setCurrentWorkspace(workspace.id);

        // Get current workspace
        const currentWorkspace = yield* manager.getCurrentWorkspace();

        expect(currentWorkspace).toBeDefined();
        expect(currentWorkspace?.id).toBe(workspace.id);
        expect(currentWorkspace?.name).toBe("Current Workspace");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update when current workspace changes", async () => {
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

        // Set first workspace as current
        yield* manager.setCurrentWorkspace(workspace1.id);
        const current1 = yield* manager.getCurrentWorkspace();
        expect(current1?.id).toBe(workspace1.id);

        // Switch to second workspace
        yield* manager.setCurrentWorkspace(workspace2.id);
        const current2 = yield* manager.getCurrentWorkspace();
        expect(current2?.id).toBe(workspace2.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("setCurrentWorkspace", () => {
    test("should set current workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "Test Workspace",
          availableAgents: ["agent-1"],
        });

        // Set as current workspace
        yield* manager.setCurrentWorkspace(workspace.id);

        // Verify it was set
        const state = yield* manager.getState();
        expect(state.currentWorkspaceId).toBe(workspace.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when setting non-existent workspace as current", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to set non-existent workspace as current
        const result = yield* Effect.either(
          manager.setCurrentWorkspace("non-existent-id")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update state when setting current workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create a workspace
        const workspace = yield* manager.createWorkspace({
          name: "State Update Test",
          availableAgents: ["agent-1"],
        });

        // Verify initial state - workspace becomes current automatically if none exists
        const initialState = yield* manager.getState();
        expect(initialState.currentWorkspaceId).toBe(workspace.id);

        // Set current workspace
        yield* manager.setCurrentWorkspace(workspace.id);

        // Verify state update
        const updatedState = yield* manager.getState();
        expect(updatedState.currentWorkspaceId).toBe(workspace.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("getActiveWorkspaces", () => {
    test("should return empty array when no workspaces exist", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Get active workspaces with no workspaces created
        const activeWorkspaces = yield* manager.getActiveWorkspaces();

        expect(activeWorkspaces).toEqual([]);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should return all non-archived workspaces", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces
        const workspace1 = yield* manager.createWorkspace({
          name: "Active Workspace 1",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Active Workspace 2",
          availableAgents: ["agent-2"],
        });

        // Get active workspaces
        const activeWorkspaces = yield* manager.getActiveWorkspaces();

        expect(activeWorkspaces).toHaveLength(2);
        expect(activeWorkspaces.some((w) => w.id === workspace1.id)).toBe(true);
        expect(activeWorkspaces.some((w) => w.id === workspace2.id)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should exclude archived workspaces", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create workspaces
        const workspace1 = yield* manager.createWorkspace({
          name: "Active Workspace",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "To Be Archived",
          availableAgents: ["agent-2"],
        });

        // Archive one workspace
        yield* manager.archiveWorkspace(workspace2.id);

        // Get active workspaces
        const activeWorkspaces = yield* manager.getActiveWorkspaces();

        expect(activeWorkspaces).toHaveLength(1);
        expect(activeWorkspaces[0].id).toBe(workspace1.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("archiveWorkspace", () => {
    test("should archive existing workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces (can't archive the last active one)
        const workspace1 = yield* manager.createWorkspace({
          name: "To Archive",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Keep Active",
          availableAgents: ["agent-2"],
        });

        // Archive the first workspace
        yield* manager.archiveWorkspace(workspace1.id);

        // Verify it's archived (not in active workspaces)
        const activeWorkspaces = yield* manager.getActiveWorkspaces();
        expect(activeWorkspaces.some((w) => w.id === workspace1.id)).toBe(
          false
        );
        expect(activeWorkspaces.some((w) => w.id === workspace2.id)).toBe(true);

        // Verify it still exists in state but is archived
        const state = yield* manager.getState();
        const archivedWorkspace = state.workspaces[workspace1.id];
        expect(archivedWorkspace).toBeDefined();
        expect(archivedWorkspace.isArchived).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when archiving non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to archive non-existent workspace
        const result = yield* Effect.either(
          manager.archiveWorkspace("non-existent-id")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should clear current workspace if archived workspace was current", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces (can't archive the last active one)
        const workspace1 = yield* manager.createWorkspace({
          name: "Current To Archive",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Backup Workspace",
          availableAgents: ["agent-2"],
        });

        yield* manager.setCurrentWorkspace(workspace1.id);

        // Verify it's current
        const currentBefore = yield* manager.getCurrentWorkspace();
        expect(currentBefore?.id).toBe(workspace1.id);

        // Archive the current workspace
        yield* manager.archiveWorkspace(workspace1.id);

        // Verify current workspace switched to the other active workspace
        const currentAfter = yield* manager.getCurrentWorkspace();
        expect(currentAfter?.id).toBe(workspace2.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("deleteWorkspace", () => {
    test("should delete existing workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces (can't delete the last one)
        const workspace1 = yield* manager.createWorkspace({
          name: "To Delete",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Keep This",
          availableAgents: ["agent-2"],
        });

        // Delete the first workspace
        yield* manager.deleteWorkspace(workspace1.id);

        // Verify it's completely removed
        const state = yield* manager.getState();
        expect(state.workspaces[workspace1.id]).toBeUndefined();
        expect(state.workspaces[workspace2.id]).toBeDefined();

        const activeWorkspaces = yield* manager.getActiveWorkspaces();
        expect(activeWorkspaces.some((w) => w.id === workspace1.id)).toBe(
          false
        );
        expect(activeWorkspaces.some((w) => w.id === workspace2.id)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when deleting non-existent workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Try to delete non-existent workspace
        const result = yield* Effect.either(
          manager.deleteWorkspace("non-existent-id")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(WorkspaceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should clear current workspace if deleted workspace was current", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces (can't delete the last one)
        const workspace1 = yield* manager.createWorkspace({
          name: "Current To Delete",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Backup Workspace",
          availableAgents: ["agent-2"],
        });

        yield* manager.setCurrentWorkspace(workspace1.id);

        // Delete the current workspace
        yield* manager.deleteWorkspace(workspace1.id);

        // Verify current workspace switched to the other workspace
        const currentAfter = yield* manager.getCurrentWorkspace();
        expect(currentAfter?.id).toBe(workspace2.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should remove associated chat apps when deleting workspace", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create multiple workspaces (can't delete the last one)
        const workspace1 = yield* manager.createWorkspace({
          name: "Workspace with Apps",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Backup Workspace",
          availableAgents: ["agent-2"],
        });

        // Add chat apps to the first workspace
        yield* manager.addChatAppToWorkspace(workspace1.id, {
          name: "Test App 1",
          agentId: "agent-1",
          status: "stashed",
        });

        yield* manager.addChatAppToWorkspace(workspace1.id, {
          name: "Test App 2",
          agentId: "agent-2",
          status: "compact",
        });

        // Verify chat apps exist
        const chatAppsBefore = yield* manager.getChatAppsInWorkspace(
          workspace1.id
        );
        expect(chatAppsBefore).toHaveLength(2);

        // Delete the workspace
        yield* manager.deleteWorkspace(workspace1.id);

        // Verify associated chat apps are also removed
        const state = yield* manager.getState();
        const remainingChatApps = Object.values(state.chatApps).filter(
          (app) => app.workspaceId === workspace1.id
        );
        expect(remainingChatApps).toHaveLength(0);

        // Verify the other workspace still exists
        expect(state.workspaces[workspace2.id]).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Workspace State Consistency", () => {
    test("should maintain consistent state across operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Perform multiple operations and verify state consistency
        const workspace1 = yield* manager.createWorkspace({
          name: "Workspace 1",
          availableAgents: ["agent-1"],
        });

        const workspace2 = yield* manager.createWorkspace({
          name: "Workspace 2",
          availableAgents: ["agent-2"],
        });

        // Set current workspace
        yield* manager.setCurrentWorkspace(workspace1.id);

        // Update workspace
        yield* manager.updateWorkspace(workspace2.id, {
          name: "Updated Workspace 2",
        });

        // Archive workspace
        yield* manager.archiveWorkspace(workspace2.id);

        // Verify final state
        const state = yield* manager.getState();
        expect(state.currentWorkspaceId).toBe(workspace1.id);
        expect(state.workspaces[workspace1.id].name).toBe("Workspace 1");
        expect(state.workspaces[workspace2.id].name).toBe(
          "Updated Workspace 2"
        );
        expect(state.workspaces[workspace2.id].isArchived).toBe(true);

        const activeWorkspaces = yield* manager.getActiveWorkspaces();
        expect(activeWorkspaces).toHaveLength(1);
        expect(activeWorkspaces[0].id).toBe(workspace1.id);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent workspace operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* AppManager;

        // Create workspace first
        const workspace = yield* manager.createWorkspace({
          name: "Concurrent Test",
          availableAgents: ["agent-1"],
        });

        // Perform concurrent operations
        const operations = [
          manager.updateWorkspace(workspace.id, { name: "Updated Name 1" }),
          manager.updateWorkspace(workspace.id, {
            description: "Updated Description",
          }),
          manager.updateWorkspace(workspace.id, { icon: "🔄" }),
        ];

        const results = yield* Effect.all(
          operations.map((op) => Effect.either(op)),
          { concurrency: "unbounded" }
        );

        // At least some operations should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBeGreaterThan(0);

        // Workspace should still exist and be functional
        const finalWorkspace = yield* manager.getCurrentWorkspace();
        const state = yield* manager.getState();
        expect(state.workspaces[workspace.id]).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
