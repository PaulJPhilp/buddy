"use client";

import { AppService } from "@/services/app";
import { ChatAppConfig } from "@/types/global";
import { Effect, Layer } from "effect";
import { useCallback, useEffect } from "react";
import { createSelector } from "reselect";
import type { UIState } from "./types";
import {
  useWorkspaceDispatch,
  useWorkspaceStore as useWorkspaceStoreBase,
} from "./workspaceStore";

const serviceLayer = Layer.mergeAll(AppService.Default);

const selectChatApps = (state: UIState) => state.chatApps;
const selectCurrentWorkspaceId = (state: UIState) => state.currentWorkspaceId;
const selectWorkspaces = (state: UIState) => state.workspaces;

const selectChatAppsInCurrentWorkspace = createSelector(
  [selectChatApps, selectCurrentWorkspaceId],
  (chatApps, currentWorkspaceId) => {
    if (!currentWorkspaceId) return [];
    return Object.values(chatApps).filter(
      (app) => app.workspaceId === currentWorkspaceId,
    );
  },
);

const selectCurrentWorkspace = createSelector(
  [selectWorkspaces, selectCurrentWorkspaceId],
  (workspaces, currentWorkspaceId) => {
    if (!currentWorkspaceId) return null;
    return workspaces[currentWorkspaceId] || null;
  },
);

const selectWorkspaceStats = createSelector(
  [selectWorkspaces],
  (workspaces) => {
    const activeWorkspaces = Object.values(workspaces).filter(
      (w) => !w.isArchived,
    );
    return {
      totalWorkspaces: Object.keys(workspaces).length,
      activeWorkspaces: activeWorkspaces.length,
      archivedWorkspaces:
        Object.keys(workspaces).length - activeWorkspaces.length,
    };
  },
);

// New selectors for active workspaces (workspaces with active chat apps)
//
// IMPORTANT: "Active Workspace" vs "Current Workspace" distinction:
// - Current Workspace: The workspace currently being viewed/managed in the UI
// - Active Workspace: A workspace that has at least one active chat app
//   (i.e., chat apps that are "expanded" or "compact", but not "stashed" or "closed")
//
// A workspace is considered "active" if it has running/visible chat applications.
// Multiple workspaces can be active simultaneously, but only one is "current".
const selectActiveWorkspaceIds = createSelector(
  [selectChatApps],
  (chatApps) => {
    const activeWorkspaceIds = new Set<string>();

    for (const app of Object.values(chatApps)) {
      // A workspace is active if it has at least one chat app that's not stashed or closed
      if (
        app.status !== "stashed" &&
        app.status !== "closed" &&
        !app.isArchived
      ) {
        activeWorkspaceIds.add(app.workspaceId);
      }
    }

    return Array.from(activeWorkspaceIds);
  },
);

const selectActiveWorkspaces = createSelector(
  [selectWorkspaces, selectActiveWorkspaceIds],
  (workspaces, activeWorkspaceIds) => {
    return activeWorkspaceIds
      .map((id) => workspaces[id])
      .filter(Boolean) // Filter out any undefined workspaces
      .filter((workspace) => !workspace.isArchived); // Only include non-archived workspaces
  },
);

const selectIsWorkspaceActive = createSelector(
  [selectActiveWorkspaceIds, (_: UIState, workspaceId: string) => workspaceId],
  (activeWorkspaceIds, workspaceId) => {
    return activeWorkspaceIds.includes(workspaceId);
  },
);

// Re-export the base store hook
export const useWorkspaceStore = useWorkspaceStoreBase;

