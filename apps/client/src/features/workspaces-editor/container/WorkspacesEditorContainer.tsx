import { useWorkspaceManager } from "@/components/workspace/useWorkspaceManager"; // Import useWorkspaceManager
import { useEffect } from "react"; // Import useEffect for initialization
import { ChatAppList } from "../chatapps-editor/components/ChatAppList";
import { ChatAppsPanel } from "../chatapps-editor/components/ChatAppsPanel";
import { WorkspaceList } from "../components/WorkspaceList";
import { useWorkspacesEditor } from "../hooks/useWorkspacesEditorHook";
import { ChatAppForm } from "../workspace-editor/components/ChatAppForm";
import { WorkspaceForm } from "../workspace-editor/components/WorkspaceForm";

export function WorkspacesEditorContainer() {
  const {
    editingWorkspace,
    isLoading: isEditorLoading,
    error: editorError,
    setEditingWorkspace,
  } = useWorkspacesEditor();

  // Get overall workspace data for stats and general loading/error
  const {
    stats,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
    initialize,
    isInitialized,
  } = useWorkspaceManager();

  // Initialize the workspace manager on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const isLoading = isEditorLoading || isWorkspaceLoading; // Combine loading states
  const error = editorError || workspaceError; // Combine error states

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
            <p className="text-gray-600 mt-2">
              Manage your workspaces, organize your projects, and customize your
              environment
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalWorkspaces}
              </div>
              <div className="text-sm text-gray-600">Total Workspaces</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {stats.activeWorkspaces}
              </div>
              <div className="text-sm text-gray-600">Active Workspaces</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.archivedWorkspaces}
              </div>
              <div className="text-sm text-gray-600">Archived Workspaces</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {stats.operationCount}
              </div>
              <div className="text-sm text-gray-600">Operations</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div>Loading workspaces...</div>
      ) : editingWorkspace ? (
        <div>
          <p className="mb-2">
            Currently editing:{" "}
            <span className="font-semibold">{editingWorkspace.name}</span> (ID:{" "}
            {editingWorkspace.id})
          </p>
          {/* Placeholder for future forms and panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <WorkspaceForm /> */}
            {/* <ChatAppForm /> */}
            {/* <WorkspaceList /> */}
            {/* <ChatAppsPanel /> */}
            {/* <ChatAppList /> */}
          </div>
          <button
            className="mt-4 p-2 bg-blue-500 text-white rounded"
            onClick={() => setEditingWorkspace(null)}
          >
            Clear Editing Workspace
          </button>
        </div>
      ) : (
        <div>
          <p>No workspace is currently selected for editing.</p>
          <button
            className="mt-4 p-2 bg-green-500 text-white rounded"
            onClick={() => {
              // Example: set a dummy workspace for editing
              setEditingWorkspace({
                id: "new-workspace",
                name: "New Workspace",
                description: "A brand new workspace",
                chatappIds: [],
                agentIds: [],
                permissions: {
                  canAddApps: true,
                  canRemoveApps: true,
                  canModifyLayout: true,
                  canChangeSettings: true,
                  canInviteUsers: false,
                  canManagePermissions: false,
                },
                isDefault: false,
                isArchived: false,
                maxExpandedApps: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }}
          >
            Start Editing New Workspace (Example)
          </button>
        </div>
      )}
    </div>
  );
}
