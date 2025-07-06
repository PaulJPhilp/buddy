"use client";

import { WorkspaceManager } from "@/managers/workspace-component";
import type {
  ChatAppConfig,
  ChatAppEntry,
  CreateWorkspaceParams,
  UpdateWorkspaceParams,
  WorkspaceEntry,
  WorkspaceState,
  WorkspaceStats,
} from "@/managers/workspace-component/types";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServiceLayer } from "./useServiceLayer";

/**
 * React hook for subscribing to the WorkspaceManager state in the Effect architecture.
 *
 * - Initializes and subscribes to WorkspaceManager state updates.
 * - Cleans up the subscription on unmount using a useRef.
 * - Exposes the current state, loading status, and error.
 *
 * @returns An object containing:
 *   - state: The current WorkspaceState or null if not loaded.
 *   - isLoading: Whether the service is still loading.
 *   - error: Any error encountered during initialization or subscription.
 *
 * This hook follows the Effect resource management pattern:
 *   - All subscriptions are cleaned up on unmount.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */
export function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => Effect.Effect<void>) | null>(null);
  const { runWithServices } = useServiceLayer();

  useEffect(() => {
    console.log("[useWorkspaceState] Hook mounted, starting initialization");

    const initializeService = async () => {
      try {
        console.log(
          "[useWorkspaceState] Getting WorkspaceManager from shared layer"
        );

        // Start loading
        console.log(
          "[useWorkspaceState] Setting WorkspaceManager to loading state..."
        );
        await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            yield* service.startLoading();
          })
        );
        console.log(
          "[useWorkspaceState] ✅ WorkspaceManager loading state set"
        );

        // Get initial state using shared service layer
        console.log(
          "[useWorkspaceState] Getting initial state from WorkspaceManager..."
        );
        const { initialState, serviceInstanceId } = await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            // Get the instance ID for debugging
            const instanceId = service.instanceId;
            console.log(
              "[useWorkspaceState] Using WorkspaceManager instance:",
              instanceId
            );
            const state = yield* service.getState();
            return { initialState: state, serviceInstanceId: instanceId };
          })
        );

        console.log("[useWorkspaceState] Got initial state:", {
          serviceInstanceId,
          currentWorkspaceId: initialState.currentWorkspaceId,
          workspaceCount: Object.keys(initialState.workspaces).length,
          chatAppCount: Object.keys(initialState.chatApps).length,
          isLoading: initialState.isLoading,
        });

        // Check if we need to load workspaces
        const activeWorkspaces = Object.values(initialState.workspaces).filter(
          (ws) => !ws.isArchived
        );

        if (activeWorkspaces.length === 0) {
          console.log(
            "[useWorkspaceState] No workspaces found, loading from API..."
          );

          // Load workspaces from API
          const loadedWorkspaces = await runWithServices(
            Effect.gen(function* () {
              const service = yield* WorkspaceManager;
              console.log(
                "[useWorkspaceState] Loading workspaces via service:",
                service.instanceId
              );
              return yield* service.loadWorkspaces();
            })
          );

          console.log(
            "[useWorkspaceState] Loaded workspaces:",
            loadedWorkspaces.length
          );

          // Get the updated state after loading
          const updatedState = await runWithServices(
            Effect.gen(function* () {
              const service = yield* WorkspaceManager;
              return yield* service.getState();
            })
          );

          console.log("[useWorkspaceState] Updated state after loading:", {
            workspaceCount: Object.keys(updatedState.workspaces).length,
            isLoading: updatedState.isLoading,
          });
          setState(updatedState);
        } else {
          console.log(
            "[useWorkspaceState] Workspaces already exist:",
            activeWorkspaces.length
          );
          setState(initialState);
        }

        // Subscribe to state changes using shared service layer
        console.log("[useWorkspaceState] Setting up subscription");
        const unsubscribe = await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            console.log(
              "[useWorkspaceState] Setting up subscription with service instance:",
              service.instanceId
            );
            return yield* service.subscribe((newState) => {
              console.log("[useWorkspaceState] State update received:", {
                currentWorkspaceId: newState.currentWorkspaceId,
                workspaceCount: Object.keys(newState.workspaces).length,
                chatAppCount: Object.keys(newState.chatApps).length,
                isLoading: newState.isLoading,
              });
              setState(newState);
              setIsLoading(newState.isLoading);
            });
          })
        );

        unsubscribeRef.current = unsubscribe;

        // Finish loading
        console.log("[useWorkspaceState] Finishing loading state...");
        await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            yield* service.finishLoading();
          })
        );

        console.log("[useWorkspaceState] ✅ Service initialized successfully");
      } catch (error) {
        console.error(
          "[useWorkspaceState] ❌ Failed to initialize WorkspaceManager:",
          error
        );
        setError(String(error));
        // Make sure to finish loading even on error
        await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            yield* service.failLoading(error);
          })
        );
      }
    };

    initializeService();

    return () => {
      if (unsubscribeRef.current) {
        Effect.runPromise(unsubscribeRef.current()).catch((error) => {
          console.error(
            "Failed to cleanup WorkspaceManager subscription:",
            error
          );
        });
      }
    };
  }, [runWithServices]);

  return { state, isLoading: state?.isLoading ?? isLoading, error };
}

