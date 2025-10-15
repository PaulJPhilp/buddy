import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import type {
  ChatAppEntry,
  ListChatAppsOptions,
} from "@/features/chatapps/types/llm-api";

// Define ChatAppStatus locally since it's not exported
export type ChatAppStatus = "active" | "inactive" | "stashed";
import type {
  CreateWorkspaceOptions,
  ListWorkspacesOptions,
  WorkspaceEntry,
  WorkspaceStats,
} from "@/features/workspace/types/llm-api";

// Global API interface for LLM tool-calling
export interface BuddyWorkspaceAPI {
  // Workspace operations
  createWorkspace: (options: CreateWorkspaceOptions) => Promise<string>;
  listWorkspaces: (
    options?: ListWorkspacesOptions
  ) => Promise<WorkspaceEntry[]>;
  activateWorkspace: (workspaceId: string) => Promise<void>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceEntry>
  ) => Promise<void>;
  archiveWorkspace: (workspaceId: string) => Promise<void>;
  restoreWorkspace: (workspaceId: string) => Promise<void>;

  // Chat app operations
  addChatApp: (
    workspaceId: string,
    config: ChatAppConfig | string
  ) => Promise<void>;
  listChatApps: (options?: ListChatAppsOptions) => Promise<ChatAppEntry[]>;
  setChatAppStatus: (
    workspaceId: string,
    appId: string,
    status: ChatAppStatus
  ) => Promise<void>;
  enterFocusMode: (workspaceId: string, appId: string) => Promise<void>;
  exitFocusMode: (workspaceId: string) => Promise<void>;

  // Utility operations
  getCurrentWorkspace: () => Promise<WorkspaceEntry | null>;
  getActiveWorkspaces: () => Promise<WorkspaceEntry[]>;
  getWorkspaceStats: () => Promise<WorkspaceStats>;
}
