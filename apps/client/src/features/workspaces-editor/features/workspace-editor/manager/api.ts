import { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { Effect } from "effect";
import { WorkspaceEditorError } from "./errors";

export interface WorkspaceEditorApi {
  readonly setWorkspace: (
    workspace: WorkspaceConfig | null
  ) => Effect.Effect<never, never, void>;
  readonly getWorkspace: () => Effect.Effect<
    never,
    WorkspaceEditorError,
    WorkspaceConfig | null
  >;
  readonly loadWorkspaceById: (
    id: string
  ) => Effect.Effect<never, WorkspaceEditorError, WorkspaceConfig>;
  readonly saveWorkspace: (
    workspace: WorkspaceConfig
  ) => Effect.Effect<never, WorkspaceEditorError, WorkspaceConfig>;
  readonly deleteWorkspace: (
    id: string
  ) => Effect.Effect<never, WorkspaceEditorError, void>;
}
