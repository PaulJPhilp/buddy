import { useState } from "react";
import type { Workspace } from "@buddy/config/types/workspace";

interface WorkspacesEditorState {
  editingWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

export function useWorkspacesEditor() {
  const [state, setState] = useState<WorkspacesEditorState>({
    editingWorkspace: null,
    isLoading: false,
    error: null,
  });

  const setEditingWorkspace = (workspace: Workspace | null) => {
    setState((prev) => ({ ...prev, editingWorkspace: workspace }));
  };

  return {
    editingWorkspace: state.editingWorkspace,
    isLoading: state.isLoading,
    error: state.error,
    setEditingWorkspace,
  };
}
