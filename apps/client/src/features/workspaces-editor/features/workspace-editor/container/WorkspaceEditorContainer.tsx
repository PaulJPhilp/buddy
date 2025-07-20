import type { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { ChatAppForm } from "../components/ChatAppForm";
import { WorkspaceForm } from "../components/WorkspaceForm";
import { useWorkspaceEditor } from "../hooks/useWorkspaceEditorHook";

export function WorkspaceEditorContainer() {
  const { currentWorkspace, isLoading, error, setWorkspace } =
    useWorkspaceEditor();

  if (isLoading) {
    return <div>Loading singular workspace editor...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading singular workspace editor: {error}
      </div>
    );
  }

  const handleSaveWorkspace = (updatedWorkspace: WorkspaceConfig) => {
    // This is where you would typically call a manager method to save the workspace
    console.log("Saving singular workspace:", updatedWorkspace);
    setWorkspace(updatedWorkspace);
    // In a real scenario, you'd likely navigate away or show a success message
  };

  const handleCancelEditing = () => {
    setWorkspace(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Singular Workspace Editor</h1>
      {currentWorkspace ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WorkspaceForm
            workspace={currentWorkspace}
            onSubmit={handleSaveWorkspace}
            onCancel={handleCancelEditing}
            isEditing={true}
          />
          <ChatAppForm
            // Assuming ChatAppForm also takes a workspace context or a specific chat app to edit
            // For now, it's just a placeholder
            onSubmit={(values) =>
              console.log("Chat App Form submitted:", values)
            }
            onCancel={() => {}}
          />
        </div>
      ) : (
        <div>
          <p>No workspace is currently selected for singular editing.</p>
          <button
            className="mt-4 p-2 bg-green-500 text-white rounded"
            onClick={() => {
              // Example: set a dummy workspace for editing
              setWorkspace({
                id: "singular-new-workspace-id",
                name: "Singular New Workspace",
                description: "A brand new workspace for singular editing",
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
            Start Editing New Singular Workspace (Example)
          </button>
        </div>
      )}
    </div>
  );
}
