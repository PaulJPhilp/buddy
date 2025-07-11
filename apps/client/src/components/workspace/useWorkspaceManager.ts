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
  };
}

export function useWorkspaceManager() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<WorkspaceManagerState>(createDefaultState);
  const hasInitializedRef = useRef(false);

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
        throw new Error("Invalid workspace ID provided");
      }

      try {
        updateState({ isLoading: true, error: null });

        await runWithServices(
          Effect.gen(function* () {
            // Get workspace by ID with proper validation
            const appComponent = yield* AppComponent;
            const workspaces = yield* appComponent.getWorkspaces();

            const workspace = workspaces.find((w) => w.id === workspaceId);
            if (!workspace) {
              throw new Error(`Workspace with ID '${workspaceId}' not found`);
            }

            if (!isWorkspaceModel(workspace)) {
              throw new Error("Invalid workspace data structure");
            }

            // Convert with strict typing
            const workspaceConfig = convertWorkspaceModelToConfig(workspace);

            if (!isWorkspaceConfig(workspaceConfig)) {
              throw new Error(
                "Failed to convert workspace to valid configuration"
              );
            }

            // Switch workspace
            const workspaceComponent = yield* WorkspaceComponent;
            yield* workspaceComponent.switchWorkspace(workspaceConfig);

            // Optimistically update state
            updateState({
              workspaceConfig,
              isLoading: false,
              error: null,
            });
          })
        );
      } catch (error) {
        handleError(error, "switchWorkspace");
        throw error; // Re-throw for caller handling
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
          });
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

      // Initialize without auto-selecting any workspace
      const initializeWithoutWorkspace = async () => {
        try {
          // Just load the initial workspace data (empty state)
          await loadWorkspaceData();

          // Load the workspace index to make workspaces available for selection
          await runWithServices(
            Effect.gen(function* () {
              const appComponent = yield* AppComponent;
              yield* appComponent.loadConfig(
                "/static/configs/workspaces/index.json"
              );
            })
          );
        } catch (error) {
          console.error("Failed to initialize workspace manager:", error);
        }
      };

      initializeWithoutWorkspace();
    }
  }, [loadWorkspaceData, runWithServices]);

  // Subscribe to workspace state changes to keep all components in sync
  useEffect(() => {
    const pollWorkspaceState = async () => {
      try {
        await loadWorkspaceData();
      } catch (error) {
        console.error("Failed to poll workspace state:", error);
      }
    };

    // Poll every 500ms to keep state in sync
    const interval = setInterval(pollWorkspaceState, 500);
    return () => clearInterval(interval);
  }, [loadWorkspaceData]);

  // Return strictly typed interface
  return {
    // State (read-only)
    workspaceConfig: state.workspaceConfig,
    availableChatApps: state.availableChatApps,
    availableAgents: state.availableAgents,
    activeChatApps: state.activeChatApps,
    isLoading: state.isLoading,
    error: state.error,

    // Actions (strictly typed)
    switchWorkspace,
    loadWorkspaceData,
  } as const;
}
