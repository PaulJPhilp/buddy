import { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { Effect } from "effect";
import { WorkspacesEditorManagerError } from "./workspaces-editor-errors";

export interface WorkspacesEditorManagerApi {
  readonly setEditingWorkspace: (
    workspace: WorkspaceConfig | null
  ) => Effect.Effect<never, never, void>;
  readonly getEditingWorkspace: () => Effect.Effect<
    never,
    WorkspacesEditorManagerError,
    WorkspaceConfig | null
  >;
  readonly getAllWorkspaces: () => Effect.Effect<
    never,
    WorkspacesEditorManagerError,
    WorkspaceConfig[]
  >;
  readonly createWorkspace: (
    input: Partial<WorkspaceConfig>
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
  readonly updateWorkspace: (
    id: string,
    updates: Partial<WorkspaceConfig>
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
  readonly deleteWorkspace: (
    id: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, void>;
  readonly archiveWorkspace: (
    id: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
  readonly restoreWorkspace: (
    id: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
  readonly duplicateWorkspace: (
    id: string,
    newName?: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
  readonly exportWorkspace: (
    id: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, string>;
  readonly importWorkspace: (
    data: string
  ) => Effect.Effect<never, WorkspacesEditorManagerError, WorkspaceConfig>;
}
