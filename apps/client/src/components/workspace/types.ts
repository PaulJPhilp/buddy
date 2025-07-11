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
  readonly activeChatAppIds: string[]; // Computed from activeChatApps
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
    activeChatAppIds: [],
    isWorkspaceLoaded: false,
    isUIRendered: false,
  };
}

// Helper to filter chat apps for workspace
export function filterChatAppsForWorkspace(
  chatApps: ChatAppConfig[],
  workspaceId: string
): ChatAppConfig[] {
  // Since ChatAppConfig doesn't have workspaceId, we need to filter by the chatapp IDs
  // This function should be called with the workspace's chatappIds
  // For now, return all chat apps since the filtering should be done at the workspace level
  return chatApps;
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

// Type guards for safe property access
export function isChatAppLike(obj: unknown): obj is {
  id: string;
  name: string;
  agentId?: string;
  toolbarId?: string;
  themeId?: string;
  description?: string;
  version?: string;
  agent?: unknown;
  toolbar?: unknown;
  style?: unknown;
  updatedAt?: string;
  ownerId?: string;
  spaceId?: string;
  theme?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  agentIds?: string[];
} {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;

  return (
    "id" in record &&
    "name" in record &&
    typeof record.id === "string" &&
    typeof record.name === "string"
  );
}

export function isAgentLike(obj: unknown): obj is {
  id: string;
  name: string;
  description?: string;
  version?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  capabilities?: string[];
  parameters?: unknown;
  permissions?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: unknown;
} {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;

  return (
    "id" in record &&
    "name" in record &&
    typeof record.id === "string" &&
    typeof record.name === "string"
  );
}

// Safe property extractors
export function extractChatAppProperties(obj: unknown): {
  id: string;
  name: string;
  agentId?: string;
  toolbarId?: string;
  themeId?: string;
  description?: string;
  version?: string;
  agent?: unknown;
  toolbar?: unknown;
  style?: unknown;
  updatedAt?: string;
  ownerId?: string;
  spaceId?: string;
  theme?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  agentIds?: string[];
} | null {
  if (!isChatAppLike(obj)) {
    return null;
  }

  const record = obj as Record<string, unknown>;

  return {
    id: record.id as string,
    name: record.name as string,
    agentId: typeof record.agentId === "string" ? record.agentId : undefined,
    toolbarId:
      typeof record.toolbarId === "string" ? record.toolbarId : undefined,
    themeId: typeof record.themeId === "string" ? record.themeId : undefined,
    description:
      typeof record.description === "string" ? record.description : undefined,
    version: typeof record.version === "string" ? record.version : undefined,
    agent: record.agent,
    toolbar: record.toolbar,
    style: record.style,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    ownerId: typeof record.ownerId === "string" ? record.ownerId : undefined,
    spaceId: typeof record.spaceId === "string" ? record.spaceId : undefined,
    theme: record.theme,
    isDefault:
      typeof record.isDefault === "boolean" ? record.isDefault : undefined,
    isShared:
      typeof record.isShared === "boolean" ? record.isShared : undefined,
    agentIds:
      Array.isArray(record.agentIds) &&
      record.agentIds.every((id) => typeof id === "string")
        ? (record.agentIds as string[])
        : undefined,
  };
}

// Convert ChatAppConfig to Record format for ChatAppsManager compatibility
export function chatAppConfigToRecord(
  config: ChatAppConfig
): Record<string, unknown> {
  return {
    id: config.id,
    name: config.name,
    agentId: config.agentId,
    toolbarId: config.toolbarId,
    themeId: config.themeId,
    description: config.description,
    version: config.version,
    agent: config.agent,
    toolbar: config.toolbar,
    style: config.style,
    updatedAt: config.updatedAt,
    ownerId: config.ownerId,
    spaceId: config.spaceId,
    theme: config.theme,
    isDefault: config.isDefault,
    isShared: config.isShared,
  };
}
