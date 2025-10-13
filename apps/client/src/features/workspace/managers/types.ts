import type {
  CoreManagerConfig,
  CoreManagerState,
} from "@/features/application/manager/core/core/types";
import type { AgentConfig, ChatAppConfig } from "@/features/application/types/AppConfig";
import type { Workspace as WorkspaceConfig } from "@buddy/config/types/workspace";

// Workspace component state (extends CoreManagerState)
export interface WorkspaceComponentState extends CoreManagerState {
  readonly workspaceConfig: WorkspaceConfig | null;
  readonly availableChatApps: ChatAppConfig[];
  readonly availableAgents: AgentConfig[];
  readonly activeChatApps: ChatAppConfig[];
  readonly activeChatAppIds: string[]; // Computed from activeChatApps
  readonly isWorkspaceLoaded: boolean;
  readonly isUIRendered: boolean;
}

// Workspace component configuration (extends CoreManagerConfig)
export interface WorkspaceComponentConfig extends CoreManagerConfig {
  readonly workspaceId: string;
  readonly autoLoadChatApps?: boolean;
  readonly autoLoadAgents?: boolean;
  readonly autoRenderUI?: boolean;
}

// Workspace lifecycle states
export const WORKSPACE_LIFECYCLE = {
  UNINITIALIZED: "uninitialized",
  LOADING_WORKSPACE: "loading_workspace",
  WORKSPACE_LOADED: "workspace_loaded",
  LOADING_CHATAPPS: "loading_chatapps",
  CHATAPPS_LOADED: "chatapps_loaded",
  LOADING_AGENTS: "loading_agents",
  AGENTS_LOADED: "agents_loaded",
  RENDERING_UI: "rendering_ui",
  UI_RENDERED: "ui_rendered",
  READY: "ready",
  ERROR: "error",
} as const;

export type WorkspaceLifecycleState =
  (typeof WORKSPACE_LIFECYCLE)[keyof typeof WORKSPACE_LIFECYCLE];

// Workspace operations
export const WORKSPACE_OPERATIONS = {
  LOAD_CONFIG: "load_config",
  LOAD_CHATAPPS: "load_chatapps",
  LOAD_AGENTS: "load_agents",
  ACTIVATE_CHATAPP: "activate_chatapp",
  DEACTIVATE_CHATAPP: "deactivate_chatapp",
  RENDER_UI: "render_ui",
  SWITCH_WORKSPACE: "switch_workspace",
} as const;

export type WorkspaceOperationType =
  (typeof WORKSPACE_OPERATIONS)[keyof typeof WORKSPACE_OPERATIONS];

// Default workspace component state
export function createDefaultWorkspaceState(): WorkspaceComponentState {
  return {
    isInitialized: false,
    isRunning: false,
    isLoading: false,
    lastUpdated: Date.now(),
    operationCount: 0,
    workspaceConfig: null,
    availableChatApps: [],
    availableAgents: [],
    activeChatApps: [],
    activeChatAppIds: [],
    isWorkspaceLoaded: false,
    isUIRendered: false,
  };
}

// Workspace validation result
export interface WorkspaceValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

// Validate workspace configuration
export function validateWorkspaceConfig(
  config: WorkspaceConfig
): WorkspaceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!config.id || config.id.trim() === "") {
    errors.push("Workspace ID is required");
  }

  if (!config.name || config.name.trim() === "") {
    errors.push("Workspace name is required");
  }

  // Agent IDs validation
  if (!Array.isArray(config.agentIds)) {
    errors.push("agentIds must be an array");
  } else if (config.agentIds.length === 0) {
    warnings.push("No agents assigned to workspace");
  }

  // Chat App IDs validation
  if (!Array.isArray(config.chatappIds)) {
    errors.push("chatappIds must be an array");
  } else if (config.chatappIds.length === 0) {
    warnings.push("No chat apps assigned to workspace");
  }

  // Note: Workspace interface doesn't have permissions property
  // Permissions are managed at the chat app level

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
