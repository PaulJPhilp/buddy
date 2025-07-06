import { AgentManager } from "@/managers/agent-manager";
import { ChatAppsManager } from "@/managers/chat-apps-manager";
import { Effect, Ref } from "effect";
import { UrlService } from "../../services/url";
import type { WorkspaceManagerApi } from "./api";
import {
  ChatAppCapacityError,
  ChatAppNotFoundError,
  ChatAppStateError,
  ChatAppValidationError,
  FocusModeError,
  WorkspaceCapacityError,
  WorkspaceIntegrityError,
  WorkspaceLoadError,
  WorkspaceNotFoundError,
  WorkspaceStateError,
  WorkspaceValidationError,
} from "./errors";
import type {
  ChatAppConfig,
  ChatAppEntry,
  ChatAppStatus,
  CreateWorkspaceParams,
  LayoutPreferences,
  UpdateWorkspaceParams,
  WorkspaceEntry,
  WorkspaceState,
  WorkspaceStats,
} from "./types";
import {
  DEFAULT_WORKSPACE_STATE,
  WORKSPACE_CONSTANTS,
  createDefaultWorkspace,
  ensureAtLeastOneWorkspace,
  getActiveWorkspaces,
  getFirstActiveWorkspaceId,
  isValidAvailableAgents,
  isValidMaxExpandedApps,
  isValidWorkspaceColor,
  isValidWorkspaceName,
} from "./types";

