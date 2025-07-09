import { Schema as S } from "effect";

// --- Command Definitions ---

/**
 * Command to create a new workspace.
 * Requires a name, and can optionally take a description.
 */
export class CreateWorkspace extends S.Class<CreateWorkspace>(
  "CreateWorkspace"
)({
  _tag: S.Literal("CreateWorkspace"),
  name: S.String,
  description: S.optional(S.String),
}) {}

/**
 * Command to update an existing workspace.
 * Requires the workspace ID and a partial set of new data.
 */
export class UpdateWorkspace extends S.Class<UpdateWorkspace>(
  "UpdateWorkspace"
)({
  _tag: S.Literal("UpdateWorkspace"),
  workspaceId: S.String,
  updates: S.Struct({
    name: S.optional(S.String),
    description: S.optional(S.String),
  }),
}) {}

/**
 * Command to delete a workspace.
 * Requires the workspace ID.
 */
export class DeleteWorkspace extends S.Class<DeleteWorkspace>(
  "DeleteWorkspace"
)({
  _tag: S.Literal("DeleteWorkspace"),
  workspaceId: S.String,
}) {}

/**
 * A union type representing all possible commands for the Workspace domain.
 * This is useful for the CommandBus and handlers to perform type narrowing.
 */
export type WorkspaceCommand =
  | CreateWorkspace
  | UpdateWorkspace
  | DeleteWorkspace;
