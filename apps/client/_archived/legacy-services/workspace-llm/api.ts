import { Effect } from "effect";
import type {
  BuddyWorkspaceAPI,
  CreateWorkspaceOptions,
  ListWorkspacesOptions,
  ListChatAppsOptions,
  WorkspaceStats,
  WorkspaceEntry,
  ChatAppEntry,
  ChatAppStatus,
  LLMToolFunctions,
} from "./types";
import type { WorkspaceLLMServiceError } from "./errors";
import type { ChatAppConfig } from "@/types/global";

export interface WorkspaceLLMApi {
  // Core initialization
  readonly initializeAPI: () => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly isInitialized: () => Effect.Effect<boolean, never>;

  // Window API management
  readonly attachToWindow: (
    api: BuddyWorkspaceAPI
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly getWindowAPI: () => Effect.Effect<BuddyWorkspaceAPI | null, never>;

  // Workspace operations
  readonly createWorkspace: (
    options: CreateWorkspaceOptions
  ) => Effect.Effect<string, WorkspaceLLMServiceError>;
  readonly listWorkspaces: (
    options?: ListWorkspacesOptions
  ) => Effect.Effect<WorkspaceEntry[], WorkspaceLLMServiceError>;
  readonly activateWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceEntry>
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly archiveWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly restoreWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;

  // Chat app operations
  readonly addChatApp: (
    workspaceId: string,
    config: ChatAppConfig | string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly listChatApps: (
    options?: ListChatAppsOptions
  ) => Effect.Effect<ChatAppEntry[], WorkspaceLLMServiceError>;
  readonly setChatAppStatus: (
    workspaceId: string,
    appId: string,
    status: ChatAppStatus
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly enterFocusMode: (
    workspaceId: string,
    appId: string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;
  readonly exitFocusMode: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceLLMServiceError>;

  // Utility operations
  readonly getCurrentWorkspace: () => Effect.Effect<
    WorkspaceEntry | null,
    WorkspaceLLMServiceError
  >;
  readonly getActiveWorkspaces: () => Effect.Effect<
    WorkspaceEntry[],
    WorkspaceLLMServiceError
  >;
  readonly getWorkspaceStats: () => Effect.Effect<
    WorkspaceStats,
    WorkspaceLLMServiceError
  >;

  // LLM tool functions
  readonly getToolFunctions: () => Effect.Effect<
    LLMToolFunctions,
    WorkspaceLLMServiceError
  >;
  readonly createBuddyWorkspaceAPI: () => Effect.Effect<
    BuddyWorkspaceAPI,
    WorkspaceLLMServiceError
  >;
}
