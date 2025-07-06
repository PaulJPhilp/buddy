"use client";

import {
  type Agent,
  type ChatApp,
  type Workspace,
  AppManager,
  type AppManagerState,
} from "@/managers/app-manager";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServiceLayer } from "./useServiceLayer";

// This hook initializes the AppManager service and subscribes to state changes.
// It always cleans up the subscription on unmount or dependency change using a useRef.
// This pattern ensures:
// 1. The unsubscribe function is not lost due to closure issues.
// 2. Cleanup is always performed, and errors are logged.
// 3. React's rules of hooks are followed for safe resource management.

// This hook provides stateless action functions for the AppManager service.
// It does not manage subscriptions or async resources, so no cleanup is required.
// If future changes introduce subscriptions or async resources, follow the standardized pattern:
// 1. Use useRef to store unsubscribe/cleanup functions.
// 2. Always perform cleanup in the useEffect return.
// 3. Log errors during cleanup.
// 4. Follow React's rules of hooks for safe resource management.

/**
 * React hook for subscribing to the AppManager service in the EffectTalk architecture.
 *
 * - Initializes and subscribes to AppManager state updates.
 * - Cleans up the subscription on unmount or dependency change using a useRef.
 * - Exposes the current state, loading status, and error.
 *
 * @returns An object containing:
 *   - state: The current AppManagerState or null if not loaded.
 *   - isLoading: Whether the manager is still loading.
 *   - error: Any error encountered during initialization or subscription.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All subscriptions are cleaned up on unmount or dependency change.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */
// Hook for accessing the AppManager state
export function useAppManagerState() {
  const [state, setState] = useState<AppManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { runWithServices } = useServiceLayer();

  useEffect(() => {
    console.log(
      "[useAppManagerState] Hook mounted, starting initialization"
    );

    const initializeManager = async () => {
      try {
        console.log("[useAppManagerState] Starting initializeManager...");

        const unsubscribeEffect = await runWithServices(
          Effect.gen(function* () {
            console.log(
              "[useAppManagerState] Inside Effect.gen, getting AppManager..."
            );
            const manager = yield* AppManager;
            console.log(
              "[useAppManagerState] Got AppManager, calling loadInitialData..."
            );

            // Load initial data
            yield* manager.loadInitialData();
            console.log(
              "[useAppManagerState] loadInitialData completed, getting initial state..."
            );

            // Get initial state
            const initialState = yield* manager.getState();
            console.log("[useAppManagerState] Got initial state:", {
              isLoading: initialState.isLoading,
              workspaceCount: Object.keys(initialState.workspaces).length,
              chatAppCount: Object.keys(initialState.chatApps).length,
              agentCount: Object.keys(initialState.agents).length,
            });

            setState(initialState);
            setIsLoading(initialState.isLoading); // Use AppManager's loading state
            console.log(
              "[useAppManagerState] Set React state, isLoading:",
              initialState.isLoading
            );

            // Subscribe to state changes
            console.log(
              "[useAppManagerState] Setting up subscription..."
            );
            const unsubscribeEffect = yield* manager.subscribe((newState) => {
              console.log("[useAppManagerState] State update received:", {
                isLoading: newState.isLoading,
                workspaceCount: Object.keys(newState.workspaces).length,
                chatAppCount: Object.keys(newState.chatApps).length,
              });
              setState(newState);
              setIsLoading(newState.isLoading); // Always sync with AppManager's loading state
            });

            console.log(
              "[useAppManagerState] Subscription set up successfully"
            );
            return unsubscribeEffect;
          })
        );

        unsubscribeRef.current = () => {
          Effect.runPromise(unsubscribeEffect()).catch((err) => {
            console.error(
              "Failed to cleanup AppManager subscription:",
              err
            );
          });
        };

        console.log(
          "[useAppManagerState] ✅ AppManager initialization completed successfully"
        );
        // Don't set loading to false here - let the subscription handle it
      } catch (err) {
        console.error(
          "[useAppManagerState] ❌ Failed to initialize AppManager:",
          err
        );
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };

    initializeManager();

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.error(
            "Failed to cleanup AppManager subscription:",
            err
          );
        }
        unsubscribeRef.current = null;
      }
    };
  }, [runWithServices]);

  return { state, isLoading, error };
}

