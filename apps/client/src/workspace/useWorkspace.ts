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
          // Note: There's no CHAT_APP_STASHED event in the types, using compact instead
          compactChatApp(workspaceId, id);
          break;
      }
    },
    [expandChatApp, compactChatApp],
  );

  return {
    expandChatApp,
    compactChatApp,
    closeChatApp,
    setChatAppStatus,
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

  return {
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    restoreWorkspace,
    activateWorkspace,
    addChatApps,
    addAgentToWorkspace,
    removeAgentFromWorkspace,
  };
}
