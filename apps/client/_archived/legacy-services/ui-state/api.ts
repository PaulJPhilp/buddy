/**
 * UI State Service API
 * Manages presentation state separately from business domain
 */

import { Effect } from "effect";
import type { UIStateServiceError } from "./errors";
import type {
  AppUIState,
  WorkspaceUIState,
  ChatAppUIState,
  AppTheme,
  AppLayoutState,
} from "../../ui";

export interface UIStateServiceApi {
  // App UI state management
  readonly getAppUIState: () => Effect.Effect<AppUIState, UIStateServiceError>;
  
  readonly updateAppUIState: (
    updates: Partial<AppUIState>
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly setCurrentWorkspace: (
    workspaceId: string | null
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly setAppShellRendered: (
    rendered: boolean
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  // Theme management
  readonly getTheme: () => Effect.Effect<AppTheme, UIStateServiceError>;
  
  readonly setTheme: (
    theme: AppTheme
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly toggleThemeMode: () => Effect.Effect<AppUIState, UIStateServiceError>;

  // Layout management
  readonly getLayout: () => Effect.Effect<AppLayoutState, UIStateServiceError>;
  
  readonly updateLayout: (
    updates: Partial<AppLayoutState>
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly toggleSidebar: () => Effect.Effect<AppUIState, UIStateServiceError>;
  
  readonly setFullscreen: (
    fullscreen: boolean
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  // Workspace UI state
  readonly getWorkspaceUIState: (
    workspaceId: string
  ) => Effect.Effect<WorkspaceUIState | null, UIStateServiceError>;

  readonly setWorkspaceUIState: (
    workspaceUIState: WorkspaceUIState
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly updateWorkspaceUIState: (
    workspaceId: string,
    updates: Partial<WorkspaceUIState>
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly removeWorkspaceUIState: (
    workspaceId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  // ChatApp UI state
  readonly getChatAppUIState: (
    chatAppId: string
  ) => Effect.Effect<ChatAppUIState | null, UIStateServiceError>;

  readonly setChatAppUIState: (
    chatAppUIState: ChatAppUIState
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly updateChatAppUIState: (
    chatAppId: string,
    updates: Partial<ChatAppUIState>
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly removeChatAppUIState: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  // Window management
  readonly openChatApp: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly closeChatApp: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly focusChatApp: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly minimizeChatApp: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  readonly maximizeChatApp: (
    chatAppId: string
  ) => Effect.Effect<AppUIState, UIStateServiceError>;

  // Persistence
  readonly saveUIState: () => Effect.Effect<void, UIStateServiceError>;
  
  readonly loadUIState: () => Effect.Effect<AppUIState, UIStateServiceError>;
  
  readonly resetUIState: () => Effect.Effect<AppUIState, UIStateServiceError>;

  // Utilities
  readonly calculateNextZIndex: () => Effect.Effect<number, UIStateServiceError>;
  
  readonly getVisibleChatApps: () => Effect.Effect<string[], UIStateServiceError>;
  
  readonly getCurrentWorkspaceUIState: () => Effect.Effect<WorkspaceUIState | null, UIStateServiceError>;
} 