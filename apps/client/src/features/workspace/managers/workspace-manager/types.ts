import { Schema as S } from "effect";

// Workspace data structure
export class Workspace extends S.Class<Workspace>("Workspace")({
  id: S.String,
  name: S.String,
  description: S.String,
  icon: S.String,
  primaryColor: S.String,
  agentIds: S.Array(S.String),
  chatappIds: S.Array(S.String),
  createdAt: S.String,
  lastActiveAt: S.String,
  isArchived: S.Boolean,
  maxExpandedApps: S.Number,
  activeAppId: S.Union(S.String, S.Null),
}) {}

// Workspace creation input
export interface WorkspaceCreateInput {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly primaryColor?: string;
  readonly agentIds?: readonly string[];
  readonly chatappIds?: readonly string[];
}

// Workspace update input
export interface WorkspaceUpdateInput extends Partial<WorkspaceCreateInput> {
  readonly isArchived?: boolean;
  readonly maxExpandedApps?: number;
  readonly activeAppId?: string | null;
}

// Manager state
export interface WorkspaceManagerState {
  readonly isInitialized: boolean;
  readonly isLoading: boolean;
  readonly workspaces: readonly Workspace[];
  readonly lastUpdated: Date;
  readonly operationCount: number;
  readonly lastError: string | null;
}

// Manager configuration
export interface WorkspaceManagerConfig {
  readonly autoSave: boolean;
  readonly maxWorkspaces: number;
  readonly defaultIcon: string;
  readonly defaultColor: string;
}

// Manager stats
export interface WorkspaceManagerStats {
  readonly totalWorkspaces: number;
  readonly activeWorkspaces: number;
  readonly archivedWorkspaces: number;
  readonly lastModified: Date | null;
  readonly operationCount: number;
}

// Constants
export const WORKSPACE_MANAGER_CONSTANTS = {
  MAX_WORKSPACES: 50,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_ICON: "💼",
  DEFAULT_COLOR: "#6b7280",
  DEFAULT_MAX_EXPANDED_APPS: 3,
  DEFAULT_AUTO_SAVE: true,
} as const;

// Helper functions
export function createDefaultWorkspaceManagerState(): WorkspaceManagerState {
  return {
    isInitialized: false,
    isLoading: false,
    workspaces: [],
    lastUpdated: new Date(),
    operationCount: 0,
    lastError: null,
  };
}

export function createDefaultWorkspaceManagerConfig(): WorkspaceManagerConfig {
  return {
    autoSave: WORKSPACE_MANAGER_CONSTANTS.DEFAULT_AUTO_SAVE,
    maxWorkspaces: WORKSPACE_MANAGER_CONSTANTS.MAX_WORKSPACES,
    defaultIcon: WORKSPACE_MANAGER_CONSTANTS.DEFAULT_ICON,
    defaultColor: WORKSPACE_MANAGER_CONSTANTS.DEFAULT_COLOR,
  };
}

export function generateWorkspaceId(name: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 20);
  return `${nameSlug}-${timestamp}-${randomStr}`;
}

// Export WorkspaceConfig and WorkspaceId as aliases for compatibility
export type WorkspaceConfig = Workspace;
export type WorkspaceId = string;

export function createWorkspaceFromInput(
  input: WorkspaceCreateInput
): Workspace {
  const now = new Date().toISOString();
  return new Workspace({
    id: generateWorkspaceId(input.name),
    name: input.name,
    description: input.description || "",
    icon: input.icon || WORKSPACE_MANAGER_CONSTANTS.DEFAULT_ICON,
    primaryColor:
      input.primaryColor || WORKSPACE_MANAGER_CONSTANTS.DEFAULT_COLOR,
    agentIds: input.agentIds || [],
    chatappIds: input.chatappIds || [],
    createdAt: now,
    lastActiveAt: now,
    isArchived: false,
    maxExpandedApps: WORKSPACE_MANAGER_CONSTANTS.DEFAULT_MAX_EXPANDED_APPS,
    activeAppId: null,
  });
}
