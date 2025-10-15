import { Effect } from "effect";

export interface WorkspacePermissions {
  readonly canAddApps: boolean;
  readonly canRemoveApps: boolean;
  readonly canModifyLayout: boolean;
  readonly canChangeSettings: boolean;
  readonly canInviteUsers: boolean;
  readonly canManagePermissions: boolean;
}

export interface WorkspaceStyle {
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly borderColor?: string;
  readonly borderRadius?: string;
  readonly fontSize?: string;
  readonly fontFamily?: string;
}

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly agentIds: readonly string[];
  readonly chatappIds: readonly string[];
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly isArchived: boolean;
  readonly maxExpandedApps: number;
  readonly activeAppId: string | null;
  readonly isDefault?: boolean;
  readonly permissions?: WorkspacePermissions;
  readonly style?: WorkspaceStyle;
}

export interface WorkspaceCreateInput {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly agentIds?: readonly string[];
  readonly chatappIds?: readonly string[];
}

export interface WorkspaceUpdateInput extends Partial<WorkspaceCreateInput> {
  readonly isArchived?: boolean;
  readonly maxExpandedApps?: number;
  readonly activeAppId?: string | null;
}
