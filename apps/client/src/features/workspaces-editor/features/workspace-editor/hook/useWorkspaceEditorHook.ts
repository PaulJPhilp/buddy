import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceEditor } from "../managers/service"; // Import the singular manager

import type { WorkspaceConfig } from "@/features/application/types/AppConfig";

interface WorkspaceEditorHookState {
  readonly currentWorkspace: WorkspaceConfig | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const createDefaultHookState = (): WorkspaceEditorHookState => ({
  currentWorkspace: null,
  isLoading: false,
  error: null,
});

export function useWorkspaceEditor() {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<WorkspaceEditorHookState>(
    createDefaultHookState
  );

  const updateState = useCallback(
    (updates: Partial<WorkspaceEditorHookState>) => {
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
      console.error(`useWorkspaceEditor hook ${operation} error:`, error);
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Function to set the workspace for editing (local state only)
  const setWorkspace = useCallback(
    (workspace: WorkspaceConfig | null) => {
      Effect.runPromiseExit(
        runWithServices(
          WorkspaceEditor.pipe(
            Effect.flatMap((manager) => manager.setWorkspace(workspace)),
            Effect.tap(() =>
              updateState({ currentWorkspace: workspace, error: null })
            ),
            Effect.catchAll((e) => {
              handleError(e, "setWorkspace (local)");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Load a workspace by ID
  const loadWorkspaceById = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspaceEditor.pipe(
            Effect.flatMap((manager) => manager.loadWorkspaceById(id)),
            Effect.tap((workspace) =>
              updateState({ currentWorkspace: workspace, isLoading: false })
            ),
            Effect.catchAll((e) => {
              handleError(e, "loadWorkspaceById");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Save (create or update) a workspace
  const saveWorkspace = useCallback(
    (workspace: WorkspaceConfig) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspaceEditor.pipe(
            Effect.flatMap((manager) => manager.saveWorkspace(workspace)),
            Effect.tap((savedWorkspace) =>
              updateState({
                currentWorkspace: savedWorkspace,
                isLoading: false,
              })
            ),
            Effect.catchAll((e) => {
              handleError(e, "saveWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Delete a workspace
  const deleteWorkspace = useCallback(
    (id: string) => {
      updateState({ isLoading: true, error: null });
      Effect.runPromiseExit(
        runWithServices(
          WorkspaceEditor.pipe(
            Effect.flatMap((manager) => manager.deleteWorkspace(id)),
            Effect.tap(() =>
              updateState({ currentWorkspace: null, isLoading: false })
            ),
            Effect.catchAll((e) => {
              handleError(e, "deleteWorkspace");
              return Effect.fail(e); // Propagate error
            })
          )
        )
      );
    },
    [runWithServices, updateState, handleError]
  );

  // Load initial workspace on mount if an ID is somehow pre-set (unlikely for singular editor without explicit ID)
  useEffect(() => {
    // If you need to load an initial workspace based on some context (e.g., URL param),
    // you would call loadWorkspaceById here.
    // For now, it will just get the initial Ref state.
    updateState({ isLoading: true, error: null });
    Effect.runPromiseExit(
      runWithServices(
        WorkspaceEditor.pipe(
          Effect.flatMap((manager) => manager.getWorkspace()),
          Effect.tap((workspace) =>
            updateState({ currentWorkspace: workspace, isLoading: false })
          ),
          Effect.catchAll((e) => {
            handleError(e, "getWorkspace (initial load)");
            return Effect.fail(e); // Propagate error
          })
        )
      )
    );
  }, [runWithServices, updateState, handleError]);

  return {
    currentWorkspace: state.currentWorkspace,
    isLoading: state.isLoading,
    error: state.error,
    setWorkspace, // For local state manipulation by UI
    loadWorkspaceById,
    saveWorkspace,
    deleteWorkspace,
  };
}
