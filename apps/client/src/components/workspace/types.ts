import type {
  CoreComponentConfig,
  CoreComponentState,
} from "@/components/core";
import type {
  AgentConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "@/types/global";

// Workspace component state (extends CoreComponentState)
export interface WorkspaceComponentState extends CoreComponentState {
  readonly workspaceConfig: WorkspaceConfig | null;
  readonly availableChatApps: ChatAppConfig[];
  readonly availableAgents: AgentConfig[];
  readonly activeChatApps: ChatAppConfig[];
  readonly isWorkspaceLoaded: boolean;
  readonly isUIRendered: boolean;
}

// Workspace component configuration (extends CoreComponentConfig)
export interface WorkspaceComponentConfig extends CoreComponentConfig {
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
    isLoading: false,
    lastUpdated: Date.now(),
    workspaceConfig: null,
    availableChatApps: [],
    availableAgents: [],
    activeChatApps: [],
    isWorkspaceLoaded: false,
    isUIRendered: false,
  };
}

// Helper to filter chat apps for workspace
export function filterChatAppsForWorkspace(
  chatApps: ChatAppConfig[],
  workspaceId: string
): ChatAppConfig[] {
  return chatApps.filter(
    (app) => app.workspaceId === workspaceId || !app.workspaceId
  );
}

// Helper to filter agents for workspace (using agent IDs)
export function filterAgentsForWorkspace(
  agents: AgentConfig[],
  agentIds: string[]
): AgentConfig[] {
  return agents.filter((agent) => agentIds.includes(agent.id));
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

  // Permissions validation
  if (!config.permissions) {
    warnings.push("No permissions specified");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
