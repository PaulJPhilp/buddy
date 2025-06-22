import { ChatAppConfig } from "@/types/global";

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
  readonly availableAgents: string[]; // must have at least 1
  // Layout preferences per workspace
  readonly layoutPreferences?: {
    readonly sidebarWidth?: number;
    readonly layoutMode?: "default" | "compact" | "wide";
  };
}

export type ChatAppStatus = "compact" | "expanded" | "stashed" | "closed";

export interface ChatAppEntry {
  readonly id: string;
  /**
   * The workspace this app belongs to.
   */
  readonly workspaceId: string;
  readonly status: ChatAppStatus;
  readonly isArchived: boolean;
  /**
   * The full configuration for this chat application.
   */
  readonly config: ChatAppConfig;
}

export interface UIState {
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
   * Map of chatAppId → chat-app UI entry.
   */
  readonly chatApps: Record<string, ChatAppEntry>;
}

// ---------------------------------------------------------------------------
// UI Events – the ONLY way to mutate the state machine from the outside.
// ---------------------------------------------------------------------------

export type UIEvent =
  | {
      type: "WORKSPACE_ADDED";
      workspaceId: string;
      name: string;
      color?: string;
      description?: string;
      icon?: string;
      availableAgents: string[];
    }
  | {
      type: "WORKSPACE_UPDATED";
      workspaceId: string;
      name?: string;
      color?: string;
      description?: string;
      icon?: string;
      availableAgents?: string[];
      layoutPreferences?: WorkspaceEntry["layoutPreferences"];
    }
  | {
      type: "WORKSPACE_ACTIVATED";
      workspaceId: string;
    }
  | {
      type: "WORKSPACE_ARCHIVED";
      workspaceId: string;
    }
  | {
      type: "WORKSPACE_RESTORED";
      workspaceId: string;
    }
  | {
      type: "WORKSPACE_AGENT_ADDED";
      workspaceId: string;
      agentId: string;
    }
  | {
      type: "WORKSPACE_AGENT_REMOVED";
      workspaceId: string;
      agentId: string;
    }
  | {
      type: "WORKSPACE_LAYOUT_PREFERENCES_UPDATED";
      workspaceId: string;
      layoutPreferences: WorkspaceEntry["layoutPreferences"];
    }
  | {
      type: "CHAT_APP_ADDED";
      workspaceId: string;
      appId: string;
      config: ChatAppConfig;
    }
  | {
      type: "CHAT_APPS_ADDED";
      apps: ChatAppConfig[];
    }
  | {
      type: "CHAT_APP_UPDATED";
      workspaceId: string;
      appId: string;
      status?: ChatAppStatus;
    }
  | {
      type: "CHAT_APP_REMOVED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_EXPANDED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_COMPACTED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_CLOSED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_ARCHIVED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "CHAT_APP_RESTORED";
      workspaceId: string;
      appId: string;
    }
  | {
      type: "RESET";
    }
  | {
      type: "ENSURE_DEFAULT_WORKSPACE";
    };
