"use client";

import type { WorkspaceModel } from "@domain/workspace";
import React, { useCallback, useEffect, useState } from "react";
import { useAppContainer } from "./AppContainer";

interface AppManagementUIProps {
  className?: string;
  onClose?: () => void;
}

export function AppManagementUI({
  className = "",
  onClose,
}: AppManagementUIProps) {
  const {
    state,
    isInitialized,
    error,
    loadConfig,
    setCurrentWorkspace,
    getCurrentWorkspace,
    getWorkspaces,
    renderAppShell,
  } = useAppContainer();

  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<WorkspaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [configPath, setConfigPath] = useState(
    "/static/configs/workspaces/index.json",
  );

  // Load workspaces and current workspace
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        const [allWorkspaces, current] = await Promise.all([
          getWorkspaces(),
          getCurrentWorkspace(),
        ]);
        setWorkspaces(allWorkspaces);
        setCurrentWorkspaceState(current);
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      }
    };

    if (isInitialized) {
      loadWorkspaceData();
    }
  }, [isInitialized, getWorkspaces, getCurrentWorkspace]);

  // Handle config loading
  const handleLoadConfig = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await loadConfig(configPath);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to load config",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadConfig, configPath]);

  // Handle workspace switching
  const handleWorkspaceSwitch = useCallback(
    async (workspaceId: string) => {
      setIsLoading(true);
      setActionError(null);
      try {
        await setCurrentWorkspace(workspaceId);
        const updated = await getCurrentWorkspace();
        setCurrentWorkspaceState(updated);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to switch workspace",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentWorkspace, getCurrentWorkspace],
  );

  // Handle app shell rendering
  const handleRenderShell = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await renderAppShell();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to render app shell",
      );
    } finally {
      setIsLoading(false);
    }
  }, [renderAppShell]);

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-red-800">
            App Management Error
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing app management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">App Management</h2>
        {onClose && (
          // biome-ignore lint/a11y/useButtonType: <explanation>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Action Error Display */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700">{actionError}</p>
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              onClick={() => setActionError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* App State Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Application State
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  isInitialized
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isInitialized ? "Initialized" : "Loading"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Config Loaded:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  state?.isConfigLoaded
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {state?.isConfigLoaded ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Shell Rendered:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  state?.isAppShellRendered
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {state?.isAppShellRendered ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 text-gray-800">
                {state?.lastUpdated
                  ? new Date(state.lastUpdated).toLocaleTimeString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Management */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Configuration</h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="config-path"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Config Path
              </label>
              <input
                id="config-path"
                type="text"
                value={configPath}
                onChange={(e) => setConfigPath(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/static/configs/workspaces/index.json"
              />
            </div>
            <button
              type="button"
              onClick={handleLoadConfig}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Load Configuration"}
            </button>
          </div>
        </div>

        {/* Workspace Management */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Workspace Management
          </h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="current-workspace"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Workspace
              </label>
              <input
                id="current-workspace"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                value={
                  currentWorkspace
                    ? currentWorkspace.name
                    : "No workspace selected"
                }
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            </div>

            {workspaces.length > 0 && (
              <div>
                <label
                  htmlFor="workspace-switch"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Switch Workspace
                </label>
                <select
                  id="workspace-switch"
                  onChange={(e) => handleWorkspaceSwitch(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentWorkspace?.id || ""}
                >
                  <option value="">Select a workspace...</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-sm text-gray-600">
              Available Workspaces: {workspaces.length}
            </div>
          </div>
        </div>

        {/* App Shell Management */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">App Shell</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRenderShell}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Rendering..." : "Render App Shell"}
            </button>
            <div className="text-sm text-gray-600">
              Renders the main application shell and initializes core UI
              components.
            </div>
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Debug Information
            </h3>
            <div className="bg-gray-100 rounded p-3 text-xs font-mono">
              <pre>{JSON.stringify(state, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
