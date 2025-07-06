import type { Agent, ChatApp, Workspace } from "@buddy/schemas";
import type { ChatAppConfig } from "../../types/global";

export const WORKSPACES_DIR = "workspaces";
export const AGENTS_DIR = "agents";

export type { Agent, ChatApp, Workspace };

// Re-export external types if needed
export type { ChatAppConfig } from "../../types/global";

// Core workspace types
export interface WorkspaceEntry {
  readonly id: string;
  readonly name: string;
  /**
   * Optional hex color (e.g., #ff00aa) chosen by the user.
   */
  readonly color?: string;
  readonly description?: string;
  readonly icon?: string; // emoji or icon identifier
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly isArchived: boolean;
  readonly isPlaceholder?: boolean;
  readonly availableAgents: string[]; // must have at least 1
  /**
   * List of chat app IDs in this workspace. Details must be fetched from the canonical chatApps map.
   */
  readonly chatAppIds: string[];
  // Chat App Management Configuration
  /**
   * Maximum number of expanded chat apps allowed simultaneously in this workspace.
   * Default: 2, configurable per workspace.
   */
  readonly maxExpandedApps: number;
  /**
   * ID of the currently active chat app in this workspace.
   * Only the active app accepts user input.
   * null if no app is currently active.
   */
  readonly activeAppId: string | null;
  // Layout preferences per workspace
  readonly layoutPreferences?: {
    readonly sidebarWidth?: number;
    readonly layoutMode?: "default" | "compact" | "wide";
  };
}

export type ChatAppStatus = "stashed" | "compact" | "expanded" | "closed";

export interface ChatAppEntry {
  readonly id: string;
  /**
   * The workspace this app belongs to.
   */
  readonly workspaceId: string;
  readonly status: ChatAppStatus;
  readonly isArchived: boolean;
  /**
   * Timestamp of the last time this chat app was interacted with.
   * Used for sorting when determining which apps to compact/expand.
   */
  readonly lastActiveAt: Date;
  /**
   * The full configuration for this chat application.
   */
  readonly config: ChatAppConfig;
  /**
   * Optional field to store the previous status during focus mode.
   * Used to restore the app to its previous state when exiting focus mode.
   */
  readonly previousStatus?: "expanded" | "compact";
}

// Main workspace state interface
export interface WorkspaceState {
  /**
   * Id of the currently-active workspace.
   * `null` when no workspace has been created yet (should not happen in practice).
   */
  readonly currentWorkspaceId: string | null;
  /**
   * Map of workspaceId → workspace record.
   */
  readonly workspaces: Record<string, WorkspaceEntry>;
  /**
   * Map of appId → chat app record.
   */
  readonly chatApps: Record<string, ChatAppEntry>;
  /**
   * Whether the workspace is currently loading data.
   */
  readonly isLoading: boolean;
}

// Parameter types for service methods
export interface CreateWorkspaceParams {
  readonly workspaceId: string;
  readonly name: string;
  readonly color?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly availableAgents: string[];
}

export interface UpdateWorkspaceParams {
  readonly name?: string;
  readonly color?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly availableAgents?: string[];
  readonly layoutPreferences?: WorkspaceEntry["layoutPreferences"];
  readonly maxExpandedApps?: number;
}

export interface AddChatAppParams {
  readonly workspaceId: string;
  readonly appId: string;
  readonly config: ChatAppConfig;
}

export interface UpdateChatAppParams {
  readonly appId: string;
  readonly config: Partial<ChatAppConfig>;
}

export interface LayoutPreferences {
  readonly sidebarWidth?: number;
  readonly layoutMode?: "default" | "compact" | "wide";
}

export interface FocusModeConfig {
  readonly appId: string;
  readonly preserveOtherApps?: boolean;
}

// Statistics interface
export interface WorkspaceStats {
  readonly workspaces: {
    readonly total: number;
    readonly active: number;
    readonly archived: number;
  };
  readonly chatApps: {
    readonly total: number;
    readonly active: number;
    readonly archived: number;
  };
}

// Constants
export const WORKSPACE_CONSTANTS = {
  MAX_WORKSPACES: 10,
  DEFAULT_WORKSPACE_NAME: "Untitled",
  DEFAULT_MAX_EXPANDED_APPS: 2,
  DEFAULT_WORKSPACE_ID: "default-space",
  DEFAULT_WORKSPACE_COLOR: "#3b82f6",
  DEFAULT_WORKSPACE_ICON: "👋",
  DEFAULT_WORKSPACE_DESCRIPTION:
    "This is a default workspace. Create a new one to get started!",
  MIN_EXPANDED_APPS: 1,
  MIN_AVAILABLE_AGENTS: 1,
} as const;

// Default state
export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  currentWorkspaceId: null,
  workspaces: {},
  chatApps: {},
  isLoading: false,
};

// Utility functions
export function createDefaultWorkspace(): WorkspaceEntry {
  throw new Error(
    "createDefaultWorkspace should not be used - workspaces must be loaded from external source"
  );
}

export function getActiveWorkspaces(
  workspaces: Record<string, WorkspaceEntry>
): WorkspaceEntry[] {
  return Object.values(workspaces).filter((workspace) => !workspace.isArchived);
}

export function getFirstActiveWorkspaceId(
  workspaces: Record<string, WorkspaceEntry>
): string | null {
  const activeWorkspaces = getActiveWorkspaces(workspaces);
  return activeWorkspaces.length > 0 ? activeWorkspaces[0].id : null;
}

export function ensureAtLeastOneWorkspace(
  workspaces: Record<string, WorkspaceEntry>
): Record<string, WorkspaceEntry> {
  // No longer create default workspaces - return as-is
  // If no workspaces exist, it's an error state that should be handled at the app level
  return workspaces;
}

// Validation helpers
export function isValidWorkspaceName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

export function isValidWorkspaceColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function isValidMaxExpandedApps(max: number): boolean {
  return Number.isInteger(max) && max >= WORKSPACE_CONSTANTS.MIN_EXPANDED_APPS;
}

export function isValidAvailableAgents(agents: string[]): boolean {
  return (
    Array.isArray(agents) &&
    agents.length >= WORKSPACE_CONSTANTS.MIN_AVAILABLE_AGENTS
  );
}
