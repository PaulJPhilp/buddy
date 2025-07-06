import type {
  ChatAppEntry,
  WorkspaceEntry,
} from "@/managers/workspace-component/types";
import type { ChatAppConfig } from "@/types/global";

// Re-export types from workspace service
export type {
  ChatAppEntry,
  WorkspaceEntry,
} from "@/managers/workspace-component/types";

// LLM-specific option types
export interface CreateWorkspaceOptions {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly availableAgents?: readonly string[];
}

export interface ListWorkspacesOptions {
  readonly includeArchived?: boolean;
}

export interface ListChatAppsOptions {
  readonly workspaceId?: string;
  readonly status?: ChatAppStatus;
  readonly includeArchived?: boolean;
}

export type ChatAppStatus = "expanded" | "compact" | "stashed" | "closed";

export interface WorkspaceStats {
  readonly totalWorkspaces: number;
  readonly activeWorkspaces: number;
  readonly archivedWorkspaces: number;
  readonly totalChatApps: number;
  readonly activeChatApps: number;
}

// LLM Tool Function types
export interface LLMToolFunction<TArgs = any, TResult = any> {
  readonly(args: TArgs): Promise<TResult>;
}

export interface LLMToolFunctions {
  readonly create_workspace: LLMToolFunction<CreateWorkspaceOptions, string>;
  readonly list_workspaces: LLMToolFunction<
    ListWorkspacesOptions | undefined,
    WorkspaceEntry[]
  >;
  readonly activate_workspace: LLMToolFunction<{ workspaceId: string }, string>;
  readonly update_workspace: LLMToolFunction<
    { workspaceId: string } & Partial<WorkspaceEntry>,
    string
  >;
  readonly archive_workspace: LLMToolFunction<{ workspaceId: string }, string>;
  readonly add_chat_app: LLMToolFunction<
    {
      workspaceId: string;
      configId?: string;
      customConfig?: ChatAppConfig;
    },
    string
  >;
  readonly list_chat_apps: LLMToolFunction<
    ListChatAppsOptions | undefined,
    ChatAppEntry[]
  >;
  readonly set_chat_app_status: LLMToolFunction<
    {
      workspaceId: string;
      appId: string;
      status: ChatAppStatus;
    },
    string
  >;
  readonly enter_focus_mode: LLMToolFunction<
    { workspaceId: string; appId: string },
    string
  >;
  readonly exit_focus_mode: LLMToolFunction<{ workspaceId: string }, string>;
  readonly get_current_workspace: LLMToolFunction<void, WorkspaceEntry | null>;
  readonly get_active_workspaces: LLMToolFunction<void, WorkspaceEntry[]>;
  readonly get_workspace_stats: LLMToolFunction<void, WorkspaceStats>;
}

// Global API interface for window.buddyWorkspace
export interface BuddyWorkspaceAPI {
  // Workspace operations
  readonly createWorkspace: (
    options: CreateWorkspaceOptions
  ) => Promise<string>;
  readonly listWorkspaces: (
    options?: ListWorkspacesOptions
  ) => Promise<WorkspaceEntry[]>;
  readonly activateWorkspace: (workspaceId: string) => Promise<void>;
  readonly updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceEntry>
  ) => Promise<void>;
  readonly archiveWorkspace: (workspaceId: string) => Promise<void>;
  readonly restoreWorkspace: (workspaceId: string) => Promise<void>;

  // Chat app operations
  readonly addChatApp: (
    workspaceId: string,
    config: ChatAppConfig | string
  ) => Promise<void>;
  readonly listChatApps: (
    options?: ListChatAppsOptions
  ) => Promise<ChatAppEntry[]>;
  readonly setChatAppStatus: (
    workspaceId: string,
    appId: string,
    status: ChatAppStatus
  ) => Promise<void>;
  readonly enterFocusMode: (
    workspaceId: string,
    appId: string
  ) => Promise<void>;
  readonly exitFocusMode: (workspaceId: string) => Promise<void>;

  // Utility operations
  readonly getCurrentWorkspace: () => Promise<WorkspaceEntry | null>;
  readonly getActiveWorkspaces: () => Promise<WorkspaceEntry[]>;
  readonly getWorkspaceStats: () => Promise<WorkspaceStats>;
}

// Utility functions
export const validateWorkspaceId = (workspaceId: string): boolean => {
  return typeof workspaceId === "string" && workspaceId.trim().length > 0;
};

export const validateChatAppStatus = (
  status: string
): status is ChatAppStatus => {
  return ["expanded", "compact", "stashed", "closed"].includes(status);
};

export const generateWorkspaceId = (name: string): string => {
  const timestamp = Date.now();
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `workspace-${sanitizedName}-${timestamp}`;
};

// Constants
export const WORKSPACE_LLM_CONSTANTS = {
  MAX_WORKSPACE_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_ICON: "📁",
  DEFAULT_COLOR: "#3b82f6",
  DEFAULT_AGENTS: ["default-agent"] as const,
} as const;

// Window type extension
declare global {
  interface Window {
    buddyWorkspace?: BuddyWorkspaceAPI;
  }
}
