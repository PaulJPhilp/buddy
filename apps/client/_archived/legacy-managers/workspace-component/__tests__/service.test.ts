import { Effect, TestClock, TestContext } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ChatAppNotFoundError,
  DEFAULT_WORKSPACE_STATE,
  WORKSPACE_CONSTANTS,
  WorkspaceCapacityError,
  WorkspaceManager,
  WorkspaceNotFoundError,
  WorkspaceStateError,
  WorkspaceValidationError,
  createDefaultWorkspace,
} from "../index";
import type { ChatAppConfig, ChatAppEntry, WorkspaceEntry } from "../types";

// Test helper to run effects with the WorkspaceManager
const runWithWorkspaceManager = <A, E>(
  effect: Effect.Effect<A, E, WorkspaceManager>
) => Effect.runPromise(Effect.provide(effect, WorkspaceManager.Default));

// Mock chat app config for testing
const createMockChatAppConfig = (
  overrides: Partial<ChatAppConfig> = {}
): ChatAppConfig => ({
  id: "test-app-1",
  name: "Test Chat App",
  description: "A test chat application",
  workspaceId: "test-workspace-1",
  agentId: "test-agent-1",
  ...overrides,
});

describe("WorkspaceManager", () => {
  describe("State Management", () => {
    it("should initialize with default state", async () => {
      const result = await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;
          return yield* workspaceManager.getState();
        })
      );

      // The current implementation starts with empty state (no default workspace)
      expect(result).toEqual(DEFAULT_WORKSPACE_STATE);
      expect(result.workspaces).toEqual({});
      expect(result.currentWorkspaceId).toBe(null);
      expect(result.chatApps).toEqual({});
      expect(result.isLoading).toBe(false);
    });

    it("should handle state subscriptions", async () => {
      const stateUpdates: any[] = [];

      await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          // Subscribe to state changes
          const unsubscribe = yield* workspaceManager.subscribe((state) => {
            stateUpdates.push(state);
          });

          // Create a workspace to trigger state change
          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace",
            name: "Test Workspace",
            availableAgents: ["agent-1"],
          });

          // Unsubscribe
          yield* unsubscribe();

          // This change should not be recorded
          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace-2",
            name: "Test Workspace 2",
            availableAgents: ["agent-1"],
          });
        })
      );

      // Should have received exactly one update (when creating the workspace)
      // Note: Creating the first real workspace triggers one state update that both
      // adds the new workspace AND removes the placeholder
      expect(stateUpdates).toHaveLength(1);
      expect(stateUpdates[0].workspaces["test-workspace"]).toBeDefined();
      expect(stateUpdates[0].workspaces["test-workspace-2"]).toBeUndefined();
      // The default placeholder should be removed
      expect(
        stateUpdates[0].workspaces[WORKSPACE_CONSTANTS.DEFAULT_WORKSPACE_ID]
      ).toBeUndefined();
    });
  });

  describe("Workspace Management", () => {
    describe("createWorkspace", () => {
      it("should create a new workspace successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;
            return yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              color: "#ff0000",
              description: "A test workspace",
              icon: "🚀",
              availableAgents: ["agent-1", "agent-2"],
            });
          })
        );

        expect(result.id).toBe("test-workspace");
        expect(result.name).toBe("Test Workspace");
        expect(result.color).toBe("#ff0000");
        expect(result.description).toBe("A test workspace");
        expect(result.icon).toBe("🚀");
        expect(result.availableAgents).toEqual(["agent-1", "agent-2"]);
        expect(result.isArchived).toBe(false);
        expect(result.isPlaceholder).toBeUndefined();
      });

      it("should remove default placeholder when creating first real workspace", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create a real workspace
            yield* workspaceManager.createWorkspace({
              workspaceId: "real-workspace",
              name: "Real Workspace",
              availableAgents: ["agent-1"],
            });

            return yield* workspaceManager.getState();
          })
        );

        expect(
          result.workspaces[WORKSPACE_CONSTANTS.DEFAULT_WORKSPACE_ID]
        ).toBeUndefined();
        expect(result.workspaces["real-workspace"]).toBeDefined();
        expect(result.currentWorkspaceId).toBe("real-workspace");
      });

      it("should validate workspace name", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;
              yield* workspaceManager.createWorkspace({
                workspaceId: "test-workspace",
                name: "", // Invalid empty name
                availableAgents: ["agent-1"],
              });
            })
          )
        ).rejects.toThrow(
          "Workspace name must be between 1 and 100 characters"
        );
      });

      it("should validate workspace color", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;
              yield* workspaceManager.createWorkspace({
                workspaceId: "test-workspace",
                name: "Test Workspace",
                color: "invalid-color", // Invalid color format
                availableAgents: ["agent-1"],
              });
            })
          )
        ).rejects.toThrow("Workspace color must be a valid hex color");
      });

      it("should validate available agents", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;
              yield* workspaceManager.createWorkspace({
                workspaceId: "test-workspace",
                name: "Test Workspace",
                availableAgents: [], // Invalid empty agents
              });
            })
          )
        ).rejects.toThrow("Workspace must have at least one available agent");
      });

      it("should respect workspace capacity limit", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;

              // Create maximum number of workspaces
              for (let i = 0; i < WORKSPACE_CONSTANTS.MAX_WORKSPACES; i++) {
                yield* workspaceManager.createWorkspace({
                  workspaceId: `workspace-${i}`,
                  name: `Workspace ${i}`,
                  availableAgents: ["agent-1"],
                });
              }

              // This should fail
              yield* workspaceManager.createWorkspace({
                workspaceId: "overflow-workspace",
                name: "Overflow Workspace",
                availableAgents: ["agent-1"],
              });
            })
          )
        ).rejects.toThrow(
          `maximum ${WORKSPACE_CONSTANTS.MAX_WORKSPACES} workspaces allowed`
        );
      });
    });

    describe("updateWorkspace", () => {
      it("should update workspace successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspace first
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Original Name",
              availableAgents: ["agent-1"],
            });

            // Update it
            return yield* workspaceManager.updateWorkspace("test-workspace", {
              name: "Updated Name",
              color: "#00ff00",
              description: "Updated description",
            });
          })
        );

        expect(result.name).toBe("Updated Name");
        expect(result.color).toBe("#00ff00");
        expect(result.description).toBe("Updated description");
      });

      it("should fail for non-existent workspace", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;
              yield* workspaceManager.updateWorkspace("non-existent", {
                name: "Updated Name",
              });
            })
          )
        ).rejects.toThrow("Workspace with id 'non-existent' not found");
      });
    });

    describe("deleteWorkspace", () => {
      it("should delete workspace successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create two workspaces
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-1",
              name: "Workspace 1",
              availableAgents: ["agent-1"],
            });
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-2",
              name: "Workspace 2",
              availableAgents: ["agent-1"],
            });

            // Delete one
            yield* workspaceManager.deleteWorkspace("workspace-1");

            return yield* workspaceManager.getState();
          })
        );

        expect(result.workspaces["workspace-1"]).toBeUndefined();
        expect(result.workspaces["workspace-2"]).toBeDefined();
      });

      it("should prevent deleting the last workspace", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;

              // Create one workspace
              yield* workspaceManager.createWorkspace({
                workspaceId: "only-workspace",
                name: "Only Workspace",
                availableAgents: ["agent-1"],
              });

              // Try to delete it (should fail)
              yield* workspaceManager.deleteWorkspace("only-workspace");
            })
          )
        ).rejects.toThrow("at least 1 workspace must remain");
      });
    });

    describe("archiveWorkspace", () => {
      it("should archive workspace successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create two workspaces
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-1",
              name: "Workspace 1",
              availableAgents: ["agent-1"],
            });
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-2",
              name: "Workspace 2",
              availableAgents: ["agent-1"],
            });

            // Archive one
            yield* workspaceManager.archiveWorkspace("workspace-1");

            return yield* workspaceManager.getState();
          })
        );

        expect(result.workspaces["workspace-1"].isArchived).toBe(true);
        expect(result.currentWorkspaceId).toBe("workspace-2"); // Should switch to active workspace
      });
    });

    describe("setActiveWorkspace", () => {
      it("should set active workspace successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspace
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            // Set it as active
            yield* workspaceManager.setActiveWorkspace("test-workspace");

            return yield* workspaceManager.getState();
          })
        );

        expect(result.currentWorkspaceId).toBe("test-workspace");
      });

      it("should prevent activating archived workspace", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;

              // Create and archive workspace
              yield* workspaceManager.createWorkspace({
                workspaceId: "test-workspace",
                name: "Test Workspace",
                availableAgents: ["agent-1"],
              });
              yield* workspaceManager.createWorkspace({
                workspaceId: "other-workspace",
                name: "Other Workspace",
                availableAgents: ["agent-1"],
              });
              yield* workspaceManager.archiveWorkspace("test-workspace");

              // Try to activate archived workspace
              yield* workspaceManager.setActiveWorkspace("test-workspace");
            })
          )
        ).rejects.toThrow("Cannot activate archived workspace");
      });
    });
  });

  describe("Chat App Management", () => {
    describe("addChatApp", () => {
      it("should add chat app successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspace first
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            // Add chat app
            const config = createMockChatAppConfig({
              workspaceId: "test-workspace",
            });
            return yield* workspaceManager.addChatApp(
              "test-workspace",
              "test-app",
              config
            );
          })
        );

        expect(result.id).toBe("test-app");
        expect(result.workspaceId).toBe("test-workspace");
        expect(result.status).toBe("compact");
        expect(result.isArchived).toBe(false);
      });

      it("should prevent duplicate chat app IDs", async () => {
        await expect(
          runWithWorkspaceManager(
            Effect.gen(function* () {
              const workspaceManager = yield* WorkspaceManager;

              // Create workspace
              yield* workspaceManager.createWorkspace({
                workspaceId: "test-workspace",
                name: "Test Workspace",
                availableAgents: ["agent-1"],
              });

              const config = createMockChatAppConfig();

              // Add chat app twice with same ID
              yield* workspaceManager.addChatApp(
                "test-workspace",
                "duplicate-app",
                config
              );
              yield* workspaceManager.addChatApp(
                "test-workspace",
                "duplicate-app",
                config
              );
            })
          )
        ).rejects.toThrow("Chat app with id 'duplicate-app' already exists");
      });
    });

    describe("setChatAppStatus", () => {
      it("should change chat app status successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspace and chat app
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            const config = createMockChatAppConfig();
            yield* workspaceManager.addChatApp(
              "test-workspace",
              "test-app",
              config
            );

            // Change status
            yield* workspaceManager.setChatAppStatus("test-app", "expanded");

            const state = yield* workspaceManager.getState();
            return state.chatApps["test-app"];
          })
        );

        expect(result.status).toBe("expanded");
      });
    });

    describe("removeChatApp", () => {
      it("should remove chat app successfully", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspace and chat app
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            const config = createMockChatAppConfig();
            yield* workspaceManager.addChatApp(
              "test-workspace",
              "test-app",
              config
            );

            // Remove chat app
            yield* workspaceManager.removeChatApp("test-app");

            return yield* workspaceManager.getState();
          })
        );

        expect(result.chatApps["test-app"]).toBeUndefined();
        expect(result.workspaces["test-workspace"].chatAppIds).not.toContain(
          "test-app"
        );
      });
    });
  });

  describe("Focus Mode", () => {
    it("should enter focus mode successfully", async () => {
      const result = await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          // Setup: Create workspace with multiple chat apps
          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace",
            name: "Test Workspace",
            availableAgents: ["agent-1"],
          });

          const config1 = createMockChatAppConfig({ id: "app-1" });
          const config2 = createMockChatAppConfig({ id: "app-2" });

          yield* workspaceManager.addChatApp(
            "test-workspace",
            "app-1",
            config1
          );
          yield* workspaceManager.addChatApp(
            "test-workspace",
            "app-2",
            config2
          );

          // Set both to expanded
          yield* workspaceManager.setChatAppStatus("app-1", "expanded");
          yield* workspaceManager.setChatAppStatus("app-2", "expanded");

          // Enter focus mode on app-1
          yield* workspaceManager.enterFocusMode("test-workspace", "app-1");

          return yield* workspaceManager.getState();
        })
      );

      expect(result.chatApps["app-1"].status).toBe("expanded");
      expect(result.chatApps["app-2"].status).toBe("stashed");
      expect(result.chatApps["app-2"].previousStatus).toBe("expanded");
      expect(result.workspaces["test-workspace"].activeAppId).toBe("app-1");
    });

    it("should exit focus mode successfully", async () => {
      const result = await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          // Setup: Create workspace with multiple chat apps
          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace",
            name: "Test Workspace",
            availableAgents: ["agent-1"],
          });

          const config1 = createMockChatAppConfig({ id: "app-1" });
          const config2 = createMockChatAppConfig({ id: "app-2" });

          yield* workspaceManager.addChatApp(
            "test-workspace",
            "app-1",
            config1
          );
          yield* workspaceManager.addChatApp(
            "test-workspace",
            "app-2",
            config2
          );

          // Set both to expanded, enter focus mode, then exit
          yield* workspaceManager.setChatAppStatus("app-1", "expanded");
          yield* workspaceManager.setChatAppStatus("app-2", "expanded");
          yield* workspaceManager.enterFocusMode("test-workspace", "app-1");
          yield* workspaceManager.exitFocusMode("test-workspace");

          return yield* workspaceManager.getState();
        })
      );

      expect(result.chatApps["app-1"].status).toBe("expanded");
      expect(result.chatApps["app-2"].status).toBe("expanded");
      expect(result.chatApps["app-2"].previousStatus).toBeUndefined();
    });
  });

  describe("Utility Methods", () => {
    describe("reset", () => {
      it("should reset to default state", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create some workspaces and chat apps
            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            const config = createMockChatAppConfig();
            yield* workspaceManager.addChatApp(
              "test-workspace",
              "test-app",
              config
            );

            // Reset
            yield* workspaceManager.reset();

            return yield* workspaceManager.getState();
          })
        );

        expect(result).toEqual(DEFAULT_WORKSPACE_STATE);
      });
    });

    describe("getWorkspaceStats", () => {
      it("should return correct statistics", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Create workspaces and chat apps
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-1",
              name: "Workspace 1",
              availableAgents: ["agent-1"],
            });
            yield* workspaceManager.createWorkspace({
              workspaceId: "workspace-2",
              name: "Workspace 2",
              availableAgents: ["agent-1"],
            });

            const config1 = createMockChatAppConfig({ id: "app-1" });
            const config2 = createMockChatAppConfig({ id: "app-2" });

            yield* workspaceManager.addChatApp("workspace-1", "app-1", config1);
            yield* workspaceManager.addChatApp("workspace-1", "app-2", config2);

            // Archive one workspace
            yield* workspaceManager.archiveWorkspace("workspace-2");

            return yield* workspaceManager.getWorkspaceStats();
          })
        );

        expect(result.workspaces.total).toBe(2);
        expect(result.workspaces.active).toBe(1);
        expect(result.workspaces.archived).toBe(1);
        expect(result.chatApps.total).toBe(2);
        expect(result.chatApps.active).toBe(2);
        expect(result.chatApps.archived).toBe(0);
      });
    });

    describe("getCurrentWorkspace", () => {
      it("should return current workspace", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            yield* workspaceManager.createWorkspace({
              workspaceId: "current-workspace",
              name: "Current Workspace",
              availableAgents: ["agent-1"],
            });

            return yield* workspaceManager.getCurrentWorkspace();
          })
        );

        expect(result?.id).toBe("current-workspace");
        expect(result?.name).toBe("Current Workspace");
      });

      it("should return null when no current workspace", async () => {
        const result = await runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            // Reset to clear any workspaces
            yield* workspaceManager.reset();

            // getCurrentWorkspace should return null when no workspaces exist
            return yield* workspaceManager.getCurrentWorkspace();
          })
        );

        // Should return null when no workspaces exist
        expect(result).toBe(null);
      });
    });
  });

  describe("Loading State", () => {
    it("should manage loading state correctly", async () => {
      const states: boolean[] = [];

      await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          // Subscribe to track loading state changes
          yield* workspaceManager.subscribe((state) => {
            states.push(state.isLoading);
          });

          yield* workspaceManager.startLoading();
          yield* workspaceManager.finishLoading();
          yield* workspaceManager.setLoading(true);
          yield* workspaceManager.failLoading(new Error("Test error"));
        })
      );

      expect(states).toEqual([true, false, true, false]);
    });
  });

  describe("Agent Management", () => {
    it("should add agent to workspace", async () => {
      const result = await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace",
            name: "Test Workspace",
            availableAgents: ["agent-1"],
          });

          yield* workspaceManager.addAgentToWorkspace(
            "test-workspace",
            "agent-2"
          );

          const state = yield* workspaceManager.getState();
          return state.workspaces["test-workspace"];
        })
      );

      expect(result.availableAgents).toContain("agent-1");
      expect(result.availableAgents).toContain("agent-2");
    });

    it("should remove agent from workspace", async () => {
      const result = await runWithWorkspaceManager(
        Effect.gen(function* () {
          const workspaceManager = yield* WorkspaceManager;

          yield* workspaceManager.createWorkspace({
            workspaceId: "test-workspace",
            name: "Test Workspace",
            availableAgents: ["agent-1", "agent-2"],
          });

          yield* workspaceManager.removeAgentFromWorkspace(
            "test-workspace",
            "agent-2"
          );

          const state = yield* workspaceManager.getState();
          return state.workspaces["test-workspace"];
        })
      );

      expect(result.availableAgents).toContain("agent-1");
      expect(result.availableAgents).not.toContain("agent-2");
    });

    it("should prevent removing last agent", async () => {
      await expect(
        runWithWorkspaceManager(
          Effect.gen(function* () {
            const workspaceManager = yield* WorkspaceManager;

            yield* workspaceManager.createWorkspace({
              workspaceId: "test-workspace",
              name: "Test Workspace",
              availableAgents: ["agent-1"],
            });

            yield* workspaceManager.removeAgentFromWorkspace(
              "test-workspace",
              "agent-1"
            );
          })
        )
      ).rejects.toThrow("Workspace must have at least one available agent");
    });
  });
});
