import { Schema as S } from "effect";

/**
 * Represents a single workspace in the application.
 * This is the core data model for the Workspace domain.
 */
export class Workspace extends S.Class<Workspace>("Workspace")({
  id: S.String,
  name: S.String,
  description: S.String.pipe(S.optional),
  chatappIds: S.mutable(S.Array(S.String)),
  agentIds: S.mutable(S.Array(S.String)),
  permissions: S.Struct({
    canAddApps: S.Boolean,
    canRemoveApps: S.Boolean,
    canModifyLayout: S.Boolean,
    canChangeSettings: S.Boolean,
    canInviteUsers: S.Boolean,
    canManagePermissions: S.Boolean,
  }),
  isDefault: S.Boolean.pipe(S.optional),
  isArchived: S.Boolean.pipe(S.optional),
  maxExpandedApps: S.Number.pipe(S.optional),
  createdAt: S.String,
  updatedAt: S.String,
  metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}
