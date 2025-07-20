/**
 * App UI State Model
 * Contains ONLY presentation state for the entire application
 * References domain models by ID - no business logic duplication
 */

import type { ChatAppUIState } from "./chatapp-ui-state";
import type { WorkspaceUIState } from "./workspace-ui-state";

// Overall app UI state
export interface AppUIState {
  readonly currentWorkspaceId: string | null;
  readonly workspaceUIStates: Map<string, WorkspaceUIState>;
  readonly chatAppUIStates: Map<string, ChatAppUIState>;
  readonly globalTheme: AppTheme;
  readonly layout: AppLayoutState;
  readonly isAppShellRendered: boolean;
  readonly lastUpdated: number;
}

// Global app theme
export interface AppTheme {
  readonly mode: "light" | "dark" | "auto";
  readonly primaryColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly fontFamily: string;
  readonly fontSize: string;
}

// App layout state
export interface AppLayoutState {
  readonly headerHeight: number;
  readonly sidebarWidth: number;
  readonly isSidebarCollapsed: boolean;
  readonly isFullscreen: boolean;
  readonly viewportSize: {
    readonly width: number;
    readonly height: number;
  };
}

// Factory functions
export function createAppUIState(params?: {
  currentWorkspaceId?: string | null;
  globalTheme?: Partial<AppTheme>;
  layout?: Partial<AppLayoutState>;
}): AppUIState {
  return {
    currentWorkspaceId: params?.currentWorkspaceId ?? null,
    workspaceUIStates: new Map(),
    chatAppUIStates: new Map(),
    globalTheme: {
      mode: "light",
      primaryColor: "#007bff",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#dee2e6",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      ...params?.globalTheme,
    },
    layout: {
      headerHeight: 60,
      sidebarWidth: 280,
      isSidebarCollapsed: false,
      isFullscreen: false,
      viewportSize: {
        width: 1200,
        height: 800,
      },
      ...params?.layout,
    },
    isAppShellRendered: false,
    lastUpdated: Date.now(),
  };
}

export function updateAppUIState(
  uiState: AppUIState,
  updates: Partial<Omit<AppUIState, "workspaceUIStates" | "chatAppUIStates">>
): AppUIState {
  return {
    ...uiState,
    ...updates,
    lastUpdated: Date.now(),
  };
}

// UI state management utilities
export function setCurrentWorkspace(
  uiState: AppUIState,
  workspaceId: string | null
): AppUIState {
  return updateAppUIState(uiState, {
    currentWorkspaceId: workspaceId,
  });
}

export function addWorkspaceUIState(
  uiState: AppUIState,
  workspaceUIState: WorkspaceUIState
): AppUIState {
  const newWorkspaceStates = new Map(uiState.workspaceUIStates);
  newWorkspaceStates.set(workspaceUIState.workspaceId, workspaceUIState);

  return {
    ...uiState,
    workspaceUIStates: newWorkspaceStates,
    lastUpdated: Date.now(),
  };
}

export function addChatAppUIState(
  uiState: AppUIState,
  chatAppUIState: ChatAppUIState
): AppUIState {
  const newChatAppStates = new Map(uiState.chatAppUIStates);
  newChatAppStates.set(chatAppUIState.chatAppId, chatAppUIState);

  return {
    ...uiState,
    chatAppUIStates: newChatAppStates,
    lastUpdated: Date.now(),
  };
}

export function getCurrentWorkspaceUIState(
  uiState: AppUIState
): WorkspaceUIState | null {
  if (!uiState.currentWorkspaceId) return null;
  return uiState.workspaceUIStates.get(uiState.currentWorkspaceId) ?? null;
}

export function getChatAppUIState(
  uiState: AppUIState,
  chatAppId: string
): ChatAppUIState | null {
  return uiState.chatAppUIStates.get(chatAppId) ?? null;
}

// Theme utilities
export function createLightTheme(): AppTheme {
  return {
    mode: "light",
    primaryColor: "#007bff",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#dee2e6",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
  };
}

export function createDarkTheme(): AppTheme {
  return {
    mode: "dark",
    primaryColor: "#0d6efd",
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
    borderColor: "#404040",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
  };
}
