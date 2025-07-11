"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { ChatAppsManager } from "@/managers/chatapps";
import type { ChatAppInstance } from "@/managers/chatapps/types";
import { Effect } from "effect";
import React, { useEffect, useState } from "react";
import { useWorkspaceManager } from "./useWorkspaceManager";

interface WorkspaceUIProps {
  className?: string;
}

export function WorkspaceUI({ className }: WorkspaceUIProps) {
  const { runWithServices } = useEffectContext();
  const [stashedChatApps, setStashedChatApps] = useState<ChatAppInstance[]>([]);
  const [compactChatApps, setCompactChatApps] = useState<ChatAppInstance[]>([]);
  const [expandedChatApps, setExpandedChatApps] = useState<ChatAppInstance[]>(
    [],
  );
  const [archivedChatApps, setArchivedChatApps] = useState<ChatAppInstance[]>(
    [],
  );
  const [closedChatApps, setClosedChatApps] = useState<ChatAppInstance[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  // Get workspace data from useWorkspaceManager hook
  const {
    workspaceConfig,
    availableChatApps,
    activeChatApps,
    isLoading,
    error,
  } = useWorkspaceManager();

  // Debug logging
  console.log("WorkspaceUI state:", {
    workspaceConfig: workspaceConfig
      ? { id: workspaceConfig.id, name: workspaceConfig.name }
      : null,
    availableChatApps: availableChatApps.length,
    activeChatApps: activeChatApps.length,
    isLoading,
    error,
    timestamp: new Date().toISOString(),
  });

  // Load stashed and expanded chat apps from ChatAppsManager
  useEffect(() => {
    if (!workspaceConfig?.id) {
      setStashedChatApps([]);
      setCompactChatApps([]);
      setExpandedChatApps([]);
      setArchivedChatApps([]);
      setClosedChatApps([]);
      return;
    }

    const loadChatApps = async () => {
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

    loadChatApps();
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

    await new Promise((resolve) => setTimeout(resolve, 100));
    await runWithServices(
      Effect.gen(function* () {
        const chatAppsManager = yield* ChatAppsManager;
        const chatAppsInWorkspace =
          yield* chatAppsManager.getChatAppsInWorkspace(workspaceConfig.id);

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
  };

  // Handle expanding a stashed chat app
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

  // Handle stashing an expanded chat app
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

  // Handle archiving a chat app
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

  // Handle restoring an archived chat app (back to stashed)
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
    <div className={`h-full p-4 ${className}`}>
      {/* Stashed Chat Apps Row - Badge View */}
      {stashedChatApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Stashed Chat Apps
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stashedChatApps.map((chatApp) => (
              <button
                type="button"
                key={chatApp.id}
                onClick={() => handleExpandChatApp(chatApp.id)}
                className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="text-sm font-medium text-blue-900">
                  {chatApp.config?.name || chatApp.id}
                </span>
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Chat Apps - Small Card View */}
      {compactChatApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Compact Chat Apps
          </h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {compactChatApps.map((chatApp) => (
              <div
                key={chatApp.id}
                className="bg-white rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">
                    {chatApp.config?.name || chatApp.id}
                  </h3>
                  <div className="flex gap-1 ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandChatApp(chatApp.id);
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
                      title="Expand"
                    >
                      ↗
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStashChatApp(chatApp.id);
                      }}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded transition-colors"
                      title="Stash"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveChatApp(chatApp.id);
                      }}
                      className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded transition-colors"
                      title="Archive"
                    >
                      📦
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {chatApp.config?.description || `Status: ${chatApp.status}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Chat Apps - Card View with Compact/Stash Buttons */}
      {expandedChatApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Active Chat Apps
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expandedChatApps.map((chatApp) => (
              <div
                key={chatApp.id}
                className="bg-white rounded-lg shadow border p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {chatApp.config?.name || chatApp.id}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompactChatApp(chatApp.id)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStashChatApp(chatApp.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      Stash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveChatApp(chatApp.id)}
                      className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded transition-colors"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCloseChatApp(chatApp.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                {chatApp.config?.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {chatApp.config.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  Status: {chatApp.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Active Chat Apps (from useWorkspaceManager) */}
      {activeChatApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Legacy Active Chat Apps
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeChatApps.map((chatApp) => (
              <div
                key={chatApp.id}
                className="bg-white rounded-lg shadow border p-4"
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  {chatApp.name}
                </h3>
                {chatApp.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {chatApp.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  Agent: {chatApp.agentId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archived Chat Apps - Collapsible Section */}
      {archivedChatApps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Archived Chat Apps ({archivedChatApps.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              {showArchived ? "Hide" : "Show"}
              <span
                className={`transform transition-transform ${showArchived ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
          </div>

          {showArchived && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {archivedChatApps.map((chatApp) => (
                  <div
                    key={chatApp.id}
                    className="bg-white rounded-lg shadow-sm border p-3 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-700 text-sm">
                        {chatApp.config?.name || chatApp.id}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleRestoreChatApp(chatApp.id)}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded transition-colors"
                          title="Restore to workspace"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCloseChatApp(chatApp.id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition-colors"
                          title="Close permanently"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {chatApp.config?.description || "Archived chat app"}
                    </div>
                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Archived
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Closed Chat Apps - Collapsible Section */}
      {closedChatApps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Closed Chat Apps ({closedChatApps.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowClosed(!showClosed)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              {showClosed ? "Hide" : "Show"}
              <span
                className={`transform transition-transform ${showClosed ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
          </div>

          {showClosed && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-700 mb-3 bg-red-100 p-2 rounded">
                ⚠️ These chat apps have been permanently closed and cannot be
                restored.
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {closedChatApps.map((chatApp) => (
                  <div
                    key={chatApp.id}
                    className="bg-white rounded-lg shadow-sm border p-3 opacity-60"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-600 text-sm line-through">
                        {chatApp.config?.name || chatApp.id}
                      </h3>
                      <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Closed
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {chatApp.config?.description ||
                        "Permanently closed chat app"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Closed:{" "}
                      {chatApp.lastStatusChangeAt
                        ? new Date(
                            chatApp.lastStatusChangeAt,
                          ).toLocaleDateString()
                        : "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