/**
 * React hook for providing stateless action functions for the AppManager service.
 *
 * - Exposes action methods for creating, updating, archiving, and managing workspaces and chat apps.
 * - Does not manage subscriptions or async resources, so no cleanup is required.
 *
 * @returns An object containing action methods and isReady status.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - If future changes introduce subscriptions or async resources, use useRef and always perform cleanup in the useEffect return.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */
// Hook for AppManager operations
export function useAppManagerActions() {
  const [isReady, setIsReady] = useState(false);
  const { runWithServices } = useServiceLayer();

  useEffect(() => {
    // Just mark as ready since we'll use the service layer directly
    setIsReady(true);
  }, []);

  const createWorkspace = useCallback(
    async (params: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      availableAgents: string[];
    }) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.createWorkspace(params);
        })
      );
    },
    [runWithServices]
  );

  const updateWorkspace = useCallback(
    async (
      workspaceId: string,
      updates: Partial<
        Pick<Workspace, "name" | "description" | "icon" | "color">
      >
    ) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.updateWorkspace(workspaceId, updates);
        })
      );
    },
    [runWithServices]
  );

  const archiveWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.archiveWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const setCurrentWorkspace = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.setCurrentWorkspace(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  const activateChatApp = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.activateChatApp(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const expandChatApp = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.expandChatApp(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const compactChatApp = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.compactChatApp(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const stashChatApp = useCallback(
    async (workspaceId: string, appId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.stashChatApp(workspaceId, appId);
        })
      );
    },
    [runWithServices]
  );

  const toggleWorkspaceExpanded = useCallback(
    async (workspaceId: string) => {
      return runWithServices(
        Effect.gen(function* () {
          const manager = yield* AppManager;
          return yield* manager.toggleWorkspaceExpanded(workspaceId);
        })
      );
    },
    [runWithServices]
  );

  return {
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    setCurrentWorkspace,
    activateChatApp,
    expandChatApp,
    compactChatApp,
    stashChatApp,
    toggleWorkspaceExpanded,
    isReady,
  };
}

/**
 * React hook for getting the current workspace object from AppManager state.
 *
 * @returns The current workspace object, or null if not available.
 */
export function useCurrentWorkspace() {
  const { state } = useAppManagerState();
  return state?.currentWorkspaceId
    ? state.workspaces[state.currentWorkspaceId] || null
    : null;
}

/**
 * React hook for getting the active chat app in the current workspace from AppManager state.
 *
 * @returns The active chat app object, or null if not available.
 */
export function useActiveChatApp() {
  const { state } = useAppManagerState();
  const currentWorkspace = state?.currentWorkspaceId
    ? state.workspaces[state.currentWorkspaceId]
    : null;
  if (!currentWorkspace?.activeAppId || !state) return null;
  return state.chatApps[currentWorkspace.activeAppId] || null;
}

/**
 * React hook for getting all chat apps in a given workspace from AppManager state.
 *
 * @param workspaceId The ID of the workspace to filter chat apps by.
 * @returns An array of chat app objects in the workspace.
 */
export function useChatAppsInWorkspace(workspaceId: string) {
  const { state } = useAppManagerState();
  if (!state) return [];
  return Object.values(state.chatApps).filter(
    (app) => app.workspaceId === workspaceId && !app.isArchived
  );
}

/**
 * React hook for getting all active (non-archived) workspaces from AppManager state.
 *
 * @returns An array of active workspace objects.
 */
export function useActiveWorkspaces() {
  const { state } = useAppManagerState();
  if (!state) return [];
  return Object.values(state.workspaces).filter((ws) => !ws.isArchived);
}

/**
 * React hook for getting all agents from AppManager state.
 *
 * @returns An array of agent objects.
 */
export function useAgents() {
  const { state } = useAppManagerState();
  if (!state) return [];
  return Object.values(state.agents);
}