/**
 * React hook for providing workspace action functions.
 *
 * - Exposes action methods for creating, updating, archiving, and managing workspaces.
 * - Does not manage subscriptions or async resources.
 *
 * @returns An object containing workspace action methods.
 */
export function useWorkspaceActions() {
  const { runWithServices } = useServiceLayer();

  const loadWorkspaces = useCallback(async () => {
    console.log("[useWorkspaceActions] Loading workspaces from API");
    const result = await runWithServices(
      Effect.gen(function* () {
        const service = yield* WorkspaceManager;
        const actionInstanceId = service.instanceId;
        console.log(
          "[useWorkspaceActions] Using WorkspaceManager instance:",
          actionInstanceId
        );
        const workspaces = yield* service.loadWorkspaces();
        console.log(
          "[useWorkspaceActions] Workspaces loaded with service instance:",
          actionInstanceId
        );
        return workspaces;
      })
    );
    console.log(
      "[useWorkspaceActions] Workspaces loaded successfully:",
      result.length
    );
    return result;
  }, [runWithServices]);

  const createWorkspace = useCallback(
    async (params: CreateWorkspaceParams) => {
      console.log("[useWorkspaceActions] Creating workspace:", params);
      const result = await runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          const actionInstanceId = service.instanceId;
          console.log(
            "[useWorkspaceActions] Using WorkspaceManager instance:",
            actionInstanceId
          );
          const workspace = yield* service.createWorkspace(params);
          console.log(
            "[useWorkspaceActions] Workspace created with service instance:",
            actionInstanceId
          );
          return workspace;
        })
      );
      console.log(
        "[useWorkspaceActions] Workspace created successfully:",
        result
      );
      return result;
    },
    [runWithServices]
  );

  const updateWorkspace = useCallback(
    async (workspaceId: string, updates: UpdateWorkspaceParams) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.updateWorkspace(workspaceId, updates);
        })
      );
    },
    [runWithServices]
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.deleteWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const archiveWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.archiveWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const restoreWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.restoreWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const setActiveWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.setActiveWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const addAgentToWorkspace = useCallback(
    async (workspaceId: string, agentId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.addAgentToWorkspace(workspaceId, agentId);
        })
      );
    },
    [runWithServices]
  );

  const removeAgentFromWorkspace = useCallback(
    async (workspaceId: string, agentId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.removeAgentFromWorkspace(workspaceId, agentId);
        })
      );
    },
    [runWithServices]
  );

  const updateWorkspaceAgents = useCallback(
    async (workspaceId: string, agentIds: string[]) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.updateWorkspaceAgents(workspaceId, agentIds);
        })
      );
    },
    [runWithServices]
  );

  const reset = useCallback(async () => {
    return runWithServices(
      Effect.gen(function* () {
        const service = yield* WorkspaceManager;
        return yield* service.reset();
      })
    );
  }, [runWithServices]);

  return {
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    archiveWorkspace,
    restoreWorkspace,
    setActiveWorkspace,
    addAgentToWorkspace,
    removeAgentFromWorkspace,
    updateWorkspaceAgents,
    reset,
  };
}

/**
 * React hook for chat app management actions.
 */
export function useChatAppActions() {
  const { runWithServices } = useServiceLayer();

  const addChatApp = useCallback(
    async (workspaceId: string, appId: string, config: ChatAppConfig) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.addChatApp(workspaceId, appId, config);
        })
      );
    },
    [runWithServices]
  );

  const updateChatApp = useCallback(
    async (appId: string, updates: Partial<ChatAppConfig>) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.updateChatApp(appId, updates);
        })
      );
    },
    [runWithServices]
  );

  const removeChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.removeChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const setActiveChatApp = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.setActiveChatApp(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const expandChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.expandChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const compactChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.compactChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const stashChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.stashChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const closeChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.closeChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const archiveChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.archiveChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  const restoreChatApp = useCallback(
    async (appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.restoreChatApp(appId);
        })
      );
    },
    [runWithServices]
  );

  return {
    addChatApp,
    updateChatApp,
    removeChatApp,
    setActiveChatApp,
    expandChatApp,
    compactChatApp,
    stashChatApp,
    closeChatApp,
    archiveChatApp,
    restoreChatApp,
  };
}

/**
 * React hook for focus mode actions.
 */