export class WorkspaceComponent extends Effect.Service<WorkspaceComponentApi>()(
  "WorkspaceComponent",
  {
    scoped: Effect.gen(function* () {
      const instanceId = Math.random().toString(36).substring(7);
      console.log(`[WorkspaceManager] Creating SCOPED instance: ${instanceId}`);

      // Get dependencies
      const configService = yield* UrlService;

      // Initialize state management
      const stateRef = yield* Ref.make<WorkspaceState>(DEFAULT_WORKSPACE_STATE);
      const listenersRef = yield* Ref.make<
        Set<(state: WorkspaceState) => void>
      >(new Set());

      console.log(
        `[WorkspaceManager:${instanceId}] SINGLETON state refs initialized`
      );

      // Helper function to update state and notify listeners
      const updateState = (
        updater: (state: WorkspaceState) => WorkspaceState
      ) =>
        Effect.gen(function* () {
          const newState = yield* Ref.modify(stateRef, (state) => {
            const updated = updater(state);
            return [updated, updated] as const;
          });
          const listeners = yield* Ref.get(listenersRef);
          yield* Effect.forEach(listeners, (listener) =>
            Effect.sync(() => listener(newState))
          );
          return newState;
        });

      // Validation helpers
      const validateWorkspaceExists = (
        workspaceId: string,
        state: WorkspaceState
      ) =>
        Effect.gen(function* () {
          if (!state.workspaces[workspaceId]) {
            yield* Effect.fail(
              new WorkspaceNotFoundError({
                workspaceId,
                message: `Workspace with id '${workspaceId}' not found`,
              })
            );
          }
          return state.workspaces[workspaceId];
        });

      const validateChatAppExists = (appId: string, state: WorkspaceState) =>
        Effect.gen(function* () {
          if (!state.chatApps[appId]) {
            yield* Effect.fail(
              new ChatAppNotFoundError({
                appId,
                message: `Chat app with id '${appId}' not found`,
              })
            );
          }
          return state.chatApps[appId];
        });

      const validateWorkspaceCapacity = (
        currentCount: number,
        operation: string
      ) =>
        Effect.gen(function* () {
          if (currentCount >= WORKSPACE_CONSTANTS.MAX_WORKSPACES) {
            yield* Effect.fail(
              new WorkspaceCapacityError({
                limit: WORKSPACE_CONSTANTS.MAX_WORKSPACES,
                current: currentCount,
                operation,
                message: `Cannot ${operation}: maximum ${WORKSPACE_CONSTANTS.MAX_WORKSPACES} workspaces allowed`,
              })
            );
          }
        });

      // State access methods
      const getState = () => {
        console.log(`[WorkspaceManager:${instanceId}] getState() called`);
        return Ref.get(stateRef);
      };

      const subscribe = (listener: (state: WorkspaceState) => void) =>
        Effect.gen(function* () {
          yield* Ref.update(listenersRef, (listeners) => {
            const newListeners = new Set(listeners);
            newListeners.add(listener);
            return newListeners;
          });

          // Return unsubscribe function that runs the Effect
          return () =>
            Effect.gen(function* () {
              yield* Ref.update(listenersRef, (listeners) => {
                const newListeners = new Set(listeners);
                newListeners.delete(listener);
                return newListeners;
              });
            });
        });

      // Workspace management methods
      const createWorkspace = (params: CreateWorkspaceParams) =>
        Effect.gen(function* () {
          console.log(
            `[WorkspaceManager:${instanceId}] createWorkspace() called with:`,
            params
          );

          // Validation
          if (!isValidWorkspaceName(params.name)) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "name",
                value: params.name,
                message: "Workspace name must be between 1 and 100 characters",
              })
            );
          }

          if (params.color && !isValidWorkspaceColor(params.color)) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "color",
                value: params.color,
                message:
                  "Workspace color must be a valid hex color (e.g., #ff0000)",
              })
            );
          }

          if (!isValidAvailableAgents(params.availableAgents)) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "availableAgents",
                value: params.availableAgents,
                message: "Workspace must have at least one available agent",
              })
            );
          }

          const newState = yield* updateState((state) => {
            // Check if workspace already exists
            if (state.workspaces[params.workspaceId]) {
              return state;
            }

            // Check capacity - count all workspaces (no more placeholder filtering)
            const workspaceCount = Object.keys(state.workspaces).length;
            if (workspaceCount >= WORKSPACE_CONSTANTS.MAX_WORKSPACES) {
              return state;
            }

            const now = new Date();
            const newWorkspace: WorkspaceEntry = {
              id: params.workspaceId,
              name: params.name,
              color:
                params.color ?? WORKSPACE_CONSTANTS.DEFAULT_WORKSPACE_COLOR,
              description: params.description ?? "",
              icon: params.icon ?? "📁",
              createdAt: now,
              lastActiveAt: now,
              isArchived: false,
              maxExpandedApps: WORKSPACE_CONSTANTS.DEFAULT_MAX_EXPANDED_APPS,
              activeAppId: null,
              availableAgents: params.availableAgents,
              chatAppIds: [],
            };

            const newWorkspaces = { ...state.workspaces };
            newWorkspaces[params.workspaceId] = newWorkspace;

            return {
              ...state,
              workspaces: newWorkspaces,
              currentWorkspaceId: params.workspaceId, // Set as current workspace
            };
          });

          // Validate the workspace was created
          const workspace = newState.workspaces[params.workspaceId];
          if (!workspace) {
            const workspaceCount = Object.keys(newState.workspaces).length;
            yield* Effect.fail(
              new WorkspaceCapacityError({
                limit: WORKSPACE_CONSTANTS.MAX_WORKSPACES,
                current: workspaceCount,
                operation: "create workspace",
                message: `Cannot create workspace: maximum ${WORKSPACE_CONSTANTS.MAX_WORKSPACES} workspaces allowed`,
              })
            );
          }

          return workspace;
        });

      const updateWorkspace = (
        workspaceId: string,
        updates: UpdateWorkspaceParams
      ) =>
        Effect.gen(function* () {
          // Validation
          if (updates.name && !isValidWorkspaceName(updates.name)) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "name",
                value: updates.name,
                message: "Workspace name must be between 1 and 100 characters",
              })
            );
          }

          if (updates.color && !isValidWorkspaceColor(updates.color)) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "color",
                value: updates.color,
                message:
                  "Workspace color must be a valid hex color (e.g., #ff0000)",
              })
            );
          }

          if (
            updates.availableAgents &&
            !isValidAvailableAgents(updates.availableAgents)
          ) {
            yield* Effect.fail(
              new WorkspaceValidationError({
                field: "availableAgents",
                value: updates.availableAgents,
                message: "Workspace must have at least one available agent",
              })
            );
          }

          const newState = yield* updateState((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) {
              return state;
            }

            const updatedWorkspace: WorkspaceEntry = {
              ...workspace,
              ...updates,
              lastActiveAt: new Date(),
            };

            return {
              ...state,
              workspaces: {
                ...state.workspaces,
                [workspaceId]: updatedWorkspace,
              },
            };
          });

          const workspace = newState.workspaces[workspaceId];
          if (!workspace) {
            yield* Effect.fail(
              new WorkspaceNotFoundError({
                workspaceId,
                message: `Workspace with id '${workspaceId}' not found`,
              })
            );
          }

          return workspace;
        });

      const deleteWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateWorkspaceExists(workspaceId, state);

          // Cannot delete the last workspace
          const workspaceCount = Object.keys(state.workspaces).length;
          if (workspaceCount <= 1) {
            yield* Effect.fail(
              new WorkspaceStateError({
                operation: "delete workspace",
                workspaceId,
                message:
                  "Cannot delete workspace: at least 1 workspace must remain",
              })
            );
          }

          yield* updateState((state) => {
            const newWorkspaces = { ...state.workspaces };
            const newChatApps = { ...state.chatApps };

            // Remove all chat apps in this workspace
            const workspace = state.workspaces[workspaceId];
            if (workspace) {
              workspace.chatAppIds.forEach((appId) => {
                delete newChatApps[appId];
              });
            }

            delete newWorkspaces[workspaceId];

            // If this was the current workspace, switch to another
            let newCurrentWorkspaceId = state.currentWorkspaceId;
            if (state.currentWorkspaceId === workspaceId) {
              newCurrentWorkspaceId = getFirstActiveWorkspaceId(newWorkspaces);
            }

            return {
              ...state,
              workspaces: newWorkspaces,
              chatApps: newChatApps,
              currentWorkspaceId: newCurrentWorkspaceId,
            };
          });
        });

      const archiveWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateWorkspaceExists(workspaceId, state);

          // Cannot archive the last active workspace
          const activeWorkspaces = getActiveWorkspaces(state.workspaces);
          if (activeWorkspaces.length <= 1) {
            yield* Effect.fail(
              new WorkspaceStateError({
                operation: "archive workspace",
                workspaceId,
                message:
                  "Cannot archive workspace: at least 1 active workspace must remain",
              })
            );
          }

          yield* updateState((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace || workspace.isArchived) {
              return state;
            }

            const updatedWorkspace: WorkspaceEntry = {
              ...workspace,
              isArchived: true,
              lastActiveAt: new Date(),
            };

            // If this was the current workspace, switch to another
            let newCurrentWorkspaceId = state.currentWorkspaceId;
            if (state.currentWorkspaceId === workspaceId) {
              const remainingWorkspaces = { ...state.workspaces };
              remainingWorkspaces[workspaceId] = updatedWorkspace;
              newCurrentWorkspaceId =
                getFirstActiveWorkspaceId(remainingWorkspaces);
            }

            return {
              ...state,
              workspaces: {
                ...state.workspaces,
                [workspaceId]: updatedWorkspace,
              },
              currentWorkspaceId: newCurrentWorkspaceId,
            };
          });
        });

      const restoreWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateWorkspaceExists(workspaceId, state);

          // Check capacity for unarchiving
          const activeWorkspaces = getActiveWorkspaces(state.workspaces);
          if (activeWorkspaces.length >= WORKSPACE_CONSTANTS.MAX_WORKSPACES) {
            yield* Effect.fail(
              new WorkspaceCapacityError({
                limit: WORKSPACE_CONSTANTS.MAX_WORKSPACES,
                current: activeWorkspaces.length,
                operation: "restore workspace",
                message: `Cannot restore workspace: maximum ${WORKSPACE_CONSTANTS.MAX_WORKSPACES} active workspaces allowed`,
              })
            );
          }

          yield* updateState((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace || !workspace.isArchived) {
              return state;
            }

            const updatedWorkspace: WorkspaceEntry = {
              ...workspace,
              isArchived: false,
              lastActiveAt: new Date(),
            };

            return {
              ...state,
              workspaces: {
                ...state.workspaces,
                [workspaceId]: updatedWorkspace,
              },
            };
          });
        });

      const setActiveWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateWorkspaceExists(workspaceId, state);

          // Cannot activate archived workspace
          const workspace = state.workspaces[workspaceId];
          if (workspace.isArchived) {
            yield* Effect.fail(
              new WorkspaceStateError({
                operation: "set active workspace",
                workspaceId,
                message: "Cannot activate archived workspace",
              })
            );
          }

          yield* updateState((state) => {
            const updatedWorkspace = {
              ...state.workspaces[workspaceId],
              lastActiveAt: new Date(),
            };

            return {
              ...state,
              currentWorkspaceId: workspaceId,
              workspaces: {
                ...state.workspaces,
                [workspaceId]: updatedWorkspace,
              },
            };
          });
        });

      // Chat app management methods
      const addChatApp = (
        workspaceId: string,
        appId: string,
        config: ChatAppConfig
      ) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateWorkspaceExists(workspaceId, state);

          // Check if chat app already exists
          if (state.chatApps[appId]) {
            yield* Effect.fail(
              new ChatAppValidationError({
                appId,
                field: "id",
                value: appId,
                message: `Chat app with id '${appId}' already exists`,
              })
            );
          }

          const newState = yield* updateState((state) => {
            const workspace = state.workspaces[workspaceId];
            if (!workspace) {
              return state;
            }

            const now = new Date();
            const newChatApp: ChatAppEntry = {
              id: appId,
              workspaceId,
              status: "compact",
              isArchived: false,
              lastActiveAt: now,
              config,
            };

            const updatedWorkspace: WorkspaceEntry = {
              ...workspace,
              chatAppIds: [...workspace.chatAppIds, appId],
              lastActiveAt: now,
            };

            return {
              ...state,
              workspaces: {
                ...state.workspaces,
                [workspaceId]: updatedWorkspace,
              },
              chatApps: {
                ...state.chatApps,
                [appId]: newChatApp,
              },
            };
          });

          const chatApp = newState.chatApps[appId];
          if (!chatApp) {
            yield* Effect.fail(
              new ChatAppStateError({
                appId,
                workspaceId,
                operation: "add chat app",
                message: "Failed to add chat app to workspace",
              })
            );
          }

          return chatApp;
        });

      // Continue with more methods... (this is getting quite long, let me continue in parts)
      const updateChatApp = (appId: string, updates: Partial<ChatAppConfig>) =>
        Effect.gen(function* () {
          const state = yield* getState();
          yield* validateChatAppExists(appId, state);

          const newState = yield* updateState((state) => {
            const chatApp = state.chatApps[appId];
            if (!chatApp) {
              return state;
            }

            const updatedChatApp: ChatAppEntry = {
              ...chatApp,
              config: {
                ...chatApp.config,
                ...updates,
              },
              lastActiveAt: new Date(),
            };

            return {
              ...state,
              chatApps: {
                ...state.chatApps,
                [appId]: updatedChatApp,
              },
            };
          });

          const chatApp = newState.chatApps[appId];
          if (!chatApp) {
            yield* Effect.fail(
              new ChatAppNotFoundError({
                appId,
                message: `Chat app with id '${appId}' not found`,
              })
            );
          }

          return chatApp;
        });

      const removeChatApp = (appId: string) =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatApp = yield* validateChatAppExists(appId, state);

          yield* updateState((state) => {
            const chatApp = state.chatApps[appId];
            if (!chatApp) {
              return state;
            }

            const workspace = state.workspaces[chatApp.workspaceId];
            if (!workspace) {
              return state;
            }

            // Remove from workspace's chat app list
            const updatedWorkspace: WorkspaceEntry = {
              ...workspace,
              chatAppIds: workspace.chatAppIds.filter((id) => id !== appId),
              activeAppId:
                workspace.activeAppId === appId ? null : workspace.activeAppId,
              lastActiveAt: new Date(),
            };

            // Remove from chat apps
            const newChatApps = { ...state.chatApps };
            delete newChatApps[appId];

            return {
              ...state,
              workspaces: {
                ...state.workspaces,
                [chatApp.workspaceId]: updatedWorkspace,
              },
              chatApps: newChatApps,
            };
          });
        });

      const setChatAppStatus = (appId: string, status: ChatAppStatus) =>
        Effect.gen(function* () {
          const state = yield* getState();
          const chatApp = yield* validateChatAppExists(appId, state);

          yield* updateState((state) => {
            const chatApp = state.chatApps[appId];
            if (!chatApp) {
              return state;
            }

            const updatedChatApp: ChatAppEntry = {
              ...chatApp,
              status,
              lastActiveAt: new Date(),
            };

            return {
              ...state,
              chatApps: {
                ...state.chatApps,
                [appId]: updatedChatApp,
              },
            };
          });
        });

      // I'll implement the remaining methods in a more concise way to fit the response limit
      // Loading state methods
      const setLoading = (isLoading: boolean) =>
        updateState((state) => ({ ...state, isLoading }));

      const startLoading = () => setLoading(true);
      const finishLoading = () => setLoading(false);
      const failLoading = (error: unknown) =>
        Effect.gen(function* () {
          yield* setLoading(false);
          // Could log error here if needed
        });

      // Utility methods
      const reset = () => updateState(() => DEFAULT_WORKSPACE_STATE);

      const loadWorkspaces = () =>
        Effect.gen(function* () {
          console.log(
            `[WorkspaceManager:${instanceId}] Loading workspaces from API...`
          );

          yield* setLoading(true);

          try {
            // Build API URL using UrlService
            const baseUrl = yield* configService.getBaseUrl;
            console.log(
              `[WorkspaceManager:${instanceId}] Base URL from config:`,
              baseUrl
            );

            const apiUrl = yield* configService.buildApiUrl("/api/workspace");
            console.log(
              `[WorkspaceManager:${instanceId}] Fetching from URL: ${apiUrl}`
            );

            // Fetch workspaces from API
            const response = yield* Effect.tryPromise({
              try: () => fetch(apiUrl),
              catch: (error) =>
                new WorkspaceLoadError({
                  source: "api",
                  operation: "fetch workspaces",
                  message: "Failed to fetch workspaces from API",
                  cause: error,
                }),
            });

            if (!response.ok) {
              yield* Effect.fail(
                new WorkspaceLoadError({
                  source: "api",
                  operation: "fetch workspaces",
                  message: `API returned ${response.status}: ${response.statusText}`,
                })
              );
            }

            const workspaces = yield* Effect.tryPromise({
              try: () => response.json() as Promise<WorkspaceEntry[]>,
              catch: (error) =>
                new WorkspaceLoadError({
                  source: "api",
                  operation: "parse workspaces",
                  message: "Failed to parse workspace data from API",
                  cause: error,
                }),
            });

            console.log(
              `[WorkspaceManager:${instanceId}] Loaded ${workspaces.length} workspaces from API`
            );

            // Update state with loaded workspaces
            yield* updateState((state) => {
              const workspaceMap = workspaces.reduce((acc, workspace) => {
                acc[workspace.id] = workspace;
                return acc;
              }, {} as Record<string, WorkspaceEntry>);

              const currentWorkspaceId =
                getFirstActiveWorkspaceId(workspaceMap);

              return {
                ...state,
                workspaces: workspaceMap,
                currentWorkspaceId,
                isLoading: false,
              };
            });

            console.log(
              `[WorkspaceManager:${instanceId}] Workspaces loaded successfully`
            );
            return workspaces;
          } catch (error) {
            yield* setLoading(false);
            throw error;
          }
        });

      const ensureDefaultWorkspace = () =>
        updateState((state) => ({
          ...state,
          workspaces: ensureAtLeastOneWorkspace(state.workspaces),
        }));

      // Computed state helpers
      const getCurrentWorkspace = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.currentWorkspaceId
            ? state.workspaces[state.currentWorkspaceId] ?? null
            : null;
        });

      const getActiveWorkspacesList = () =>
        Effect.gen(function* () {
          const state = yield* getState();
          return getActiveWorkspaces(state.workspaces);
        });

      // Return the complete API implementation
      return {
        instanceId,
        getState,
        subscribe,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        archiveWorkspace,
        restoreWorkspace,
        setActiveWorkspace,
        addChatApp,
        updateChatApp,
        removeChatApp,
        setChatAppStatus,
        setActiveChatApp: (workspaceId: string, appId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            yield* validateWorkspaceExists(workspaceId, state);
            yield* validateChatAppExists(appId, state);

            yield* updateState((state) => {
              const workspace = state.workspaces[workspaceId];
              if (!workspace) return state;

              return {
                ...state,
                workspaces: {
                  ...state.workspaces,
                  [workspaceId]: {
                    ...workspace,
                    activeAppId: appId,
                    lastActiveAt: new Date(),
                  },
                },
              };
            });
          }),
        archiveChatApp: (appId: string) => setChatAppStatus(appId, "closed"),
        restoreChatApp: (appId: string) => setChatAppStatus(appId, "compact"),
        expandChatApp: (appId: string) => setChatAppStatus(appId, "expanded"),
        compactChatApp: (appId: string) => setChatAppStatus(appId, "compact"),
        stashChatApp: (appId: string) => setChatAppStatus(appId, "stashed"),
        closeChatApp: (appId: string) => setChatAppStatus(appId, "closed"),
        loadWorkspaces: loadWorkspaces,
        loadChatApps: (apps: ChatAppEntry[]) =>
          updateState((state) => {
            const chatAppMap = apps.reduce((acc, app) => {
              acc[app.id] = app;
              return acc;
            }, {} as Record<string, ChatAppEntry>);
            return {
              ...state,
              chatApps: chatAppMap,
            };
          }),
        addMultipleChatApps: (
          apps: Array<{ workspaceId: string; config: ChatAppConfig }>
        ) =>
          Effect.forEach(apps, (item) =>
            addChatApp(item.workspaceId, item.config.id, item.config)
          ).pipe(Effect.asVoid),
        updateLayoutPreferences: (
          workspaceId: string,
          preferences: LayoutPreferences
        ) =>
          updateWorkspace(workspaceId, { layoutPreferences: preferences }).pipe(
            Effect.asVoid
          ),
        setMaxExpandedApps: (workspaceId: string, maxApps: number) =>
          Effect.gen(function* () {
            if (!isValidMaxExpandedApps(maxApps)) {
              yield* Effect.fail(
                new WorkspaceValidationError({
                  field: "maxExpandedApps",
                  value: maxApps,
                  message: `maxExpandedApps must be at least ${WORKSPACE_CONSTANTS.MIN_EXPANDED_APPS}`,
                })
              );
            }
            yield* updateWorkspace(workspaceId, {
              maxExpandedApps: maxApps,
            }).pipe(Effect.asVoid);
          }),
        addAgentToWorkspace: (workspaceId: string, agentId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            const workspace = yield* validateWorkspaceExists(
              workspaceId,
              state
            );

            if (workspace.availableAgents.includes(agentId)) {
              return; // Already exists
            }

            yield* updateWorkspace(workspaceId, {
              availableAgents: [...workspace.availableAgents, agentId],
            });
          }),
        removeAgentFromWorkspace: (workspaceId: string, agentId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            const workspace = yield* validateWorkspaceExists(
              workspaceId,
              state
            );

            const newAgents = workspace.availableAgents.filter(
              (id) => id !== agentId
            );
            if (newAgents.length < WORKSPACE_CONSTANTS.MIN_AVAILABLE_AGENTS) {
              yield* Effect.fail(
                new WorkspaceValidationError({
                  field: "availableAgents",
                  value: newAgents,
                  message: "Workspace must have at least one available agent",
                })
              );
            }

            yield* updateWorkspace(workspaceId, { availableAgents: newAgents });
          }),
        updateWorkspaceAgents: (workspaceId: string, agentIds: string[]) =>
          updateWorkspace(workspaceId, { availableAgents: agentIds }).pipe(
            Effect.asVoid
          ),
        enterFocusMode: (workspaceId: string, appId: string) =>
          Effect.gen(function* () {
            // Implementation for focus mode - stash other apps, expand target
            const state = yield* getState();
            yield* validateWorkspaceExists(workspaceId, state);
            yield* validateChatAppExists(appId, state);

            // Store previous states and set focus mode
            yield* updateState((state) => {
              const workspace = state.workspaces[workspaceId];
              if (!workspace) return state;

              const updatedChatApps = { ...state.chatApps };

              // Stash all other apps in this workspace, storing their previous status
              workspace.chatAppIds.forEach((id) => {
                if (id !== appId && updatedChatApps[id]) {
                  const app = updatedChatApps[id];
                  if (app.status === "expanded" || app.status === "compact") {
                    updatedChatApps[id] = {
                      ...app,
                      previousStatus: app.status as "expanded" | "compact",
                      status: "stashed",
                    };
                  }
                }
              });

              // Expand the focus app
              if (updatedChatApps[appId]) {
                updatedChatApps[appId] = {
                  ...updatedChatApps[appId],
                  status: "expanded",
                };
              }

              return {
                ...state,
                chatApps: updatedChatApps,
                workspaces: {
                  ...state.workspaces,
                  [workspaceId]: {
                    ...workspace,
                    activeAppId: appId,
                  },
                },
              };
            });
          }),
        exitFocusMode: (workspaceId: string) =>
          Effect.gen(function* () {
            // Restore previous states of stashed apps
            const state = yield* getState();
            yield* validateWorkspaceExists(workspaceId, state);

            yield* updateState((state) => {
              const workspace = state.workspaces[workspaceId];
              if (!workspace) return state;

              const updatedChatApps = { ...state.chatApps };

              // Restore previous states
              workspace.chatAppIds.forEach((id) => {
                const app = updatedChatApps[id];
                if (app && app.status === "stashed" && app.previousStatus) {
                  updatedChatApps[id] = {
                    ...app,
                    status: app.previousStatus,
                    previousStatus: undefined,
                  };
                }
              });

              return {
                ...state,
                chatApps: updatedChatApps,
              };
            });
          }),
        setLoading,
        startLoading,
        finishLoading,
        failLoading,
        reset,
        ensureDefaultWorkspace,
        getWorkspaceStats: () =>
          Effect.gen(function* () {
            const state = yield* getState();
            const totalWorkspaces = Object.keys(state.workspaces).length;
            const activeWorkspaces = getActiveWorkspaces(
              state.workspaces
            ).length;
            const totalChatApps = Object.keys(state.chatApps).length;
            const activeChatApps = Object.values(state.chatApps).filter(
              (app) => !app.isArchived
            ).length;

            return {
              workspaces: {
                total: totalWorkspaces,
                active: activeWorkspaces,
                archived: totalWorkspaces - activeWorkspaces,
              },
              chatApps: {
                total: totalChatApps,
                active: activeChatApps,
                archived: totalChatApps - activeChatApps,
              },
            };
          }),
        getCurrentWorkspace,
        getActiveWorkspaces: getActiveWorkspacesList,
        getChatAppsForWorkspace: (workspaceId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return [];

            return workspace.chatAppIds
              .map((id) => state.chatApps[id])
              .filter((app) => app && !app.isArchived);
          }),
        getActiveChatAppsInWorkspace: (workspaceId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return [];

            return workspace.chatAppIds
              .map((id) => state.chatApps[id])
              .filter(
                (app) =>
                  app &&
                  !app.isArchived &&
                  (app.status === "expanded" || app.status === "compact")
              );
          }),
        getStashedChatAppsInWorkspace: (workspaceId: string) =>
          Effect.gen(function* () {
            const state = yield* getState();
            const workspace = state.workspaces[workspaceId];
            if (!workspace) return [];

            return workspace.chatAppIds
              .map((id) => state.chatApps[id])
              .filter(
                (app) => app && !app.isArchived && app.status === "stashed"
              );
          }),
      } satisfies WorkspaceManagerApi;
    }),
    dependencies: [
      UrlService.Default,
      ChatAppsManager.Default,
      AgentManager.Default,
    ],
  }
) {}
