import {
  type WorkspaceEntry,
  WorkspaceManager,
} from "@/managers/workspace-component";
import { ChatApp, Workspace } from "@buddy/schemas";
import { Effect, Ref, Stream } from "effect";
import type { Agent, AppManagerApi, AppManagerState } from "./api";
import {
  AppManagerError,
  ChatAppNotFoundError,
  WorkspaceNotFoundError,
  WorkspaceValidationError,
} from "./errors";
import { WORKSPACE_MANAGER_CONSTANTS } from "./types";

export class AppManager extends Effect.Service<AppManagerApi>()("AppManager", {
  scoped: Effect.gen(function* () {
    // Internal state management with Effect Refs
    const stateRef = yield* Ref.make<AppManagerState>({
      currentWorkspaceId: null,
      workspaces: {},
      chatApps: {},
      agents: {},
      isLoading: false,
      expandedWorkspaces: new Set<string>(),
      lastError: null,
    });

    const listenersRef = yield* Ref.make<Set<(state: AppManagerState) => void>>(
      new Set()
    );

    // Helper function to update state and notify listeners
    const updateState = (
      updater: (state: AppManagerState) => AppManagerState
    ) =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, updater);
        const newState = yield* Ref.get(stateRef);
        const listeners = yield* Ref.get(listenersRef);

        // Notify all listeners
        yield* Effect.forEach(Array.from(listeners), (listener) =>
          Effect.sync(() => listener(newState))
        );
      });

    // Helper function to handle errors
    const handleError = (error: unknown, operation: string) =>
      Effect.gen(function* () {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        yield* updateState((state) => ({
          ...state,
          lastError: `${operation}: ${errorMessage}`,
          isLoading: false,
        }));

        if (error instanceof AppManagerError) {
          return Effect.fail(error);
        }
        return Effect.fail(
          new AppManagerError({
            message: `${operation} failed: ${errorMessage}`,
            cause: error,
          })
        );
      }).pipe(Effect.flatten);

    // State access operations
    const getState = () => Ref.get(stateRef);

    const subscribe = (listener: (state: AppManagerState) => void) =>
      Effect.gen(function* () {
        yield* Ref.update(
          listenersRef,
          (listeners) => new Set([...listeners, listener])
        );

        // Return unsubscribe function
        return () =>
          Effect.gen(function* () {
            yield* Ref.update(listenersRef, (listeners) => {
              const newListeners = new Set(listeners);
              newListeners.delete(listener);
              return newListeners;
            });
          });
      });

    // Workspace operations
    const getCurrentWorkspace = () =>
      Effect.gen(function* () {
        const state = yield* getState();
        if (!state.currentWorkspaceId) return null;
        return state.workspaces[state.currentWorkspaceId] ?? null;
      });

    const getActiveWorkspaces = () =>
      Effect.gen(function* () {
        const state = yield* getState();
        return Object.values(state.workspaces).filter((ws) => !ws.isArchived);
      });

    const setCurrentWorkspace = (id: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[id];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId: id,
              message: `Workspace not found: ${id}`,
            })
          );
        }

        if (workspace.isArchived) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: `Cannot activate archived workspace: ${id}`,
              field: "isArchived",
            })
          );
        }

        yield* updateState((state) => ({
          ...state,
          currentWorkspaceId: id,
          workspaces: {
            ...state.workspaces,
            [id]: {
              ...workspace,
              updatedAt: new Date(),
            },
          },
        }));
      });

    const createWorkspace = (params: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      availableAgents: string[];
    }) =>
      Effect.gen(function* () {
        // Validation
        if (!params.name.trim()) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Workspace name cannot be empty",
              field: "name",
            })
          );
        }

        if (params.availableAgents.length === 0) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Workspace must have at least one available agent",
              field: "availableAgents",
            })
          );
        }

        const now = new Date();
        const workspace: Workspace = {
          id: `workspace-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          name: params.name.trim(),
          description: params.description?.trim(),
          icon: params.icon ?? "📁",
          color: params.color ?? "#3b82f6",
          isArchived: false,
          availableAgents: [...params.availableAgents],
          chatAppIds: [],
          activeAppId: null,
          maxExpandedApps:
            WORKSPACE_MANAGER_CONSTANTS.DEFAULT_MAX_EXPANDED_APPS,
          createdAt: now,
          updatedAt: now,
        };

        yield* updateState((state) => ({
          ...state,
          workspaces: {
            ...state.workspaces,
            [workspace.id]: workspace,
          },
          currentWorkspaceId: state.currentWorkspaceId || workspace.id,
        }));

        return workspace;
      });

    const updateWorkspace = (
      id: string,
      updates: Partial<Omit<Workspace, "id" | "createdAt">>
    ) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[id];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId: id,
              message: `Workspace not found: ${id}`,
            })
          );
        }

        // Validation
        if (updates.name !== undefined && !updates.name.trim()) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Workspace name cannot be empty",
              field: "name",
            })
          );
        }

        if (
          updates.availableAgents !== undefined &&
          updates.availableAgents.length === 0
        ) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Workspace must have at least one available agent",
              field: "availableAgents",
            })
          );
        }

        const updatedWorkspace: Workspace = {
          ...workspace,
          ...updates,
          id, // Ensure ID cannot be changed
          createdAt: workspace.createdAt, // Ensure createdAt cannot be changed
          updatedAt: new Date(),
        };

        yield* updateState((state) => ({
          ...state,
          workspaces: {
            ...state.workspaces,
            [id]: updatedWorkspace,
          },
        }));

        return updatedWorkspace;
      });

    const archiveWorkspace = (id: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[id];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId: id,
              message: `Workspace not found: ${id}`,
            })
          );
        }

        // Check if this is the last active workspace
        const activeWorkspaces = Object.values(state.workspaces).filter(
          (ws) => !ws.isArchived
        );
        if (activeWorkspaces.length <= 1) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Cannot archive the last active workspace",
              field: "isArchived",
            })
          );
        }

        yield* updateState((state) => {
          const updatedWorkspace = {
            ...workspace,
            isArchived: true,
            updatedAt: new Date(),
          };

          // If this was the current workspace, switch to another active one
          let newCurrentWorkspaceId = state.currentWorkspaceId;
          if (state.currentWorkspaceId === id) {
            const otherActiveWorkspaces = Object.values(
              state.workspaces
            ).filter((ws) => !ws.isArchived && ws.id !== id);
            newCurrentWorkspaceId =
              otherActiveWorkspaces.length > 0
                ? otherActiveWorkspaces[0].id
                : null;
          }

          return {
            ...state,
            workspaces: {
              ...state.workspaces,
              [id]: updatedWorkspace,
            },
            currentWorkspaceId: newCurrentWorkspaceId,
          };
        });
      });

    const deleteWorkspace = (id: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[id];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId: id,
              message: `Workspace not found: ${id}`,
            })
          );
        }

        // Check if this is the last workspace
        const allWorkspaces = Object.values(state.workspaces);
        if (allWorkspaces.length <= 1) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Cannot delete the last workspace",
              field: "workspaces",
            })
          );
        }

        yield* updateState((state) => {
          const { [id]: deleted, ...remainingWorkspaces } = state.workspaces;

          // Remove all chat apps from this workspace
          const remainingChatApps = Object.fromEntries(
            Object.entries(state.chatApps).filter(
              ([_, app]) => app.workspaceId !== id
            )
          );

          // If this was the current workspace, switch to another one
          let newCurrentWorkspaceId = state.currentWorkspaceId;
          if (state.currentWorkspaceId === id) {
            const otherWorkspaces = Object.values(remainingWorkspaces);
            newCurrentWorkspaceId =
              otherWorkspaces.length > 0 ? otherWorkspaces[0].id : null;
          }

          return {
            ...state,
            workspaces: remainingWorkspaces,
            chatApps: remainingChatApps,
            currentWorkspaceId: newCurrentWorkspaceId,
          };
        });
      });

    // ChatApp operations
    const getChatAppsInWorkspace = (workspaceId: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[workspaceId];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId,
              message: `Workspace not found: ${workspaceId}`,
            })
          );
        }

        return Object.values(state.chatApps).filter(
          (app) => app.workspaceId === workspaceId
        );
      });

    const addChatAppToWorkspace = (
      workspaceId: string,
      chatApp: Omit<ChatApp, "id" | "workspaceId">
    ) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[workspaceId];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId,
              message: `Workspace not found: ${workspaceId}`,
            })
          );
        }

        // Generate unique id for the chat app
        const id = `chatapp-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newChatApp: ChatApp = {
          ...chatApp,
          id,
          workspaceId,
        };

        yield* updateState((state) => ({
          ...state,
          chatApps: {
            ...state.chatApps,
            [id]: newChatApp,
          },
          workspaces: {
            ...state.workspaces,
            [workspaceId]: {
              ...workspace,
              chatAppIds: [...workspace.chatAppIds, id],
              updatedAt: new Date(),
            },
          },
        }));

        return newChatApp;
      });

    const removeChatAppFromWorkspace = (
      workspaceId: string,
      chatAppId: string
    ) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[workspaceId];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId,
              message: `Workspace not found: ${workspaceId}`,
            })
          );
        }

        const chatApp = state.chatApps[chatAppId];
        if (!chatApp) {
          return yield* Effect.fail(
            new ChatAppNotFoundError({
              appId: chatAppId,
              message: `Chat app not found: ${chatAppId}`,
            })
          );
        }

        // Remove chat app from workspace and from global chatApps
        const updatedWorkspace = {
          ...workspace,
          chatAppIds: workspace.chatAppIds.filter((id) => id !== chatAppId),
          updatedAt: new Date(),
        };

        const { [chatAppId]: _, ...remainingChatApps } = state.chatApps;

        yield* updateState((state) => ({
          ...state,
          workspaces: {
            ...state.workspaces,
            [workspaceId]: updatedWorkspace,
          },
          chatApps: remainingChatApps,
        }));
      });

    const updateChatAppStatus = (
      chatAppId: string,
      status: "stashed" | "compact" | "expanded" | "closed"
    ) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const chatApp = state.chatApps[chatAppId];

        if (!chatApp) {
          return yield* Effect.fail(
            new ChatAppNotFoundError({
              appId: chatAppId,
              message: `Chat app not found: ${chatAppId}`,
            })
          );
        }

        // Business logic for status transitions
        const workspace = state.workspaces[chatApp.workspaceId];
        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId: chatApp.workspaceId,
              message: `Workspace not found: ${chatApp.workspaceId}`,
            })
          );
        }

        // If expanding, check capacity limits
        if (status === "expanded") {
          const expandedApps = Object.values(state.chatApps).filter(
            (app) =>
              app.workspaceId === chatApp.workspaceId &&
              app.status === "expanded"
          );

          if (expandedApps.length >= workspace.maxExpandedApps) {
            return yield* Effect.fail(
              new WorkspaceValidationError({
                message: `Cannot expand: workspace has reached maximum of ${workspace.maxExpandedApps} expanded apps`,
                field: "maxExpandedApps",
              })
            );
          }
        }

        yield* updateState((state) => ({
          ...state,
          chatApps: {
            ...state.chatApps,
            [chatAppId]: {
              ...chatApp,
              status,
              lastActiveAt: new Date(),
            },
          },
        }));
      });

    // Bulk operations
    const loadWorkspacesFromConfig = () =>
      Effect.gen(function* () {
        console.log("[AppManager] loadWorkspacesFromConfig: Starting...");

        // Get workspaces from WorkspaceManager
        const workspaceManager = yield* WorkspaceManager;
        console.log(
          "[AppManager] loadWorkspacesFromConfig: Got WorkspaceManager"
        );

        // First, load workspaces from API
        console.log(
          "[AppManager] loadWorkspacesFromConfig: Loading workspaces from API..."
        );
        yield* workspaceManager.loadWorkspaces();
        console.log(
          "[AppManager] loadWorkspacesFromConfig: Workspaces loaded from API"
        );

        // Now get the active workspaces from the loaded state
        const workspaces = yield* workspaceManager.getActiveWorkspaces();
        console.log(
          "[AppManager] loadWorkspacesFromConfig: Got active workspaces:",
          workspaces.length
        );

        // Update state with loaded workspaces
        yield* updateState((state) => {
          const workspaceMap = workspaces.reduce((acc, workspace) => {
            acc[workspace.id] = workspace;
            return acc;
          }, {} as Record<string, WorkspaceEntry>);

          return {
            ...state,
            workspaces: workspaceMap,
            currentWorkspaceId: workspaces.length > 0 ? workspaces[0].id : null,
          };
        });

        console.log(
          "[AppManager] loadWorkspacesFromConfig: Updated state with",
          workspaces.length,
          "workspaces"
        );
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to load workspaces from config",
              cause,
            })
        )
      );

    const loadChatAppsFromConfig = () =>
      Effect.gen(function* () {
        console.log("[AppManager] loadChatAppsFromConfig: Starting...");
        // Get chat apps from WorkspaceManager state
        console.log(
          "[AppManager] loadChatAppsFromConfig: Getting WorkspaceManager..."
        );
        const workspaceManager = yield* WorkspaceManager;
        console.log(
          "[AppManager] loadChatAppsFromConfig: Getting WorkspaceManager state..."
        );
        const workspaceState = yield* workspaceManager.getState();
        const chatApps = Object.values(workspaceState.chatApps);
        console.log(
          "[AppManager] loadChatAppsFromConfig: Got chat apps:",
          chatApps.length,
          "apps"
        );

        console.log("[AppManager] Loaded chat apps:", chatApps.length);

        // Sync chat apps from WorkspaceManager to AppManager state
        if (chatApps.length > 0) {
          const state = yield* getState();
          const chatAppEntries: Record<string, ChatApp> = {};

          for (const chatApp of chatApps) {
            // Check if chat app already exists in state
            if (state.chatApps[chatApp.id]) {
              console.log(
                `[AppManager] Chat app ${chatApp.id} already exists in state, skipping`
              );
              continue;
            }

            const entry: ChatApp = {
              id: chatApp.id,
              workspaceId: chatApp.workspaceId,
              status: chatApp.status,
              isArchived: chatApp.isArchived,
              lastActiveAt: chatApp.lastActiveAt,
              config: chatApp.config,
            };
            chatAppEntries[chatApp.id] = entry;
          }

          // Only update state if we have new chat apps to add
          if (Object.keys(chatAppEntries).length > 0) {
            // Update state with new chat apps
            yield* updateState((state) => {
              // Add chat apps to state
              const newState = {
                ...state,
                chatApps: { ...state.chatApps, ...chatAppEntries },
              };

              // Also add chat app IDs to their respective workspaces
              const updatedWorkspaces = { ...newState.workspaces };
              for (const chatApp of Object.values(chatAppEntries)) {
                const workspace = updatedWorkspaces[chatApp.workspaceId];
                if (workspace && !workspace.chatAppIds.includes(chatApp.id)) {
                  updatedWorkspaces[chatApp.workspaceId] = {
                    ...workspace,
                    chatAppIds: [...workspace.chatAppIds, chatApp.id],
                  };
                }
              }

              return {
                ...newState,
                workspaces: updatedWorkspaces,
              };
            });

            console.log(
              "[AppManager] Added",
              Object.keys(chatAppEntries).length,
              "new chat apps to AppManager state"
            );
          } else {
            console.log(
              "[AppManager] No new chat apps to add - all already exist in state"
            );
          }
        }
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to load chat apps from config",
              cause,
            })
        )
      );

    // Utility operations
    const ensureDefaultWorkspace = () =>
      Effect.gen(function* () {
        const state = yield* getState();
        const activeWorkspaces = Object.values(state.workspaces).filter(
          (ws) => !ws.isArchived
        );

        if (activeWorkspaces.length === 0) {
          return yield* createWorkspace({
            name: "Default Workspace",
            description: "Your default workspace",
            icon: "🏠",
            color: "#3b82f6",
            availableAgents: ["default-agent"],
          });
        }

        return activeWorkspaces[0];
      });

    // NOTE: AppManager does not own agent or chat app state. It only stores IDs and queries the owning manager for details.

    // Example selector: getWorkspaceStats now only returns counts of IDs
    const getWorkspaceStats = (workspaceId: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const workspace = state.workspaces[workspaceId];

        if (!workspace) {
          return yield* Effect.fail(
            new WorkspaceNotFoundError({
              workspaceId,
              message: `Workspace not found: ${workspaceId}`,
            })
          );
        }

        // Compute stats from chatApps in this workspace
        const chatApps = workspace.chatAppIds
          .map((id) => state.chatApps[id])
          .filter(Boolean);
        const totalChatApps = chatApps.length;
        const activeChatApps = chatApps.filter(
          (app) =>
            app.status === "expanded" ||
            app.status === "compact" ||
            app.status === "stashed"
        ).length;
        const expandedChatApps = chatApps.filter(
          (app) => app.status === "expanded"
        ).length;

        return {
          totalChatApps,
          activeChatApps,
          expandedChatApps,
        };
      });

    // UI state operations
    const toggleWorkspaceExpanded = (workspaceId: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const isExpanded = state.expandedWorkspaces.has(workspaceId);

        yield* updateState((state) => ({
          ...state,
          expandedWorkspaces: isExpanded
            ? new Set(
                [...state.expandedWorkspaces].filter((id) => id !== workspaceId)
              )
            : new Set([...state.expandedWorkspaces, workspaceId]),
        }));
      });

    const setWorkspaceExpanded = (workspaceId: string, expanded: boolean) =>
      Effect.gen(function* () {
        yield* updateState((state) => ({
          ...state,
          expandedWorkspaces: expanded
            ? new Set([...state.expandedWorkspaces, workspaceId])
            : new Set(
                [...state.expandedWorkspaces].filter((id) => id !== workspaceId)
              ),
        }));
      });

    // Data loading operations
    const loadInitialData = () =>
      Effect.gen(function* () {
        console.log("[AppManager] Starting loadInitialData...");

        // Start loading
        yield* updateState((state) => ({ ...state, isLoading: true }));
        console.log("[AppManager] Set loading state to true");

        // Load workspaces first
        console.log("[AppManager] Loading workspaces from config...");
        yield* loadWorkspacesFromConfig();
        console.log("[AppManager] ✅ Workspaces loaded successfully");

        // Load chat apps
        console.log("[AppManager] Loading chat apps from config...");
        yield* loadChatAppsFromConfig();
        console.log("[AppManager] ✅ Chat apps loaded successfully");

        // Load agents
        console.log("[AppManager] Refreshing agents...");
        yield* refreshAgents();
        console.log("[AppManager] ✅ Agents loaded successfully");

        // Ensure we have at least one workspace
        console.log("[AppManager] Ensuring default workspace...");
        yield* ensureDefaultWorkspace();
        console.log("[AppManager] ✅ Default workspace ensured");

        // Finish loading
        console.log("[AppManager] Setting loading state to false...");
        yield* updateState((state) => ({
          ...state,
          isLoading: false,
          lastError: null,
        }));
        console.log("[AppManager] ✅ loadInitialData completed successfully");
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to load initial data",
              cause,
            })
        ),
        Effect.tap(() =>
          updateState((state) => ({
            ...state,
            isLoading: false,
            lastError: "Failed to load initial data",
          }))
        )
      );

    const refreshWorkspaces = () =>
      Effect.gen(function* () {
        // TODO: Implement actual workspace refresh from external source
        // For now, just clear loading state
        yield* updateState((state) => ({
          ...state,
          lastError: null,
        }));
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to refresh workspaces",
              cause,
            })
        )
      );

    const refreshChatApps = () =>
      Effect.gen(function* () {
        // TODO: Implement actual chat app refresh from external source
        yield* updateState((state) => ({
          ...state,
          lastError: null,
        }));
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to refresh chat apps",
              cause,
            })
        )
      );

    const refreshAgents = () =>
      Effect.gen(function* () {
        console.log("[AppManager] refreshAgents: Starting...");

        // For now, just ensure we have a default agent
        // In the future, this could get agents from WorkspaceManager
        // or from a dedicated agent service
        const state = yield* getState();
        const agentsMap: Record<string, Agent> = { ...state.agents };

        // If no agents exist, add default agent
        if (Object.keys(agentsMap).length === 0) {
          console.log(
            "[AppManager] refreshAgents: No agents found, adding default agent"
          );
          const defaultAgent: Agent = {
            id: "default-agent",
            name: "Default Assistant",
            avatar: "🤖",
            description: "A helpful AI assistant",
          };
          agentsMap["default-agent"] = defaultAgent;

          yield* updateState((state) => ({
            ...state,
            agents: agentsMap,
            lastError: null,
          }));
        }

        console.log(
          "[AppManager] refreshAgents: Successfully ensured",
          Object.keys(agentsMap).length,
          "agents"
        );
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AppManagerError({
              message: "Failed to refresh agents",
              cause,
            })
        )
      );

    // Selectors (computed state)
    const getActiveChatApp = () =>
      Effect.gen(function* () {
        const state = yield* getState();
        const currentWorkspace = yield* getCurrentWorkspace();

        if (!currentWorkspace || !currentWorkspace.activeAppId) {
          return null;
        }

        return state.chatApps[currentWorkspace.activeAppId] ?? null;
      });

    const getStashedChatApps = (workspaceId: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        return Object.values(state.chatApps).filter(
          (app) => app.workspaceId === workspaceId && app.status === "stashed"
        );
      });

    // Agent operations
    const addAgent = (agent: Omit<Agent, "id">) =>
      Effect.gen(function* () {
        // Validation
        if (!agent.name || !agent.name.trim()) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Agent name cannot be empty",
              field: "name",
            })
          );
        }

        const id = `agent-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newAgent: Agent = {
          id,
          name: agent.name.trim(),
          avatar: agent.avatar,
          description: agent.description,
        };

        yield* updateState((state) => ({
          ...state,
          agents: {
            ...(state.agents ?? {}),
            [id]: newAgent,
          },
        }));

        return newAgent;
      });

    const updateAgent = (
      agentId: string,
      updates: Partial<Pick<Agent, "name" | "avatar" | "description">>
    ) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const agent = state.agents?.[agentId];
        if (!agent) {
          return yield* Effect.fail(
            new (require("./errors").AgentNotFoundError)({
              agentId,
              message: `Agent not found: ${agentId}`,
            })
          );
        }
        if (updates.name !== undefined && !updates.name.trim()) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: "Agent name cannot be empty",
              field: "name",
            })
          );
        }
        const updatedAgent: Agent = {
          ...agent,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : agent.name,
        };
        yield* updateState((state) => ({
          ...state,
          agents: {
            ...state.agents,
            [agentId]: updatedAgent,
          },
        }));
        return updatedAgent;
      });

    const removeAgent = (agentId: string) =>
      Effect.gen(function* () {
        const state = yield* getState();
        const agent = state.agents?.[agentId];
        if (!agent) {
          return yield* Effect.fail(
            new (require("./errors").AgentNotFoundError)({
              agentId,
              message: `Agent not found: ${agentId}`,
            })
          );
        }
        // Check if agent is used in any workspace
        const usedInWorkspace = Object.values(state.workspaces).some((ws) =>
          ws.availableAgents.includes(agentId)
        );
        if (usedInWorkspace) {
          return yield* Effect.fail(
            new WorkspaceValidationError({
              message: `Cannot remove agent: agent is used in a workspace`,
              field: "availableAgents",
            })
          );
        }
        const { [agentId]: _, ...remainingAgents } = state.agents;
        yield* updateState((state) => ({
          ...state,
          agents: remainingAgents,
        }));
        return;
      });

    // Return the complete service API
    return {
      getState,
      subscribe,
      getCurrentWorkspace,
      getActiveWorkspaces,
      setCurrentWorkspace,
      createWorkspace,
      updateWorkspace,
      archiveWorkspace,
      deleteWorkspace,
      getChatAppsInWorkspace,
      addChatAppToWorkspace,
      removeChatAppFromWorkspace,
      updateChatAppStatus,
      loadWorkspacesFromConfig,
      loadChatAppsFromConfig,
      ensureDefaultWorkspace,
      getWorkspaceStats,
      addAgent,
      updateAgent,
      removeAgent,
      toggleWorkspaceExpanded,
      setWorkspaceExpanded,
      loadInitialData,
      refreshWorkspaces,
      refreshChatApps,
      refreshAgents,
      getActiveChatApp,
      getStashedChatApps,
    } satisfies AppManagerApi;
  }),
  dependencies: [WorkspaceManager.Default],
}) {}