export function useFocusModeActions() {
  const { runWithServices } = useServiceLayer();

  const enterFocusMode = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.enterFocusMode(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const exitFocusMode = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.exitFocusMode(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  return {
    enterFocusMode,
    exitFocusMode,
  };
}

/**
 * React hook for loading state management.
 */
export function useWorkspaceLoading() {
  const { runWithServices } = useServiceLayer();

  const startLoading = useCallback(async () => {
    return runWithServices(
      Effect.gen(function* () {
        const service = yield* WorkspaceManager;
        return yield* service.startLoading();
      })
    );
  }, [runWithServices]);

  const finishLoading = useCallback(async () => {
    return runWithServices(
      Effect.gen(function* () {
        const service = yield* WorkspaceManager;
        return yield* service.finishLoading();
      })
    );
  }, [runWithServices]);

  const failLoading = useCallback(
    async (error: unknown) => {
      return runWithServices(
        Effect.gen(function* () {
          const service = yield* WorkspaceManager;
          return yield* service.failLoading(error);
        })
      );
    },
    [runWithServices]
  );

  return {
    startLoading,
    finishLoading,
    failLoading,
  };
}

// Computed state hooks

/**
 * Hook to get the current workspace from state.
 */
export function useCurrentWorkspace(): WorkspaceEntry | null {
  const { state } = useWorkspaceState();

  if (!state || !state.currentWorkspaceId) {
    return null;
  }

  return state.workspaces[state.currentWorkspaceId] || null;
}

/**
 * Hook to get all active (non-archived) workspaces.
 */
export function useActiveWorkspaces(): WorkspaceEntry[] {
  const { state } = useWorkspaceState();

  if (!state) {
    return [];
  }

  return Object.values(state.workspaces).filter(
    (workspace) => !workspace.isArchived
  );
}

/**
 * Hook to get all archived workspaces.
 */
export function useArchivedWorkspaces(): WorkspaceEntry[] {
  const { state } = useWorkspaceState();

  if (!state) {
    return [];
  }

  return Object.values(state.workspaces).filter(
    (workspace) => workspace.isArchived
  );
}

/**
 * Hook to get chat apps for a specific workspace.
 */
export function useChatAppsForWorkspace(workspaceId: string): ChatAppEntry[] {
  const { state } = useWorkspaceState();

  if (!state || !workspaceId) {
    return [];
  }

  const workspace = state.workspaces[workspaceId];
  if (!workspace) {
    return [];
  }

  return workspace.chatAppIds
    .map((appId) => state.chatApps[appId])
    .filter((app): app is ChatAppEntry => app !== undefined && !app.isArchived);
}

/**
 * Hook to get active chat apps in a workspace (expanded or compact).
 */
export function useActiveChatAppsInWorkspace(
  workspaceId: string
): ChatAppEntry[] {
  const { state } = useWorkspaceState();

  if (!state || !workspaceId) {
    return [];
  }

  const workspace = state.workspaces[workspaceId];
  if (!workspace) {
    return [];
  }

  return workspace.chatAppIds
    .map((appId) => state.chatApps[appId])
    .filter(
      (app): app is ChatAppEntry =>
        app !== undefined &&
        !app.isArchived &&
        (app.status === "expanded" || app.status === "compact")
    );
}

/**
 * Hook to get stashed chat apps in a workspace.
 */
export function useStashedChatAppsInWorkspace(
  workspaceId: string
): ChatAppEntry[] {
  const { state } = useWorkspaceState();

  if (!state || !workspaceId) {
    return [];
  }

  const workspace = state.workspaces[workspaceId];
  if (!workspace) {
    return [];
  }

  return workspace.chatAppIds
    .map((appId) => state.chatApps[appId])
    .filter(
      (app): app is ChatAppEntry =>
        app !== undefined && !app.isArchived && app.status === "stashed"
    );
}

/**
 * Hook to get workspace statistics.
 */
export function useWorkspaceStats(): WorkspaceStats | null {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const { runWithServices } = useServiceLayer();

  useEffect(() => {
    const getStats = async () => {
      try {
        const result = await runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceManager;
            return yield* service.getWorkspaceStats();
          })
        );
        setStats(result);
      } catch (err) {
        console.error("Failed to get workspace stats:", err);
      }
    };

    getStats();
  }, [runWithServices]);

  return stats;
}

/**
 * Hook to check if a workspace is in focus mode.
 */
export function useIsFocusMode(workspaceId: string): boolean {
  const { state } = useWorkspaceState();

  if (!state || !workspaceId) {
    return false;
  }

  const workspace = state.workspaces[workspaceId];
  if (!workspace) {
    return false;
  }

  // A workspace is in focus mode if it has stashed apps with previous status
  return workspace.chatAppIds.some((appId) => {
    const app = state.chatApps[appId];
    return app && app.status === "stashed" && app.previousStatus;
  });
}

/**
 * Hook to get the loading state.
 */
export function useWorkspaceLoadingState(): boolean {
  const { state } = useWorkspaceState();
  return state?.isLoading ?? false;
}
