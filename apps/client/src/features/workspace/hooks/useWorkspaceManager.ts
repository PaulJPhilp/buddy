import { useEffectContext } from "@/components/EffectProvider";
import type { WorkspaceModel } from "@/domain/workspace";
import { ApplicationManager } from "@/features/application/managers/service";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/features/application/types/AppConfig"; // Updated path
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkspaceComponent } from "./service";

// Strict typing for workspace manager state
interface WorkspaceManagerState {
  readonly workspaceConfig: WorkspaceConfig | null;
  readonly availableChatApps: ChatAppConfig[];
  readonly availableAgents: AgentConfig[];
  readonly error: string | null;
  readonly isConfigLoaded: boolean;
}

// Type guard for WorkspaceModel
function isWorkspaceModel(obj: unknown): obj is WorkspaceModel {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const workspace = obj as Record<string, unknown>;

  return (
    "id" in workspace &&
    "name" in workspace &&
    typeof workspace.id === "string" &&
    typeof workspace.name === "string"
  );
}

// Type guard for WorkspaceConfig
function isWorkspaceConfig(obj: unknown): obj is WorkspaceConfig {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const config = obj as Record<string, unknown>;

  return (
    "id" in config &&
    "name" in config &&
    "chatappIds" in config &&
    "agentIds" in config &&
    "permissions" in config &&
    typeof config.id === "string" &&
    typeof config.name === "string" &&
    Array.isArray(config.chatappIds) &&
    Array.isArray(config.agentIds)
  );
}

// Strict conversion from WorkspaceModel to WorkspaceConfig
function convertWorkspaceModelToConfig(
  workspace: WorkspaceModel
): WorkspaceConfig {
  if (!isWorkspaceModel(workspace)) {
    throw new Error("Invalid WorkspaceModel provided");
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description || "",
    chatappIds: Array.isArray(workspace.chatappIds) ? workspace.chatappIds : [],
    agentIds: Array.isArray(workspace.agentIds) ? workspace.agentIds : [],
    permissions: workspace.permissions || {
      canAddApps: true,
      canRemoveApps: true,
      canModifyLayout: true,
      canChangeSettings: true,
      canInviteUsers: false,
      canManagePermissions: false,
    },
    isDefault: Boolean(workspace.isDefault),
    isArchived: Boolean(workspace.isArchived),
    maxExpandedApps:
      typeof workspace.maxExpandedApps === "number"
        ? workspace.maxExpandedApps
        : 3,
    createdAt: workspace.createdAt || new Date().toISOString(),
    updatedAt: workspace.updatedAt || new Date().toISOString(),
  };
}

// Default state with proper typing
function createDefaultState(): WorkspaceManagerState {
  return {
    workspaceConfig: null,
    availableChatApps: [],
    availableAgents: [],
    error: null,
    isConfigLoaded: false,
  };
}

