import type { ChatApp, Workspace } from "@buddy/schemas";
import { Effect } from "effect";
import type {
  ChatAppNotFoundError,
  WorkspaceLoadError,
  WorkspaceNotFoundError,
  WorkspaceParseError,
} from "./errors";
import type { WorkspaceError } from "./errors";
import type {
  AddChatAppParams,
  ChatAppConfig,
  ChatAppEntry,
  ChatAppStatus,
  CreateWorkspaceParams,
  FocusModeConfig,
  LayoutPreferences,
  UpdateChatAppParams,
  UpdateWorkspaceParams,
  WorkspaceEntry,
  WorkspaceState,
  WorkspaceStats,
} from "./types";

export interface WorkspaceManagerApi {
  // Debug property
  readonly instanceId: string;

  // State access and subscription
  readonly getState: () => Effect.Effect<WorkspaceState, WorkspaceError, never>;
  readonly subscribe: (
    listener: (state: WorkspaceState) => void
  ) => Effect.Effect<
    () => Effect.Effect<void, unknown, unknown>,
    unknown,
    never
  >;

  // Workspace management
  readonly loadWorkspaces: () => Effect.Effect<
    WorkspaceEntry[],
    WorkspaceError,
    never
  >;
  readonly createWorkspace: (
    params: CreateWorkspaceParams
  ) => Effect.Effect<WorkspaceEntry, WorkspaceError, never>;
  readonly updateWorkspace: (
    workspaceId: string,
    updates: UpdateWorkspaceParams
  ) => Effect.Effect<WorkspaceEntry, WorkspaceError, never>;
  readonly deleteWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly archiveWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly restoreWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly setActiveWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Chat app management
  readonly addChatApp: (
    workspaceId: string,
    appId: string,
    config: ChatAppConfig
  ) => Effect.Effect<ChatAppEntry, WorkspaceError, never>;
  readonly updateChatApp: (
    appId: string,
    updates: Partial<ChatAppConfig>
  ) => Effect.Effect<ChatAppEntry, WorkspaceError, never>;
  readonly removeChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly setChatAppStatus: (
    appId: string,
    status: ChatAppStatus
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly setActiveChatApp: (
    workspaceId: string,
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly archiveChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly restoreChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Chat app status operations
  readonly expandChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly compactChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly stashChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly closeChatApp: (
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Bulk operations
  readonly loadChatApps: (
    apps: ChatAppEntry[]
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly addMultipleChatApps: (
    apps: Array<{ workspaceId: string; config: ChatAppConfig }>
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Layout & preferences
  readonly updateLayoutPreferences: (
    workspaceId: string,
    preferences: LayoutPreferences
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly setMaxExpandedApps: (
    workspaceId: string,
    maxApps: number
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Agent management
  readonly addAgentToWorkspace: (
    workspaceId: string,
    agentId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly removeAgentFromWorkspace: (
    workspaceId: string,
    agentId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly updateWorkspaceAgents: (
    workspaceId: string,
    agentIds: string[]
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Focus mode
  readonly enterFocusMode: (
    workspaceId: string,
    appId: string
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly exitFocusMode: (
    workspaceId: string
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Loading state
  readonly setLoading: (
    isLoading: boolean
  ) => Effect.Effect<void, WorkspaceError, never>;
  readonly startLoading: () => Effect.Effect<void, WorkspaceError, never>;
  readonly finishLoading: () => Effect.Effect<void, WorkspaceError, never>;
  readonly failLoading: (
    error: unknown
  ) => Effect.Effect<void, WorkspaceError, never>;

  // Utilities
  readonly reset: () => Effect.Effect<void, WorkspaceError, never>;
  readonly ensureDefaultWorkspace: () => Effect.Effect<
    void,
    WorkspaceError,
    never
  >;
  readonly getWorkspaceStats: () => Effect.Effect<
    WorkspaceStats,
    WorkspaceError,
    never
  >;

  // Computed state helpers (for convenience)
  readonly getCurrentWorkspace: () => Effect.Effect<
    WorkspaceEntry | null,
    WorkspaceError,
    never
  >;
  readonly getActiveWorkspaces: () => Effect.Effect<
    WorkspaceEntry[],
    WorkspaceError,
    never
  >;
  readonly getChatAppsForWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppEntry[], WorkspaceError, never>;
  readonly getActiveChatAppsInWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppEntry[], WorkspaceError, never>;
  readonly getStashedChatAppsInWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppEntry[], WorkspaceError, never>;
}
