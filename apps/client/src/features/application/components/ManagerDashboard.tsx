"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { CoreManager } from "@/features/application/managers/core"; // Updated path
import type { CoreManagerState } from "@/features/application/managers/core/types"; // Updated path
import { ChatManager } from "@/features/chatapps/chatapp/managers/chat"; // Updated path
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps"; // Updated path
import type {
  ChatAppInstance,
  ChatAppsManagerState,
  ChatAppsManagerStats,
} from "@/features/chatapps/managers/chatapps/types"; // Updated path
import { WorkspaceComponent } from "@/features/workspace/managers/workspace-manager/service"; // Updated path
import { Effect } from "effect";
import React, { useCallback, useEffect, useState } from "react";

interface ManagerDashboardProps {
  className?: string;
  onClose?: () => void;
}

interface ManagerStatus {
  name: string;
  status: "online" | "offline" | "error" | "loading";
  lastUpdated: Date | null;
  error?: string;
  metrics?: Record<string, any>;
}

export function ManagerDashboard({
  className = "",
  onClose,
}: ManagerDashboardProps) {
  const { runWithServices } = useEffectContext();

  const [managerStatuses, setManagerStatuses] = useState<
    Record<string, ManagerStatus>
  >({
    core: { name: "Core Manager", status: "loading", lastUpdated: null },
    chat: { name: "Chat Manager", status: "loading", lastUpdated: null },
    chatapps: {
      name: "ChatApps Manager",
      status: "loading",
      lastUpdated: null,
    },
    workspace: {
      name: "Workspace Manager",
      status: "loading", // Set to loading initially
      lastUpdated: null,
      metrics: {},
    },
  });

  const [chatAppsState, setChatAppsState] =
    useState<ChatAppsManagerState | null>(null);
  const [coreState, setCoreState] = useState<CoreManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load manager statuses
  const loadManagerStatuses = useCallback(async () => {
    try {
      const results = await runWithServices(
        Effect.gen(function* () {
          // Get Core Manager status
          const coreManager = yield* CoreManager;
          const coreState = yield* coreManager.getState();

          // Get Chat Manager status
          const chatManager = yield* ChatManager;
          const chatState = yield* chatManager.getState();

          // Get ChatApps Manager status and stats
          const chatAppsManager = yield* ChatAppsManager;
          const chatAppsState = yield* chatAppsManager.getState();
          const chatAppsStats = yield* chatAppsManager.getStats();

          // Get Workspace Component status
          const workspaceComponent = yield* WorkspaceComponent;
          const workspaceState = yield* workspaceComponent.getState();

          return {
            core: { state: coreState },
            chat: { state: chatState },
            chatapps: { state: chatAppsState, stats: chatAppsStats },
            workspace: { state: workspaceState },
          };
        }),
      );

      setCoreState(results.core.state);
      setChatAppsState(results.chatapps.state);

      setManagerStatuses({
        core: {
          name: "Core Manager",
          status: results.core.state.isInitialized ? "online" : "offline",
          lastUpdated: new Date(results.core.state.lastUpdated),
          metrics: {
            initialized: results.core.state.isInitialized,
            loading: results.core.state.isLoading,
          },
        },
        chat: {
          name: "Chat Manager",
          status: results.chat.state.isInitialized ? "online" : "offline",
          lastUpdated: new Date(results.chat.state.lastUpdated),
          metrics: {
            conversations: results.chat.state.stats?.totalConversations || 0,
            messages: results.chat.state.stats?.totalMessages || 0,
            active: results.chat.state.stats?.activeConversations || 0,
          },
        },
        chatapps: {
          name: "ChatApps Manager",
          status: results.chatapps.state.chatAppInstances
            ? "online"
            : "offline",
          lastUpdated: results.chatapps.state.lastUpdated,
          metrics: {
            totalApps: results.chatapps.stats.totalApps,
            activeApps: results.chatapps.stats.activeApps,
            expandedApps: results.chatapps.stats.expandedApps,
            workspaces: results.chatapps.stats.totalWorkspaces,
          },
        },
        workspace: {
          name: "Workspace Manager",
          status: results.workspace.state.isInitialized ? "online" : "offline",
          lastUpdated: results.workspace.state.lastUpdated || null, // Use actual lastUpdated
          metrics: {
            configLoaded: results.workspace.state.isConfigLoaded,
            workspaceId: results.workspace.state.workspaceConfig?.id || "N/A",
            activeChatApps: results.workspace.state.activeChatApps.length,
          },
        },
      });
    } catch (err) {
      console.error("Failed to load manager statuses:", err);
      setActionError(
        err instanceof Error ? err.message : "Failed to load manager statuses",
      );
    }
  }, [runWithServices]);

  // Auto-refresh statuses
  useEffect(() => {
    loadManagerStatuses();
    const interval = setInterval(loadManagerStatuses, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadManagerStatuses]);

  // Manager control actions
  const handleManagerAction = useCallback(
    async (managerName: string, action: string) => {
      setIsLoading(true);
      setActionError(null);

      try {
        await runWithServices(
          Effect.gen(function* () {
            switch (managerName) {
              case "core": {
                const coreManager = yield* CoreManager;
                switch (action) {
                  case "start":
                    yield* coreManager.dispatch({ _tag: "StartCoreManager" });
                    break;
                  case "stop":
                    yield* coreManager.dispatch({ _tag: "StopCoreManager" });
                    break;
                  case "restart":
                    yield* coreManager.dispatch({ _tag: "RestartCoreManager" });
                    break;
                  case "reset":
                    yield* coreManager.dispatch({ _tag: "ResetCoreState" });
                    break;
                }
                break;
              }

              case "chatapps": {
                const chatAppsManager = yield* ChatAppsManager;
                switch (action) {
                  case "reset":
                    yield* chatAppsManager.dispatch({
                      _tag: "ResetChatAppsState",
                    });
                    break;
                  case "exitFocus":
                    yield* chatAppsManager.dispatch({ _tag: "ExitFocusMode" });
                    break;
                  case "stashAll": {
                    const state = yield* chatAppsManager.getState();
                    const workspaceIds = [
                      ...new Set(
                        Object.values(state.chatAppInstances).map(
                          (app) => app.workspaceId,
                        ),
                      ),
                    ];
                    for (const workspaceId of workspaceIds) {
                      yield* chatAppsManager.dispatch({
                        _tag: "StashAllAppsInWorkspace",
                        workspaceId,
                      });
                    }
                    break;
                  }
                }
                break;
              }

              case "chat": {
                const chatManager = yield* ChatManager;
                switch (action) {
                  case "reset":
                    yield* chatManager.dispatch({ _tag: "ResetChatState" });
                    break;
                }
                break;
              }
            }
          }),
        );

        // Refresh statuses after action
        await loadManagerStatuses();
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : `Failed to execute ${action} on ${managerName}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [runWithServices, loadManagerStatuses],
  );

  const getStatusColor = (status: ManagerStatus["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "loading":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Manager Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadManagerStatuses}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Action Error Display */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Manager Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(managerStatuses).map(([key, manager]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{manager.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(manager.status)}`}
                >
                  {manager.status}
                </span>
              </div>

              {manager.metrics && (
                <div className="space-y-1 text-sm text-gray-600">
                  {Object.entries(manager.metrics).map(([metricKey, value]) => (
                    <div key={metricKey} className="flex justify-between">
                      <span className="capitalize">{metricKey}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                {manager.lastUpdated
                  ? `Updated: ${manager.lastUpdated.toLocaleTimeString()}`
                  : "Never updated"}
              </div>
            </div>
          ))}
        </div>

        {/* ChatApps Manager Detailed View */}
        {chatAppsState && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              ChatApps Manager Details
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {chatAppsState.stats.totalApps}
                </div>
                <div className="text-sm text-gray-600">Total Apps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {chatAppsState.stats.expandedApps}
                </div>
                <div className="text-sm text-gray-600">Expanded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {chatAppsState.stats.stashedApps}
                </div>
                <div className="text-sm text-gray-600">Stashed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {chatAppsState.stats.totalWorkspaces}
                </div>
                <div className="text-sm text-gray-600">Workspaces</div>
              </div>
            </div>

            {/* Focus Mode Status */}
            {chatAppsState.focusMode.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-800">
                      Focus Mode Active
                    </span>
                    <div className="text-sm text-blue-600">
                      App: {chatAppsState.focusMode.focusedAppId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleManagerAction("chatapps", "exitFocus")}
                    disabled={isLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Exit Focus
                  </button>
                </div>
              </div>
            )}

            {/* Active ChatApps */}
            {Object.keys(chatAppsState.chatAppInstances).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Active ChatApps
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.values(chatAppsState.chatAppInstances).map(
                    (app: ChatAppInstance) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between text-sm bg-white rounded p-2"
                      >
                        <div>
                          <span className="font-medium">{app.id}</span>
                          <span className="text-gray-500 ml-2">
                            ({app.workspaceId})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              app.status === "expanded"
                                ? "bg-green-100 text-green-800"
                                : app.status === "compact"
                                  ? "bg-blue-100 text-blue-800"
                                  : app.status === "stashed"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {app.status}
                          </span>
                          {app.isActive && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manager Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Core Manager Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Core Manager</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleManagerAction("core", "start")}
                disabled={isLoading || managerStatuses.core.status === "online"}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => handleManagerAction("core", "restart")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={() => handleManagerAction("core", "stop")}
                disabled={
                  isLoading || managerStatuses.core.status === "offline"
                }
                className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={() => handleManagerAction("core", "reset")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                Reset State
              </button>
            </div>
          </div>

          {/* ChatApps Manager Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">ChatApps Manager</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleManagerAction("chatapps", "stashAll")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Stash All Apps
              </button>
              <button
                type="button"
                onClick={() => handleManagerAction("chatapps", "exitFocus")}
                disabled={isLoading || !chatAppsState?.focusMode.isActive}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                Exit Focus Mode
              </button>
              <button
                type="button"
                onClick={() => handleManagerAction("chatapps", "reset")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                Reset State
              </button>
            </div>
          </div>

          {/* Chat Manager Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Chat Manager</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleManagerAction("chat", "reset")}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                Reset State
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            System Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Environment:</span>
              <span className="ml-2 font-mono">{process.env.NODE_ENV}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Refresh:</span>
              <span className="ml-2 font-mono">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Effect Services:</span>
              <span className="ml-2 font-mono">Active</span>
            </div>
            <div>
              <span className="text-gray-600">Command Bus:</span>
              <span className="ml-2 font-mono">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