export function useWorkspaceLoader() {
  const { send } = useWorkspaceDispatch();

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const configs = await Effect.runPromise(
          Effect.gen(function* () {
            const appService = yield* AppService;
            return yield* appService.getAll();
          }).pipe(Effect.provide(serviceLayer)),
        );

        if (!cancelled && configs) {
          send({ type: "CHAT_APPS_ADDED", apps: configs });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load ChatApp configs:", err);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [send]);
}

export const useCurrentWorkspace = () => {
  return useWorkspaceStoreBase(selectCurrentWorkspace);
};

export const useChatAppsInCurrentWorkspace = () => {
  return useWorkspaceStoreBase(selectChatAppsInCurrentWorkspace);
};

export const useStashedChatApps = () => {
  const allApps = useChatAppsInCurrentWorkspace();
  return allApps.filter((app) => app.status === "stashed");
};

export const useWorkspaceStats = () => {
  return useWorkspaceStoreBase(selectWorkspaceStats);
};

// New hooks for active workspaces
/**
 * Returns all workspaces that have at least one active chat app.
 * Active chat apps are those with status "expanded" or "compact" (not "stashed" or "closed").
 */
export const useActiveWorkspaces = () => {
  return useWorkspaceStoreBase(selectActiveWorkspaces);
};

/**
 * Returns an array of workspace IDs that have at least one active chat app.
 */
export const useActiveWorkspaceIds = () => {
  return useWorkspaceStoreBase(selectActiveWorkspaceIds);
};

/**
 * Returns true if the specified workspace has at least one active chat app.
 * @param workspaceId - The ID of the workspace to check
 */
export const useIsWorkspaceActive = (workspaceId: string) => {
  return useWorkspaceStoreBase((state) =>
    selectIsWorkspaceActive(state, workspaceId),
  );
};

export function useChatAppActions() {
  const { send } = useWorkspaceDispatch();

  const expandChatApp = useCallback(
    (workspaceId: string, id: string) => {
      send({ type: "CHAT_APP_EXPANDED", workspaceId, appId: id });
    },
    [send],
  );

  const compactChatApp = useCallback(
    (workspaceId: string, id: string) => {
      send({ type: "CHAT_APP_COMPACTED", workspaceId, appId: id });
    },
    [send],
  );

  const closeChatApp = useCallback(
    (workspaceId: string, id: string) => {
      send({ type: "CHAT_APP_CLOSED", workspaceId, appId: id });
    },
    [send],
  );

  // New chat app state machine actions
  const activateChatApp = useCallback(
    (workspaceId: string, appId: string) => {
      send({ type: "CHAT_APP_ACTIVATED", workspaceId, appId });
    },
    [send],
  );

  const stashChatApp = useCallback(
    (workspaceId: string, appId: string) => {
      send({ type: "CHAT_APP_STASHED", workspaceId, appId });
    },
    [send],
  );

  const setChatAppStatus = useCallback(
    (
      workspaceId: string,
      id: string,
      status: "expanded" | "compact" | "stashed",
    ) => {
      switch (status) {
        case "expanded":
          expandChatApp(workspaceId, id);
          break;
        case "compact":
          compactChatApp(workspaceId, id);
          break;
        case "stashed":
          stashChatApp(workspaceId, id);
          break;
      }
    },
    [expandChatApp, compactChatApp, stashChatApp],
  );

  const enterFocusMode = useCallback(
    (workspaceId: string, appId: string) => {
      send({ type: "CHAT_APP_FOCUS_ENTERED", workspaceId, appId });
    },
    [send],
  );

  const exitFocusMode = useCallback(
    (workspaceId: string) => {
      send({ type: "CHAT_APP_FOCUS_EXITED", workspaceId });
    },
    [send],
  );

  const updateMaxExpandedApps = useCallback(
    (workspaceId: string, maxExpandedApps: number) => {
      send({
        type: "WORKSPACE_MAX_EXPANDED_APPS_UPDATED",
        workspaceId,
        maxExpandedApps,
      });
    },
    [send],
  );

  return {
    expandChatApp,
    compactChatApp,
    closeChatApp,
    setChatAppStatus,
    activateChatApp,
    stashChatApp,
    enterFocusMode,
    exitFocusMode,
    updateMaxExpandedApps,
  };
}

export function useWorkspaceActions() {
  const { send } = useWorkspaceDispatch();

  const createWorkspace = useCallback(
    (options: {
      name: string;
      color?: string;
      description?: string;
      icon?: string;
      availableAgents: string[];
    }) => {
      const workspaceId = `workspace-${options.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
      send({
        type: "WORKSPACE_ADDED",
        workspaceId,
        name: options.name,
        color: options.color,
        description: options.description,
        icon: options.icon,
        availableAgents: options.availableAgents,
      });
      return workspaceId;
    },
    [send],
  );

  const updateWorkspace = useCallback(
    (
      workspaceId: string,
      updates: {
        name?: string;
        color?: string;
        description?: string;
        icon?: string;
        availableAgents?: string[];
      },
    ) => {
      send({
        type: "WORKSPACE_UPDATED",
        workspaceId,
        ...updates,
      });
    },
    [send],
  );

  const archiveWorkspace = useCallback(
    (workspaceId: string) => {
      send({ type: "WORKSPACE_ARCHIVED", workspaceId });
    },
    [send],
  );

  const restoreWorkspace = useCallback(
    (workspaceId: string) => {
      send({ type: "WORKSPACE_RESTORED", workspaceId });
    },
    [send],
  );

  const activateWorkspace = useCallback(
    (workspaceId: string) => {
      send({ type: "WORKSPACE_ACTIVATED", workspaceId });
    },
    [send],
  );

  const addChatApps = useCallback(
    (apps: ChatAppConfig[]) => {
      send({ type: "CHAT_APPS_ADDED", apps });
    },
    [send],
  );

  const addAgentToWorkspace = useCallback(
    (workspaceId: string, agentId: string) => {
      send({ type: "WORKSPACE_AGENT_ADDED", workspaceId, agentId });
    },
    [send],
  );

  const removeAgentFromWorkspace = useCallback(
    (workspaceId: string, agentId: string) => {
      send({ type: "WORKSPACE_AGENT_REMOVED", workspaceId, agentId });
    },
    [send],
  );

  // Get chat app actions
  const chatAppActions = useChatAppActions();

  return {
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    restoreWorkspace,
    activateWorkspace,
    addChatApps,
    addAgentToWorkspace,
    removeAgentFromWorkspace,
    // Include all chat app actions
    ...chatAppActions,
  };
}
