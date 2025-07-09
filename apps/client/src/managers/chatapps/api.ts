import { Effect } from "effect";
import type { ChatAppsCommand } from "./commands";
import type { ChatAppsManagerError } from "./errors";
import type {
  ChatAppInstance,
  ChatAppMetrics,
  ChatAppStatus,
  ChatAppsManagerState,
  ChatAppsManagerStats,
  FocusModeConfig,
  LayoutConfig,
  WorkspaceLayoutConfig,
  WorkspaceSpecificStats,
} from "./types";

export interface ChatAppsManagerApi {
  // State Management
  readonly getState: () => Effect.Effect<
    ChatAppsManagerState,
    ChatAppsManagerError
  >;
  readonly setState: (
    updates: Partial<ChatAppsManagerState>
  ) => Effect.Effect<void, ChatAppsManagerError>;
  readonly resetState: () => Effect.Effect<void, ChatAppsManagerError>;

  // ChatApp Instance Management
  readonly registerChatApp: (
    workspaceId: string,
    appId: string,
    config: any // ChatAppConfig
  ) => Effect.Effect<ChatAppInstance, ChatAppsManagerError>;

  readonly unregisterChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatAppInstance: (
    appId: string
  ) => Effect.Effect<ChatAppInstance, ChatAppsManagerError>;

  readonly getAllChatApps: () => Effect.Effect<
    ChatAppInstance[],
    ChatAppsManagerError
  >;

  readonly getChatAppsInWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppInstance[], ChatAppsManagerError>;

  // Status Management
  readonly setChatAppStatus: (
    appId: string,
    status: ChatAppStatus
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly expandChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly compactChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly stashChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly closeChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly archiveChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly restoreChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Active App Management
  readonly setActiveChatApp: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getActiveChatApp: () => Effect.Effect<
    ChatAppInstance | null,
    ChatAppsManagerError
  >;

  readonly clearActiveChatApp: () => Effect.Effect<void, ChatAppsManagerError>;

  // Workspace Capacity Management
  readonly setWorkspaceMaxExpandedApps: (
    workspaceId: string,
    maxApps: number
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getWorkspaceMaxExpandedApps: (
    workspaceId: string
  ) => Effect.Effect<number, ChatAppsManagerError>;

  readonly enforceCapacityLimits: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getExpandedAppsInWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppInstance[], ChatAppsManagerError>;

  // Focus Mode
  readonly enterFocusMode: (
    appId: string,
    config?: FocusModeConfig
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly exitFocusMode: () => Effect.Effect<void, ChatAppsManagerError>;

  readonly getFocusedApp: () => Effect.Effect<
    ChatAppInstance | null,
    ChatAppsManagerError
  >;

  readonly isFocusModeActive: () => Effect.Effect<
    boolean,
    ChatAppsManagerError
  >;

  // Bulk Operations
  readonly expandMultipleChatApps: (
    appIds: string[]
  ) => Effect.Effect<
    { successful: string[]; failed: string[] },
    ChatAppsManagerError
  >;

  readonly stashAllAppsInWorkspace: (
    workspaceId: string,
    exceptAppId?: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly closeAllAppsInWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly restoreWorkspaceLayout: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Configuration Management
  readonly updateChatAppConfig: (
    appId: string,
    config: any // Partial<ChatAppConfig>
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatAppConfig: (
    appId: string
  ) => Effect.Effect<any, ChatAppsManagerError>; // ChatAppConfig

  // Agent Management
  readonly switchChatAppAgent: (
    appId: string,
    agentId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatAppAgent: (
    appId: string
  ) => Effect.Effect<string | null, ChatAppsManagerError>;

  // Statistics and Metrics
  readonly getStats: () => Effect.Effect<
    ChatAppsManagerStats,
    ChatAppsManagerError
  >;

  readonly getWorkspaceStats: (
    workspaceId: string
  ) => Effect.Effect<WorkspaceSpecificStats, ChatAppsManagerError>;

  readonly getChatAppMetrics: (
    appId: string
  ) => Effect.Effect<ChatAppMetrics, ChatAppsManagerError>;

  // Subscriptions
  readonly subscribe: (
    callback: (state: ChatAppsManagerState) => void
  ) => Effect.Effect<() => void, ChatAppsManagerError>;

  // Workspace Events
  readonly onWorkspaceActivated: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly onWorkspaceArchived: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Migration
  readonly migrateChatAppsToWorkspace: (
    appIds: string[],
    targetWorkspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Layout and UI State
  readonly saveChatAppLayout: (
    appId: string,
    layout: LayoutConfig
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly restoreChatAppLayout: (
    appId: string
  ) => Effect.Effect<LayoutConfig | null, ChatAppsManagerError>;

  readonly saveWorkspaceLayout: (
    workspaceId: string,
    layout: WorkspaceLayoutConfig
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Operations
  readonly executeOperation: (
    operation: any // ChatAppsOperation
  ) => Effect.Effect<any, ChatAppsManagerError>;

  readonly getLastOperation: () => Effect.Effect<
    any | null, // ChatAppsOperation | null
    ChatAppsManagerError
  >;

  readonly isOperationInProgress: () => Effect.Effect<
    boolean,
    ChatAppsManagerError
  >;

  // Debugging and Development
  readonly debugGetAllInstances: () => Effect.Effect<
    Record<string, ChatAppInstance>,
    ChatAppsManagerError
  >;

  readonly debugResetState: () => Effect.Effect<void, ChatAppsManagerError>;

  readonly debugValidateState: () => Effect.Effect<
    boolean,
    ChatAppsManagerError
  >;

  // Command Dispatch
  readonly dispatch: (command: ChatAppsCommand) => Effect.Effect<void, never>;
}