export function useWorkspaceManager() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<WorkspaceManagerState>(createDefaultState);
  const hasInitializedRef = useRef(false);
  const isSwitchingWorkspaceRef = useRef(false);

  // Update state with type safety
  const updateState = useCallback((updates: Partial<WorkspaceManagerState>) => {
    console.log("[useWorkspaceManager] updateState called with:", updates);
    setState((prevState) => {
      const newState = { ...prevState, ...updates };
      console.log(
        "[useWorkspaceManager] State updated from:",
        prevState,
        "to:",
        newState
      );
      return newState;
    });
  }, []);

  // Safe error handling
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage =
      error instanceof Error ? error.message : `Unknown error in ${operation}`;
    console.error(`WorkspaceManager ${operation} error:`, error);
    setState((prevState) => ({
      ...prevState,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  // Switch to a specific workspace
  const switchWorkspace = useCallback(
    async (workspaceId: string): Promise<void> => {
      if (isSwitchingWorkspaceRef.current) {
        console.log(
          "[useWorkspaceManager] switchWorkspace: Already switching workspace, ignoring"
        );
        return;
      }

      isSwitchingWorkspaceRef.current = true;

      try {
        updateState({ isLoading: true, error: null });

        console.log(
          "[useWorkspaceManager] switchWorkspace called with:",
          workspaceId
        );

        const workspaceConfig = await runWithServices(
          Effect.gen(function* () {
            console.log("[useWorkspaceManager] About to run Effect...");

            // First, check if the WorkspaceComponent already has this workspace loaded
            const workspaceComponent = yield* WorkspaceComponent;
            const currentState = yield* workspaceComponent.getState();

            if (currentState.workspaceConfig?.id === workspaceId) {
              console.log(
                "[useWorkspaceManager] switchWorkspace: Workspace already loaded:",
                workspaceId
              );
              return currentState.workspaceConfig;
            }

            console.log(
              "[useWorkspaceManager] switchWorkspace: Getting workspaces from ApplicationManager..."
            );
            const applicationManager = yield* ApplicationManager;
            const workspaces = yield* applicationManager.getWorkspaces();

            console.log(
              "[useWorkspaceManager] switchWorkspace: available workspaces:",
              workspaces
            );

            if (workspaces.length === 0) {
              console.log(
                "[useWorkspaceManager] switchWorkspace: No workspaces found, attempting to reload config"
              );
              yield* applicationManager.loadConfig(
                "/static/configs/workspaces/index.json"
              );
              const reloadedWorkspaces =
                yield* applicationManager.getWorkspaces();
              console.log(
                "[useWorkspaceManager] switchWorkspace: workspaces after reload:",
                reloadedWorkspaces
              );
              workspaces.push(...reloadedWorkspaces);
            }

            console.log(
              "[useWorkspaceManager] switchWorkspace: Looking for workspace ID:",
              workspaceId
            );
            let workspace = workspaces.find((ws) => ws.id === workspaceId);

            if (!workspace) {
              console.log(
                "[useWorkspaceManager] switchWorkspace: Workspace not found in ApplicationManager workspaces"
              );

              // If still no workspace found, try to load it directly from the API
              console.log(
                "[useWorkspaceManager] switchWorkspace: Attempting to load workspace directly from API"
              );

              try {
                const response = yield* Effect.tryPromise({
                  try: () =>
                    fetch(
                      `/api/configs?path=/static/configs/workspaces/${workspaceId}/workspace.json`
                    ),
                  catch: (error) =>
                    new Error(`Failed to fetch workspace config: ${error}`),
                });

                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch workspace config: ${response.status}`
                  );
                }

                const workspaceData = yield* Effect.tryPromise({
                  try: () => response.json(),
                  catch: (error) =>
                    new Error(`Failed to parse workspace config: ${error}`),
                });

                workspace = workspaceData;
                console.log(
                  "[useWorkspaceManager] switchWorkspace: Loaded workspace from API:",
                  workspace
                );
              } catch (apiError) {
                console.error(
                  "[useWorkspaceManager] switchWorkspace: Failed to load workspace from API:",
                  apiError
                );
                console.log(
                  "[useWorkspaceManager] switchWorkspace: Returning null due to API error"
                );
                return null;
              }
            }

            if (!isWorkspaceModel(workspace)) {
              console.error(
                "[useWorkspaceManager] switchWorkspace: Invalid workspace data structure",
                workspace
              );
              throw new Error("Invalid workspace data structure");
            }

            // Convert with strict typing
            const workspaceConfig = convertWorkspaceModelToConfig(workspace);
            console.log(
              "[useWorkspaceManager] switchWorkspace: converted workspaceConfig:",
              workspaceConfig
            );

            if (!isWorkspaceConfig(workspaceConfig)) {
              console.error(
                "[useWorkspaceManager] switchWorkspace: Failed to convert workspace to valid configuration",
                workspaceConfig
              );
              throw new Error(
                "Failed to convert workspace to valid configuration"
              );
            }

            // Switch workspace
            console.log(
              "[useWorkspaceManager] switchWorkspace: calling WorkspaceComponent.switchWorkspace"
            );
            yield* workspaceComponent.switchWorkspace(workspaceConfig);
            console.log(
              "[useWorkspaceManager] switchWorkspace: WorkspaceComponent.switchWorkspace complete"
            );

            // Return the workspaceConfig to update state outside the Effect
            console.log(
              "[useWorkspaceManager] Effect returning workspaceConfig:",
              workspaceConfig
            );
            return workspaceConfig;
          })
        );

        console.log(
          "[useWorkspaceManager] Effect completed, returned workspaceConfig:",
          workspaceConfig
        );

        // Update state outside the Effect to ensure proper React state updates
        if (workspaceConfig) {
          console.log(
            "[useWorkspaceManager] About to update state with workspaceConfig:",
            workspaceConfig
          );
          updateState({
            workspaceConfig,
            isLoading: false,
            error: null,
          });
          console.log(
            "[useWorkspaceManager] workspaceConfig updated:",
            workspaceConfig
          );
        } else {
          console.log(
            "[useWorkspaceManager] No workspaceConfig returned from Effect"
          );
        }
      } catch (error) {
        console.error("[useWorkspaceManager] switchWorkspace: error", error);
        console.log(
          "[useWorkspaceManager] switchWorkspace: Effect failed, workspaceConfig is null"
        );
        handleError(error, "switchWorkspace");
        throw error; // Re-throw for caller handling
      } finally {
        isSwitchingWorkspaceRef.current = false;
      }
    },
    [runWithServices, updateState, handleError]
  );

  // Load workspace data with proper typing
  const loadWorkspaceData = useCallback(async (): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null });

      await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          const workspaceState = yield* workspaceComponent.getState();

          console.log(
            "[useWorkspaceManager] loadWorkspaceData: got workspaceState:",
            workspaceState
          );

          // Validate state structure
          if (!workspaceState) {
            throw new Error("No workspace state available");
          }

          // Type-safe state extraction
          const {
            workspaceConfig,
            availableChatApps = [],
            availableAgents = [],
          } = workspaceState;

          // Validate arrays
          if (!Array.isArray(availableChatApps)) {
            throw new Error("Invalid availableChatApps data structure");
          }
          if (!Array.isArray(availableAgents)) {
            throw new Error("Invalid availableAgents data structure");
          }

          console.log(
            "[useWorkspaceManager] loadWorkspaceData: extracted workspaceConfig:",
            workspaceConfig
          );

          // If we have a valid workspaceConfig, use it
          if (workspaceConfig) {
            updateState({
              workspaceConfig,
              availableChatApps,
              availableAgents,
              isLoading: false,
              error: null,
            });
            console.log(
              "[useWorkspaceManager] loadWorkspaceData: Updated state with existing workspaceConfig:",
              workspaceConfig
            );
            return;
          }

          // If no workspaceConfig, try to get workspaces from ApplicationManager
          const applicationManager = yield* ApplicationManager;
          const workspaces = yield* applicationManager.getWorkspaces();

          console.log(
            "[useWorkspaceManager] loadWorkspaceData: ApplicationManager workspaces:",
            workspaces
          );

          updateState({
            workspaceConfig: null,
            availableChatApps: [],
            availableAgents: [],
            isLoading: false,
            error: null,
          });
          console.log(
            "[useWorkspaceManager] loadWorkspaceData: set state with workspaces:",
            workspaces
          );
        })
      );
    } catch (error) {
      console.error("[useWorkspaceManager] loadWorkspaceData: error", error);
      handleError(error, "loadWorkspaceData");
    }
  }, [runWithServices, updateState, handleError]);

  // Load data on mount with error handling (only once)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      // Initialize by loading workspace index/config first, then load workspace data
      const initializeWithWorkspaceIndex = async () => {
        try {
          console.log("[useWorkspaceManager] Starting initialization...");

          const workspaceConfig = await runWithServices(
            Effect.gen(function* () {
              const applicationManager = yield* ApplicationManager;
              const workspaceComponent = yield* WorkspaceComponent;

              console.log("[useWorkspaceManager] Loading workspace index...");
              yield* applicationManager.loadConfig(
                "/static/configs/workspaces/index.json"
              );

              // Wait for config to be loaded and check state
              let attempts = 0;
              let workspaces: any[] = [];
              while (attempts < 10) {
                const state = yield* applicationManager.getState();
                console.log("[useWorkspaceManager] Config load state:", {
                  isConfigLoaded: state.isConfigLoaded,
                  isLoading: state.isLoading,
                  hasWorkspaces: !!state.appConfig?.workspaces,
                  workspaceCount: state.appConfig?.workspaces?.length || 0,
                });

                if (
                  state.isConfigLoaded &&
                  !state.isLoading &&
                  state.appConfig?.workspaces
                ) {
                  workspaces = yield* applicationManager.getWorkspaces();
                  console.log(
                    "[useWorkspaceManager] Available workspaces:",
                    workspaces.map((w) => w.id)
                  );
                  break;
                }

                console.log(
                  "[useWorkspaceManager] Waiting for config to load, attempt:",
                  attempts + 1
                );
                yield* Effect.sleep(200);
                attempts++;
              }

              if (workspaces.length > 0) {
                console.log(
                  "[useWorkspaceManager] Switching to first workspace:",
                  workspaces[0].id
                );
                yield* workspaceComponent.switchWorkspace(workspaces[0]);
                console.log(
                  "[useWorkspaceManager] Successfully switched to workspace:",
                  workspaces[0].id
                );

                // Wait for the workspace to be fully loaded
                let attempts = 0;
                const maxAttempts = 10;
                while (attempts < maxAttempts) {
                  const currentState = yield* workspaceComponent.getState();
                  if (currentState.workspaceConfig?.id === workspaces[0].id) {
                    console.log(
                      "[useWorkspaceManager] Workspace fully loaded:",
                      workspaces[0].id
                    );
                    // Add a small delay to ensure state is fully propagated
                    yield* Effect.sleep(50);
                    return currentState.workspaceConfig;
                  }
                  console.log(
                    "[useWorkspaceManager] Waiting for workspace to be fully loaded, attempt:",
                    attempts + 1
                  );
                  yield* Effect.sleep(100);
                  attempts++;
                }
              }

              return null;
            })
          );

          // Update state with the loaded workspace config
          if (workspaceConfig) {
            console.log(
              "[useWorkspaceManager] Updating state with loaded workspace config:",
              workspaceConfig
            );
            updateState({
              workspaceConfig,
              isLoading: false,
              error: null,
              isConfigLoaded: true,
            });
          } else {
            console.log("[useWorkspaceManager] No workspace config loaded");
            updateState({
              workspaceConfig: null,
              isLoading: false,
              error: null,
              isConfigLoaded: false,
            });
          }
          console.log("[useWorkspaceManager] Initialization complete");
        } catch (error) {
          console.error("Failed to initialize workspace manager:", error);
        }
      };

      initializeWithWorkspaceIndex();
    }
  }, [runWithServices, updateState]);

  // Return strictly typed interface
  const result = {
    // State (read-only)
    workspaceConfig: state.workspaceConfig,
    availableChatApps: state.availableChatApps,
    availableAgents: state.availableAgents,
    isLoading: state.isLoading,
    error: state.error,
    isConfigLoaded: state.isConfigLoaded,

    // Actions (strictly typed)
    switchWorkspace,
    loadWorkspaceData,
  } as const;

  console.log("[useWorkspaceManager] Returning result:", {
    workspaceConfig: result.workspaceConfig?.id,
    workspaceConfigFull: result.workspaceConfig,
    isLoading: result.isLoading,
    error: result.error,
    isConfigLoaded: result.isConfigLoaded,
  });

  return result;
}
