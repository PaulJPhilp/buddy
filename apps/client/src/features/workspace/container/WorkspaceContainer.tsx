import React, { useEffect } from "react";
import { WorkspaceUI } from "../components/WorkspaceUI";
import { useWorkspaceManager } from "../hooks/useWorkspaceManager";

export function WorkspaceContainer() {
  const {
    workspaceConfig,
    availableChatApps,
    availableAgents,
    activeChatApps,
    isLoading,
    error,
    isConfigLoaded,
    switchWorkspace,
    loadWorkspaceData,
  } = useWorkspaceManager();

  // Initial load of workspace data or config (if not already handled by manager's internal init)
  // The useWorkspaceManager hook already handles an initial load of the workspace index
  // and switches to the first workspace. This useEffect ensures that if for any reason
  // workspaceConfig is null, we try to load it.
  useEffect(() => {
    if (!workspaceConfig && !isLoading && !error && !isConfigLoaded) {
      // This branch might be hit if the initial load in useWorkspaceManager is slow or failed without setting error.
      // Explicitly calling loadWorkspaceData here can act as a fallback.
      loadWorkspaceData();
    }
  }, [workspaceConfig, isLoading, error, isConfigLoaded, loadWorkspaceData]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Loading workspace...
          </p>
          <p className="text-sm text-gray-500">
            Setting up your workspace environment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-red-200">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-medium text-red-700 mb-2">
            Workspace Error
          </p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!workspaceConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            No workspace selected
          </p>
          <p className="text-sm text-gray-500">
            Please select a workspace to continue
          </p>
        </div>
      </div>
    );
  }

  // Pass all necessary state and actions to WorkspaceUI
  return (
    <WorkspaceUI
      workspaceConfig={workspaceConfig}
      availableChatApps={availableChatApps}
      availableAgents={availableAgents}
      activeChatApps={activeChatApps}
      isLoading={isLoading}
      error={error}
    />
  );
}
