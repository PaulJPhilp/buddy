import { useEffectContext } from "@/components/EffectProvider";
import type { WorkspaceModel } from "@/domain/workspace";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/types/global";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppComponent } from "../app/service";
import { WorkspaceComponent } from "./service";

// Strict typing for workspace manager state
interface WorkspaceManagerState {
  readonly workspaceConfig: WorkspaceConfig | null;
  readonly availableChatApps: ChatAppConfig[];
  readonly availableAgents: AgentConfig[];
  readonly activeChatApps: ChatAppConfig[];
  readonly isLoading: boolean;
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
    activeChatApps: [],
    isLoading: false,
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
    setState((prevState) => ({ ...prevState, ...updates }));
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

  // Strictly typed switchWorkspace function
  const switchWorkspace = useCallback(
    async (workspaceId: string): Promise<void> => {
      if (typeof workspaceId !== "string" || workspaceId.trim() === "") {
        console.error(
          "[useWorkspaceManager] switchWorkspace: Invalid workspace ID provided",
          workspaceId
        );
        throw new Error("Invalid workspace ID provided");
      }

      isSwitchingWorkspaceRef.current = true;
      try {
        updateState({ isLoading: true, error: null });
        console.log(
          "[useWorkspaceManager] switchWorkspace called with:",
          workspaceId
        );

        await runWithServices(
          Effect.gen(function* () {
            // Get workspace by ID with proper validation
            const appComponent = yield* AppComponent;
            const workspaces = yield* appComponent.getWorkspaces();
            console.log(
              "[useWorkspaceManager] switchWorkspace: available workspaces:",
              workspaces.map((w) => w.id)
            );

            const workspace = workspaces.find((w) => w.id === workspaceId);
            if (!workspace) {
              console.warn(
                `[useWorkspaceManager] switchWorkspace: Workspace with ID '${workspaceId}' not found. Available workspaces:`,
                workspaces.map((w) => w.id)
              );
              throw new Error(
                `Workspace with ID '${workspaceId}' not found. Available: ${workspaces
                  .map((w) => w.id)
                  .join(", ")}`
              );
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
            const workspaceComponent = yield* WorkspaceComponent;
            console.log(
              "[useWorkspaceManager] switchWorkspace: calling WorkspaceComponent.switchWorkspace"
            );
            yield* workspaceComponent.switchWorkspace(workspaceConfig);
            console.log(
              "[useWorkspaceManager] switchWorkspace: WorkspaceComponent.switchWorkspace complete"
            );

            // Optimistically update state
            updateState({
              workspaceConfig,
              isLoading: false,
              error: null,
            });
            console.log(
              "[useWorkspaceManager] workspaceConfig updated:",
              workspaceConfig
            );
          })
        );
      } catch (error) {
        console.error("[useWorkspaceManager] switchWorkspace: error", error);
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

          // Validate state structure
          if (!workspaceState) {
            throw new Error("No workspace state available");
          }

          // Type-safe state extraction
          const {
            workspaceConfig,
            availableChatApps = [],
            availableAgents = [],
            activeChatApps = [],
          } = workspaceState;

          // Validate arrays
          if (!Array.isArray(availableChatApps)) {
            throw new Error("Invalid availableChatApps data structure");
          }
          if (!Array.isArray(availableAgents)) {
            throw new Error("Invalid availableAgents data structure");
          }
          if (!Array.isArray(activeChatApps)) {
            throw new Error("Invalid activeChatApps data structure");
          }

          updateState({
            workspaceConfig: workspaceConfig || null,
            availableChatApps,
            availableAgents,
            activeChatApps,
            isLoading: false,
            error: null,
            isConfigLoaded: true, // This line was removed from destructuring, so it's set here
          });
          // ADDED LOGGING: Log after loading and setting workspace state
          console.log(
            "[useWorkspaceManager] loadWorkspaceData: set state with workspaces:",
            {
              workspaceConfig: workspaceConfig || null,
              availableChatApps,
              availableAgents,
              activeChatApps,
            }
          );
        })
      );
    } catch (error) {
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
          await runWithServices(
            Effect.gen(function* () {
              const appComponent = yield* AppComponent;
              yield* appComponent.loadConfig(
                "/static/configs/workspaces/index.json"
              );
              const workspaces = yield* appComponent.getWorkspaces();
              if (workspaces.length > 0) {
                const workspaceComponent = yield* WorkspaceComponent;
                yield* workspaceComponent.switchWorkspace(workspaces[0]);
              }
            })
          );

          // Now load the initial workspace data (should now include workspaces)
          await loadWorkspaceData();
        } catch (error) {
          console.error("Failed to initialize workspace manager:", error);
        }
      };

      initializeWithWorkspaceIndex();
    }
  }, [loadWorkspaceData, runWithServices]);

  // Subscribe to workspace state changes to keep all components in sync
  useEffect(() => {
    const pollWorkspaceState = async () => {
      if (isSwitchingWorkspaceRef.current) {
        console.log(
          "[useWorkspaceManager] Polling skipped: workspace switch in progress"
        );
        return;
      }
      try {
        await loadWorkspaceData();
      } catch (error) {
        console.error("Failed to poll workspace state:", error);
      }
    };

    // Poll every 2 seconds to keep state in sync (reduced frequency to avoid race conditions)
    const interval = setInterval(pollWorkspaceState, 2000);
    return () => clearInterval(interval);
  }, [loadWorkspaceData]);

  // In loadWorkspaceData, after updating state with workspaceConfig, availableChatApps, etc.
  // Add logic to auto-select the first workspace if none is selected
  useEffect(() => {
    const selectFirstWorkspace = async () => {
      await runWithServices(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaces = yield* appComponent.getWorkspaces();
          console.log(
            "[useWorkspaceManager] Available workspaces (auto-select effect):",
            workspaces
          );
          if (
            state.isConfigLoaded &&
            !state.workspaceConfig &&
            workspaces.length > 0
          ) {
            const workspace = workspaces[0];
            console.log(
              "[useWorkspaceManager] Switching to workspace (auto-select effect):",
              workspace.id
            );
            yield* Effect.promise(() => switchWorkspace(workspace.id));
          } else if (workspaces.length === 0) {
            console.log(
              "[useWorkspaceManager] No workspaces found to auto-select (auto-select effect)."
            );
          }
        })
      );
    };
    selectFirstWorkspace();
  }, [
    state.isConfigLoaded,
    state.workspaceConfig,
    runWithServices,
    switchWorkspace,
  ]);

  // Return strictly typed interface
  return {
    // State (read-only)
    workspaceConfig: state.workspaceConfig,
    availableChatApps: state.availableChatApps,
    availableAgents: state.availableAgents,
    activeChatApps: state.activeChatApps,
    isLoading: state.isLoading,
    error: state.error,
    isConfigLoaded: state.isConfigLoaded,

    // Actions (strictly typed)
    switchWorkspace,
    loadWorkspaceData,
  } as const;
}
