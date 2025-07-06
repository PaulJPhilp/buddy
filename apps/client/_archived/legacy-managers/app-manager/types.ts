// Re-export types from api for convenience
export type {
  Agent,
  Workspace,
  ChatApp,
  AppManagerState,
  AppManagerApi,
} from "./api";

export type {
  AppManagerError,
  WorkspaceNotFoundError,
  ChatAppNotFoundError,
  WorkspaceValidationError,
  WorkspaceCapacityError,
  WorkspaceConfigError,
  AppManagerErrors,
} from "./errors";

// State machine events
export type AppManagerEvent =
  | { type: "LOAD_INITIAL_DATA" }
  | { type: "WORKSPACE_CREATED"; workspace: Workspace }
  | {
      type: "WORKSPACE_UPDATED";
      workspaceId: string;
      updates: Partial<Workspace>;
    }
  | { type: "WORKSPACE_ARCHIVED"; workspaceId: string }
  | { type: "WORKSPACE_UNARCHIVED"; workspaceId: string }
  | { type: "CURRENT_WORKSPACE_CHANGED"; workspaceId: string }
  | { type: "WORKSPACE_EXPANDED"; workspaceId: string }
  | { type: "WORKSPACE_COLLAPSED"; workspaceId: string }
  | { type: "CHAT_APP_ADDED"; chatApp: ChatApp }
  | { type: "CHAT_APP_ACTIVATED"; workspaceId: string; appId: string }
  | { type: "CHAT_APP_EXPANDED"; workspaceId: string; appId: string }
  | { type: "CHAT_APP_COMPACTED"; workspaceId: string; appId: string }
  | { type: "CHAT_APP_STASHED"; workspaceId: string; appId: string }
  | { type: "CHAT_APP_REMOVED"; appId: string }
  | { type: "AGENT_ADDED"; agent: Agent }
  | { type: "AGENT_UPDATED"; agentId: string; updates: Partial<Agent> }
  | { type: "AGENT_REMOVED"; agentId: string }
  | {
      type: "DATA_LOADED";
      workspaces: Workspace[];
      chatApps: ChatApp[];
      agents: Agent[];
    }
  | { type: "LOADING_STARTED" }
  | { type: "LOADING_FINISHED" }
  | { type: "ERROR_OCCURRED"; error: string };

// Configuration
export const WORKSPACE_MANAGER_CONSTANTS = {
  DEFAULT_MAX_EXPANDED_APPS: 2,
  DEFAULT_WORKSPACE_NAME: "Untitled Workspace",
  AUTO_SAVE_DEBOUNCE_MS: 1000,
  REFRESH_INTERVAL_MS: 30000,
} as const;

// Default state
export function createDefaultAppManagerState(): AppManagerState {
  return {
    currentWorkspaceId: null,
    workspaces: {},
    isLoading: false,
    expandedWorkspaces: new Set(),
    lastError: null,
  };
}

// Utility types for partial updates
export type WorkspaceUpdate = Partial<
  Pick<Workspace, "name" | "description" | "icon" | "color">
>;
export type AgentUpdate = Partial<
  Pick<Agent, "name" | "avatar" | "description">
>;

// Service options
export interface AppManagerOptions {
  readonly autoSave?: boolean;
  readonly autoRefresh?: boolean;
  readonly maxExpandedApps?: number;
  readonly validateOnCreate?: boolean;
}

// NOTE: AppManager does not own agent or chat app state. It only stores IDs and queries the owning manager for details.

// NOTE: AppManager does not own agent or chat app state. It only stores IDs and queries the owning manager for details.
