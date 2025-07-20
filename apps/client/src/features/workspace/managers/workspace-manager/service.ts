import { Effect, Ref } from "effect";
import type { WorkspaceManagerApi } from "./api";
import {
  WorkspaceDuplicateError,
  type WorkspaceError,
  WorkspaceLimitError,
  WorkspaceManagerError,
  WorkspaceManagerInitializationError,
  WorkspaceManagerStateError,
  WorkspaceNotFoundError,
  WorkspaceOperationError,
  WorkspacePersistenceError,
  WorkspaceValidationError,
} from "./errors";
import {
  Workspace,
  type WorkspaceCreateInput,
  type WorkspaceManagerConfig,
  type WorkspaceManagerState,
  type WorkspaceManagerStats,
  type WorkspaceUpdateInput,
} from "./types";
import {
  WORKSPACE_MANAGER_CONSTANTS,
  createDefaultWorkspaceManagerConfig,
  createDefaultWorkspaceManagerState,
  createWorkspaceFromInput,
} from "./types";

export class WorkspaceManager extends Effect.Service<WorkspaceManagerApi>()(
  "WorkspaceManager",
  {
    effect: Effect.gen(function* () {
      // State management
      const stateRef = yield* Ref.make<WorkspaceManagerState>(
        createDefaultWorkspaceManagerState()
      );
      const configRef = yield* Ref.make<WorkspaceManagerConfig | null>(null);
      const subscribersRef = yield* Ref.make<
        Set<(state: WorkspaceManagerState) => void>
      >(new Set());

      // Helper functions
      const updateState = (
        updater: (state: WorkspaceManagerState) => WorkspaceManagerState
      ) =>
        Effect.gen(function* () {
          const currentState = yield* Ref.get(stateRef);
          const newState = updater(currentState);
          yield* Ref.set(stateRef, newState);
          yield* notifySubscribers(newState);
        });

      const notifySubscribers = (state: WorkspaceManagerState) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscribersRef);
          for (const callback of subscribers) {
            try {
              callback(state);
            } catch (error) {
              console.error("Error in workspace manager subscriber:", error);
            }
          }
        });

      const validateWorkspaceInput = (
        input: WorkspaceCreateInput | WorkspaceUpdateInput
      ) =>
        Effect.gen(function* () {
          const errors: string[] = [];

          if ("name" in input && input.name !== undefined) {
            if (!input.name || input.name.trim() === "") {
              errors.push("Name is required");
            } else if (
              input.name.length > WORKSPACE_MANAGER_CONSTANTS.MAX_NAME_LENGTH
            ) {
              errors.push(
                `Name must be less than ${WORKSPACE_MANAGER_CONSTANTS.MAX_NAME_LENGTH} characters`
              );
            }
          }

          if (
            input.description &&
            input.description.length >
              WORKSPACE_MANAGER_CONSTANTS.MAX_DESCRIPTION_LENGTH
          ) {
            errors.push(
              `Description must be less than ${WORKSPACE_MANAGER_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`
            );
          }

          if (
            input.primaryColor &&
            !/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor)
          ) {
            errors.push("Primary color must be a valid hex color");
          }

          if (errors.length > 0) {
            return yield* Effect.fail(
              new WorkspaceValidationError({
                message: "Workspace validation failed",
                validationErrors: errors,
              })
            );
          }
        });

      const findWorkspaceById = (workspaceId: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const workspace = state.workspaces.find((w) => w.id === workspaceId);
          if (!workspace) {
            return yield* Effect.fail(
              new WorkspaceNotFoundError({
                message: `Workspace not found: ${workspaceId}`,
                workspaceId,
              })
            );
          }
          return workspace;
        });

      const checkWorkspaceLimit = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const config = yield* Ref.get(configRef);
          const maxWorkspaces =
            config?.maxWorkspaces || WORKSPACE_MANAGER_CONSTANTS.MAX_WORKSPACES;

          if (state.workspaces.length >= maxWorkspaces) {
            return yield* Effect.fail(
              new WorkspaceLimitError({
                message: `Maximum number of workspaces reached (${maxWorkspaces})`,
                currentCount: state.workspaces.length,
                maxAllowed: maxWorkspaces,
              })
            );
          }
        });

      const checkDuplicateName = (name: string, excludeId?: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const existing = state.workspaces.find(
            (w) =>
              w.name.toLowerCase() === name.toLowerCase() && w.id !== excludeId
          );
          if (existing) {
            return yield* Effect.fail(
              new WorkspaceDuplicateError({
                message: `Workspace with name "${name}" already exists`,
                workspaceId: name,
                existingWorkspace: existing.id,
              })
            );
          }
        });

      // Core API implementation
      const getState = () => Ref.get(stateRef);

      const setState = (updates: Partial<WorkspaceManagerState>) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, ...updates }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceManagerStateError({
                message: "Failed to update state",
                operation: "setState",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const resetState = () =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, createDefaultWorkspaceManagerState());
          yield* notifySubscribers(yield* Ref.get(stateRef));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceManagerStateError({
                message: "Failed to reset state",
                operation: "resetState",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const initialize = (config?: WorkspaceManagerConfig) =>
        Effect.gen(function* () {
          const finalConfig = config || createDefaultWorkspaceManagerConfig();
          yield* Ref.set(configRef, finalConfig);
          yield* updateState((state) => ({
            ...state,
            isInitialized: true,
            lastUpdated: new Date(),
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceManagerInitializationError({
                message: "Failed to initialize WorkspaceManager",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const getConfig = () => Ref.get(configRef);

      const updateConfig = (updates: Partial<WorkspaceManagerConfig>) =>
        Effect.gen(function* () {
          const currentConfig = yield* Ref.get(configRef);
          if (!currentConfig) {
            return yield* Effect.fail(
              new WorkspaceManagerError({
                message: "Manager not initialized",
              })
            );
          }
          const newConfig = { ...currentConfig, ...updates };
          yield* Ref.set(configRef, newConfig);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceManagerError({
                message: "Failed to update config",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const createWorkspace = (input: WorkspaceCreateInput) =>
        Effect.gen(function* () {
          yield* validateWorkspaceInput(input);
          yield* checkWorkspaceLimit();
          yield* checkDuplicateName(input.name);

          const workspace = createWorkspaceFromInput(input);

          yield* updateState((state) => ({
            ...state,
            workspaces: [...state.workspaces, workspace],
            operationCount: state.operationCount + 1,
            lastUpdated: new Date(),
          }));

          return workspace;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceOperationError({
                message: "Failed to create workspace",
                operation: "createWorkspace",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const getWorkspace = (workspaceId: string) =>
        findWorkspaceById(workspaceId);

      const updateWorkspace = (
        workspaceId: string,
        updates: WorkspaceUpdateInput
      ) =>
        Effect.gen(function* () {
          yield* validateWorkspaceInput(updates);
          const workspace = yield* findWorkspaceById(workspaceId);

          if (updates.name) {
            yield* checkDuplicateName(updates.name, workspaceId);
          }

          const updatedWorkspace = new Workspace({
            ...workspace,
            ...updates,
            lastActiveAt: new Date().toISOString(),
          });

          yield* updateState((state) => ({
            ...state,
            workspaces: state.workspaces.map((w) =>
              w.id === workspaceId ? updatedWorkspace : w
            ),
            operationCount: state.operationCount + 1,
            lastUpdated: new Date(),
          }));

          return updatedWorkspace;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceOperationError({
                message: "Failed to update workspace",
                operation: "updateWorkspace",
                workspaceId,
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const deleteWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          yield* findWorkspaceById(workspaceId); // Ensure it exists

          yield* updateState((state) => ({
            ...state,
            workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
            operationCount: state.operationCount + 1,
            lastUpdated: new Date(),
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceOperationError({
                message: "Failed to delete workspace",
                operation: "deleteWorkspace",
                workspaceId,
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const archiveWorkspace = (workspaceId: string) =>
        updateWorkspace(workspaceId, { isArchived: true });

      const restoreWorkspace = (workspaceId: string) =>
        updateWorkspace(workspaceId, { isArchived: false });

      const getAllWorkspaces = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.workspaces;
        });

      const getActiveWorkspaces = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.workspaces.filter((w) => !w.isArchived);
        });

      const getArchivedWorkspaces = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.workspaces.filter((w) => w.isArchived);
        });

      const searchWorkspaces = (query: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const searchTerm = query.toLowerCase();
          return state.workspaces.filter(
            (w) =>
              w.name.toLowerCase().includes(searchTerm) ||
              w.description.toLowerCase().includes(searchTerm)
          );
        });

      const validateWorkspace = (workspace: Workspace) =>
        validateWorkspaceInput(workspace);

      const duplicateWorkspace = (workspaceId: string, newName: string) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          const duplicateInput: WorkspaceCreateInput = {
            name: newName,
            description: workspace.description,
            icon: workspace.icon,
            primaryColor: workspace.primaryColor,
            agentIds: workspace.agentIds,
            chatappIds: workspace.chatappIds,
          };
          return yield* createWorkspace(duplicateInput);
        });

      const exportWorkspace = (workspaceId: string) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          return JSON.stringify(workspace, null, 2);
        });

      const importWorkspace = (data: string) =>
        Effect.gen(function* () {
          try {
            const workspaceData = JSON.parse(data);
            const input: WorkspaceCreateInput = {
              name: workspaceData.name,
              description: workspaceData.description,
              icon: workspaceData.icon,
              primaryColor: workspaceData.primaryColor,
              agentIds: workspaceData.agentIds,
              chatappIds: workspaceData.chatappIds,
            };
            return yield* createWorkspace(input);
          } catch (error) {
            return yield* Effect.fail(
              new WorkspaceOperationError({
                message: "Failed to import workspace",
                operation: "importWorkspace",
                cause:
                  error instanceof Error ? error : new Error(String(error)),
              })
            );
          }
        });

      const addAgentToWorkspace = (workspaceId: string, agentId: string) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          if (workspace.agentIds.includes(agentId)) {
            return workspace;
          }
          return yield* updateWorkspace(workspaceId, {
            agentIds: [...workspace.agentIds, agentId],
          });
        });

      const removeAgentFromWorkspace = (workspaceId: string, agentId: string) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          return yield* updateWorkspace(workspaceId, {
            agentIds: workspace.agentIds.filter((id) => id !== agentId),
          });
        });

      const addChatAppToWorkspace = (workspaceId: string, chatAppId: string) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          if (workspace.chatappIds.includes(chatAppId)) {
            return workspace;
          }
          return yield* updateWorkspace(workspaceId, {
            chatappIds: [...workspace.chatappIds, chatAppId],
          });
        });

      const removeChatAppFromWorkspace = (
        workspaceId: string,
        chatAppId: string
      ) =>
        Effect.gen(function* () {
          const workspace = yield* findWorkspaceById(workspaceId);
          return yield* updateWorkspace(workspaceId, {
            chatappIds: workspace.chatappIds.filter((id) => id !== chatAppId),
          });
        });

      const getStats = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const activeWorkspaces = state.workspaces.filter(
            (w) => !w.isArchived
          );
          const archivedWorkspaces = state.workspaces.filter(
            (w) => w.isArchived
          );

          const lastModified =
            state.workspaces.length > 0
              ? new Date(
                  Math.max(
                    ...state.workspaces.map((w) =>
                      new Date(w.lastActiveAt).getTime()
                    )
                  )
                )
              : null;

          const stats: WorkspaceManagerStats = {
            totalWorkspaces: state.workspaces.length,
            activeWorkspaces: activeWorkspaces.length,
            archivedWorkspaces: archivedWorkspaces.length,
            lastModified,
            operationCount: state.operationCount,
          };

          return stats;
        });

      const getWorkspaceStats = (workspaceId: string) =>
        Effect.gen(function* () {
          yield* findWorkspaceById(workspaceId); // Ensure it exists
          return yield* getStats();
        });

      const subscribe = (callback: (state: WorkspaceManagerState) => void) =>
        Effect.gen(function* () {
          const subscribers = yield* Ref.get(subscribersRef);
          const newSubscribers = new Set(subscribers);
          newSubscribers.add(callback);
          yield* Ref.set(subscribersRef, newSubscribers);

          return () => {
            Effect.runSync(
              Effect.gen(function* () {
                const currentSubscribers = yield* Ref.get(subscribersRef);
                const updatedSubscribers = new Set(currentSubscribers);
                updatedSubscribers.delete(callback);
                yield* Ref.set(subscribersRef, updatedSubscribers);
              })
            );
          };
        });

      const save = () =>
        Effect.gen(function* () {
          // TODO: Implement persistence to localStorage or API
          const state = yield* Ref.get(stateRef);
          localStorage.setItem("workspaces", JSON.stringify(state.workspaces));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspacePersistenceError({
                message: "Failed to save workspaces",
                operation: "save",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const load = () =>
        Effect.gen(function* () {
          // TODO: Implement loading from localStorage or API
          const saved = localStorage.getItem("workspaces");
          if (saved) {
            const workspaces = JSON.parse(saved);
            yield* updateState((state) => ({
              ...state,
              workspaces,
              lastUpdated: new Date(),
            }));
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspacePersistenceError({
                message: "Failed to load workspaces",
                operation: "load",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      const clear = () =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, createDefaultWorkspaceManagerState());
          yield* notifySubscribers(yield* Ref.get(stateRef));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new WorkspaceManagerStateError({
                message: "Failed to clear workspaces",
                operation: "clear",
                cause:
                  (cause as any) instanceof Error
                    ? (cause as Error)
                    : new Error(String(cause)),
              })
          )
        );

      return {
        getState,
        setState,
        resetState,
        initialize,
        getConfig,
        updateConfig,
        createWorkspace,
        getWorkspace,
        updateWorkspace,
        deleteWorkspace,
        archiveWorkspace,
        restoreWorkspace,
        getAllWorkspaces,
        getActiveWorkspaces,
        getArchivedWorkspaces,
        searchWorkspaces,
        validateWorkspace,
        validateWorkspaceInput,
        duplicateWorkspace,
        exportWorkspace,
        importWorkspace,
        addAgentToWorkspace,
        removeAgentFromWorkspace,
        addChatAppToWorkspace,
        removeChatAppFromWorkspace,
        getStats,
        getWorkspaceStats,
        subscribe,
        save,
        load,
        clear,
      };
    }),
    dependencies: [],
  }
) {}
