import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { ChatState, MessageApi } from "../../services/chat/types";
import type { ChatAppsManagerError } from "./errors";
import type {
  ChatAppInstance,
  ChatAppStatus,
  ChatAppsManagerState,
  ChatAppsManagerStats,
  FocusModeConfig,
} from "./types";

export interface ChatAppsManagerApi {
  // ChatApp Instance Management
  readonly registerChatApp: (
    workspaceId: string,
    appId: string,
    config: ChatAppConfig
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

  // State Management
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

  // Chat Operations (delegated to ChatManager)
  readonly sendMessage: (
    appId: string,
    content: string,
    attachments?: File[]
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly sendMessageToActiveApp: (
    content: string,
    attachments?: File[]
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatState: (
    appId: string
  ) => Effect.Effect<ChatState, ChatAppsManagerError>;

  readonly getActiveChatState: () => Effect.Effect<
    ChatState | null,
    ChatAppsManagerError
  >;

  readonly getChatHistory: (
    appId: string
  ) => Effect.Effect<MessageApi[], ChatAppsManagerError>;

  readonly clearChatHistory: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly initializeChatInstance: (
    appId: string,
    agentId?: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly closeChatInstance: (
    appId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Capacity Management
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

  // Focus Mode Management
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
  ) => Effect.Effect<void, ChatAppsManagerError>;

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
    config: Partial<ChatAppConfig>
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatAppConfig: (
    appId: string
  ) => Effect.Effect<ChatAppConfig, ChatAppsManagerError>;

  // Agent Management Integration
  readonly switchChatAppAgent: (
    appId: string,
    agentId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly getChatAppAgent: (
    appId: string
  ) => Effect.Effect<string | null, ChatAppsManagerError>;

  // Statistics and Monitoring
  readonly getStats: () => Effect.Effect<
    ChatAppsManagerStats,
    ChatAppsManagerError
  >;

  readonly getWorkspaceStats: (
    workspaceId: string
  ) => Effect.Effect<any, ChatAppsManagerError>; // WorkspaceSpecificStats

  readonly getChatAppMetrics: (
    appId: string
  ) => Effect.Effect<any, ChatAppsManagerError>; // ChatAppMetrics

  // State Management and Subscriptions
  readonly getState: () => Effect.Effect<
    ChatAppsManagerState,
    ChatAppsManagerError
  >;

  readonly subscribe: (
    listener: (state: ChatAppsManagerState) => void
  ) => Effect.Effect<() => Effect.Effect<void>, ChatAppsManagerError>;

  // Workspace Integration
  readonly onWorkspaceActivated: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly onWorkspaceArchived: (
    workspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly migrateChatAppsToWorkspace: (
    appIds: string[],
    targetWorkspaceId: string
  ) => Effect.Effect<void, ChatAppsManagerError>;

  // Layout and UI State
  readonly saveChatAppLayout: (
    appId: string,
    layout: any // LayoutConfig
  ) => Effect.Effect<void, ChatAppsManagerError>;

  readonly restoreChatAppLayout: (
    appId: string
  ) => Effect.Effect<any | null, ChatAppsManagerError>; // LayoutConfig | null

  readonly saveWorkspaceLayout: (
    workspaceId: string,
    layout: any // WorkspaceLayoutConfig
  ) => Effect.Effect<void, ChatAppsManagerError>;

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
}
