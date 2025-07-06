/**
 * Pure Workspace Domain Model
 * Contains only business logic - no UI, layout, or presentation concerns
 */

// Core workspace business model
export interface WorkspaceModel {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly chatappIds: string[];
  readonly agentIds: string[];
  readonly permissions: WorkspacePermissions;
  readonly isDefault?: boolean;
  readonly isArchived?: boolean;
  readonly maxExpandedApps?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: Record<string, unknown>;
}

// Business permissions - what users can do
export interface WorkspacePermissions {
  readonly canAddApps: boolean;
  readonly canRemoveApps: boolean;
  readonly canModifyLayout: boolean;
  readonly canChangeSettings: boolean;
  readonly canInviteUsers: boolean;
  readonly canManagePermissions: boolean;
}

// Domain operations
export interface WorkspaceDomainOperations {
  readonly canUserAddApp: (
    workspace: WorkspaceModel,
    userId: string
  ) => boolean;
  readonly canUserRemoveApp: (
    workspace: WorkspaceModel,
    userId: string
  ) => boolean;
  readonly isWorkspaceActive: (workspace: WorkspaceModel) => boolean;
  readonly getActiveApps: (workspace: WorkspaceModel) => string[];
}

// Domain validation
export interface WorkspaceValidation {
  readonly isValidWorkspaceName: (name: string) => boolean;
  readonly isValidAppCount: (workspace: WorkspaceModel) => boolean;
  readonly hasRequiredPermissions: (
    workspace: WorkspaceModel,
    operation: string
  ) => boolean;
}

// Factory functions for domain models
export function createWorkspaceModel(params: {
  id?: string;
  name: string;
  description?: string;
  chatappIds?: string[];
  agentIds?: string[];
  permissions?: Partial<WorkspacePermissions>;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}): WorkspaceModel {
  const now = new Date().toISOString();

  return {
    id: params.id ?? generateWorkspaceId(),
    name: params.name,
    description: params.description,
    chatappIds: params.chatappIds ?? [],
    agentIds: params.agentIds ?? [],
    permissions: {
      canAddApps: true,
      canRemoveApps: true,
      canModifyLayout: true,
      canChangeSettings: true,
      canInviteUsers: false,
      canManagePermissions: false,
      ...params.permissions,
    },
    isDefault: params.isDefault ?? false,
    isArchived: false,
    maxExpandedApps: 4,
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata ?? {},
  };
}

export function updateWorkspaceModel(
  workspace: WorkspaceModel,
  updates: Partial<
    Pick<WorkspaceModel, "name" | "description" | "permissions" | "metadata">
  >
): WorkspaceModel {
  return {
    ...workspace,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

// Domain utilities
export function generateWorkspaceId(): string {
  return `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidWorkspaceName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}

export function isActiveWorkspace(workspace: WorkspaceModel): boolean {
  return (
    !workspace.isArchived &&
    (workspace.chatappIds.length > 0 || workspace.agentIds.length > 0)
  );
}

export function canAddApp(workspace: WorkspaceModel): boolean {
  const maxApps = workspace.maxExpandedApps ?? 4;
  return workspace.chatappIds.length < maxApps;
}
