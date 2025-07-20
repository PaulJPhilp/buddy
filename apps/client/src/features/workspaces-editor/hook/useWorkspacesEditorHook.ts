import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { WorkspacesEditorManager } from "../managers/workspaces-editor-service"; // Import the plural manager

import type { WorkspaceConfig } from "@/features/application/types/AppConfig";

interface WorkspacesEditorHookState {
  readonly allWorkspaces: WorkspaceConfig[]; // Renamed from editingWorkspace to reflect plural
  readonly editingWorkspace: WorkspaceConfig | null; // For singular editing context
  readonly isLoading: boolean;
  readonly error: string | null;
}

const createDefaultState = (): WorkspacesEditorHookState => ({
  allWorkspaces: [],
  editingWorkspace: null,
  isLoading: false,
  error: null,
});

export function useWorkspacesEditor() {
  const { runWithServices } = useEffectContext();
  const [state, setState] =
    useState<WorkspacesEditorHookState>(createDefaultState);

  const updateState = useCallback(
    (updates: Partial<WorkspacesEditorHookState>) => {
      setState((prevState) => ({ ...prevState, ...updates }));
    },
    []
  );

  const handleError = useCallback(
    (error: unknown, operation: string) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unknown error in ${operation}`;
      console.error(`useWorkspacesEditor hook ${operation} error:`, error);
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Function to set the currently editing workspace (for singular editor context)
  const setEditingWorkspace = useCallback(
    (workspace: WorkspaceConfig | null) => {
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.setEditingWorkspace(workspace)),
            Effect.tap(() =>
              updateState({ editingWorkspace: workspace, error: null })
            ),
            Effect.catchAll((e) => {
              handleError(e, "setEditingWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Load all workspaces (plural operations)
  const loadAllWorkspaces = useCallback(() => {
    updateState({ isLoading: true, error: null });
    Effect.runPromiseExit(
      runWithServices(
        WorkspacesEditorManager.pipe(
          Effect.flatMap((manager) => manager.getAllWorkspaces()),
          Effect.tap((workspaces) =>
            updateState({ allWorkspaces: workspaces, isLoading: false })
          ),
          Effect.catchAll((e) => {
            handleError(e, "loadAllWorkspaces");
            return Effect.fail(e); // Propagate error
          })
        )
      )
    );
  }, [runWithServices, updateState, handleError]);

  // Create Workspace
  const createWorkspace = useCallback(
    (input: Partial<WorkspaceConfig>) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.createWorkspace(input)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after creation
            Effect.catchAll((e) => {
              handleError(e, "createWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Update Workspace
  const updateWorkspace = useCallback(
    (id: string, updates: Partial<WorkspaceConfig>) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.updateWorkspace(id, updates)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after update
            Effect.catchAll((e) => {
              handleError(e, "updateWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Delete Workspace
  const deleteWorkspace = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.deleteWorkspace(id)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after deletion
            Effect.catchAll((e) => {
              handleError(e, "deleteWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Archive Workspace
  const archiveWorkspace = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.archiveWorkspace(id)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after archival
            Effect.catchAll((e) => {
              handleError(e, "archiveWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Restore Workspace
  const restoreWorkspace = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.restoreWorkspace(id)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after restoration
            Effect.catchAll((e) => {
              handleError(e, "restoreWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Duplicate Workspace
  const duplicateWorkspace = useCallback(
    (id: string, newName?: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) =>
              manager.duplicateWorkspace(id, newName)
            ),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after duplication
            Effect.catchAll((e) => {
              handleError(e, "duplicateWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Export Workspace
  const exportWorkspace = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      return Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.exportWorkspace(id)),
            Effect.tap(() => updateState({ isLoading: false, error: null })), // No reload, just clear loading
            Effect.catchAll((e) => {
              handleError(e, "exportWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Import Workspace
  const importWorkspace = useCallback(
    (data: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspacesEditorManager.pipe(
            Effect.flatMap((manager) => manager.importWorkspace(data)),
            Effect.tap(() => loadAllWorkspaces()), // Reload list after import
            Effect.catchAll((e) => {
              handleError(e, "importWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError, loadAllWorkspaces]
  );

  // Load initial workspaces on mount
  useEffect(() => {
    loadAllWorkspaces();
  }, [loadAllWorkspaces]);

  return {
    allWorkspaces: state.allWorkspaces,
    editingWorkspace: state.editingWorkspace,
    isLoading: state.isLoading,
    error: state.error,
    setEditingWorkspace, // For setting a workspace for singular editing
    loadAllWorkspaces, // For refreshing the list externally
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    archiveWorkspace,
    restoreWorkspace,
    duplicateWorkspace,
    exportWorkspace,
    importWorkspace,
  };
}
