"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { ChatAppsManager } from "@/managers/chatapps";
import type { ChatAppInstance } from "@/managers/chatapps/types";
import { Effect } from "effect";
import { useEffect, useState } from "react";
import { ChatApp } from "../chatapp/ChatApp";
import { useWorkspaceManager } from "./useWorkspaceManager";

interface WorkspaceUIProps {
  className?: string;
}

export function WorkspaceUI({ className }: WorkspaceUIProps) {
  const { workspaceConfig, isLoading, error } = useWorkspaceManager();
  const { runWithServices } = useEffectContext();

  // State for different chat app categories
  const [stashedChatApps, setStashedChatApps] = useState<ChatAppInstance[]>([]);
  const [compactChatApps, setCompactChatApps] = useState<ChatAppInstance[]>([]);
  const [expandedChatApps, setExpandedChatApps] = useState<ChatAppInstance[]>(
    [],
  );
  const [archivedChatApps, setArchivedChatApps] = useState<ChatAppInstance[]>(
    [],
  );
  const [closedChatApps, setClosedChatApps] = useState<ChatAppInstance[]>([]);

  console.log("WorkspaceUI state:", {
    workspaceConfig: workspaceConfig?.name,
    chatappIds: workspaceConfig?.chatappIds?.length || 0,
    activeChatApps: expandedChatApps.length,
    isLoading,
    error,
    stashedCount: stashedChatApps.length,
    compactCount: compactChatApps.length,
    expandedCount: expandedChatApps.length,
    archivedCount: archivedChatApps.length,
    closedCount: closedChatApps.length,
  });

  // Helper function to load and categorize chat apps
  const loadChatApps = async () => {
    if (!workspaceConfig?.id) {
      setStashedChatApps([]);
      setCompactChatApps([]);
      setExpandedChatApps([]);
      setArchivedChatApps([]);
      setClosedChatApps([]);
      return;
    }

    try {
      // Wait a moment for chat app registration to complete (now using direct registration)
      await new Promise((resolve) => setTimeout(resolve, 100));

      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          console.log(
            `DEBUG: Querying ChatAppsManager for workspace ID: ${workspaceConfig.id}`,
          );

          // Debug: Check all registered instances first
          const allInstances = yield* chatAppsManager.debugGetAllInstances();
          console.log("DEBUG: All registered instances:", allInstances);
          console.log(
            "DEBUG: Instance workspace IDs:",
            Object.values(allInstances).map((app) => ({
              id: app.id,
              workspaceId: app.workspaceId,
            })),
          );

          const chatAppsInWorkspace =
            yield* chatAppsManager.getChatAppsInWorkspace(workspaceConfig.id);

          console.log("DEBUG: Chat apps in workspace:", chatAppsInWorkspace);

          // Filter for stashed, compact, expanded, archived, and closed status
          const stashed = chatAppsInWorkspace.filter(
            (app) => app.status === "stashed",
          );
          const compact = chatAppsInWorkspace.filter(
            (app) => app.status === "compact",
          );
          const expanded = chatAppsInWorkspace.filter(
            (app) => app.status === "expanded",
          );
          const archived = chatAppsInWorkspace.filter(
            (app) => app.status === "archived",
          );
          const closed = chatAppsInWorkspace.filter(
            (app) => app.status === "closed",
          );

          console.log("DEBUG: Stashed chat apps:", stashed);
          console.log("DEBUG: Compact chat apps:", compact);
          console.log("DEBUG: Expanded chat apps:", expanded);
          console.log("DEBUG: Archived chat apps:", archived);
          console.log("DEBUG: Closed chat apps:", closed);

          setStashedChatApps(stashed);
          setCompactChatApps(compact);
          setExpandedChatApps(expanded);
          setArchivedChatApps(archived);
          setClosedChatApps(closed);
        }),
      );
    } catch (error) {
      console.error("Failed to load chat apps:", error);
      setStashedChatApps([]);
      setCompactChatApps([]);
      setExpandedChatApps([]);
      setArchivedChatApps([]);
      setClosedChatApps([]);
    }
  };

  // Load chat apps when workspace changes
  useEffect(() => {
    loadChatApps();
  }, [workspaceConfig?.id, runWithServices]);

  // Subscribe to ChatAppsManager state changes to refresh UI when chat app statuses change
  useEffect(() => {
    if (!workspaceConfig?.id) return;

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const chatAppsManager = yield* ChatAppsManager;

            // Subscribe to state changes
            unsubscribe = yield* chatAppsManager.subscribe((state) => {
              // Only refresh if we have chat apps in this workspace
              const chatAppsInWorkspace = Object.values(
                state.chatAppInstances,
              ).filter((app) => app.workspaceId === workspaceConfig.id);

              if (chatAppsInWorkspace.length > 0) {
                console.log(
                  "DEBUG: ChatAppsManager state changed, refreshing UI",
                );
                // Refresh the UI by re-categorizing chat apps
                const stashed = chatAppsInWorkspace.filter(
                  (app) => app.status === "stashed",
                );
                const compact = chatAppsInWorkspace.filter(
                  (app) => app.status === "compact",
                );
                const expanded = chatAppsInWorkspace.filter(
                  (app) => app.status === "expanded",
                );
                const archived = chatAppsInWorkspace.filter(
                  (app) => app.status === "archived",
                );
                const closed = chatAppsInWorkspace.filter(
                  (app) => app.status === "closed",
                );

                setStashedChatApps(stashed);
                setCompactChatApps(compact);
                setExpandedChatApps(expanded);
                setArchivedChatApps(archived);
                setClosedChatApps(closed);
              }
            });
          }),
        );
      } catch (error) {
        console.error("Failed to setup ChatAppsManager subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "Failed to cleanup ChatAppsManager subscription:",
            error,
          );
        }
      }
    };
  }, [workspaceConfig?.id, runWithServices]);

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!workspaceConfig) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">📁</div>
          <p className="text-gray-600">No workspace selected</p>
          <p className="text-sm text-gray-500 mt-2">
            Select a workspace from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  // Helper function to refresh all app states
  const refreshAppStates = async () => {
    if (!workspaceConfig?.id) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          const chatAppsInWorkspace =
            yield* chatAppsManager.getChatAppsInWorkspace(workspaceConfig.id);

          // Re-categorize apps
          const stashed = chatAppsInWorkspace.filter(
            (app) => app.status === "stashed",
          );
          const compact = chatAppsInWorkspace.filter(
            (app) => app.status === "compact",
          );
          const expanded = chatAppsInWorkspace.filter(
            (app) => app.status === "expanded",
          );
          const archived = chatAppsInWorkspace.filter(
            (app) => app.status === "archived",
          );
          const closed = chatAppsInWorkspace.filter(
            (app) => app.status === "closed",
          );

          setStashedChatApps(stashed);
          setCompactChatApps(compact);
          setExpandedChatApps(expanded);
          setArchivedChatApps(archived);
          setClosedChatApps(closed);
        }),
      );
    } catch (error) {
      console.error("Failed to refresh app states:", error);
    }
  };

  // Handle expanding a chat app (from stashed to expanded)
  const handleExpandChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.expandChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to expand chat app:", error);
    }
  };

  // Handle compacting a chat app (from expanded to compact)
  const handleCompactChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.compactChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to compact chat app:", error);
    }
  };

  // Handle stashing a chat app (minimize to stashed row)
  const handleStashChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.stashChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to stash chat app:", error);
    }
  };

  // Handle archiving a chat app (long-term storage)
  const handleArchiveChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.archiveChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to archive chat app:", error);
    }
  };

  // Handle restoring a chat app (from archived back to stashed)
  const handleRestoreChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.restoreChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to restore chat app:", error);
    }
  };

  // Handle closing a chat app (permanent closure)
  const handleCloseChatApp = async (chatAppId: string) => {
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.closeChatApp(chatAppId);
        }),
      );
      await refreshAppStates();
    } catch (error) {
      console.error("Failed to close chat app:", error);
    }
  };

  return (
    <div
      className={`workspace-ui h-full w-full flex flex-col ${className ?? ""}`}
    >
      {/* Stashed Chat Apps Row */}
      {stashedChatApps.length > 0 && (
        <div className="mb-4 flex gap-2">
          {stashedChatApps.map((app) => (
            <button
              type="button"
              key={app.id}
              onClick={() => handleExpandChatApp(app.id)}
              className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              {app.config?.name || app.id}
            </button>
          ))}
        </div>
      )}
      {/* Expanded Chat Apps */}
      <div className="flex-1 flex flex-row gap-4 p-4">
        {expandedChatApps.map((instance) => (
          <ChatApp key={instance.id} instance={instance} />
        ))}
      </div>
      {/* Optionally, render stashed, compact, archived, or closed chat apps elsewhere */}
    </div>
  );
}
