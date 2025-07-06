/**
 * UI State Models Index
 * Exports all presentation and layout state models
 * These models contain NO business logic - only UI concerns
 */

// Workspace UI
export type {
  WorkspaceUIState,
  WorkspaceLayoutConfig,
  WorkspaceTheme,
  WindowPosition,
  WindowSize,
} from "./workspace-ui-state";

export {
  createWorkspaceUIState,
  updateWorkspaceUIState,
  createDefaultGridLayout,
  createDefaultStackLayout,
  createDefaultTabsLayout,
  isLayoutMode,
  calculateNextZIndex,
} from "./workspace-ui-state";

// ChatApp UI
export type {
  ChatAppUIState,
  ChatAppWindowState,
  ChatAppStyle,
  ChatBubbleStyle,
} from "./chatapp-ui-state";

export {
  createChatAppUIState,
  updateChatAppUIState,
  createDefaultChatAppStyle,
  isWindowOpen,
  canWindowResize,
} from "./chatapp-ui-state";

// App UI
export type {
  AppUIState,
  AppTheme,
  AppLayoutState,
} from "./app-ui-state";

export {
  createAppUIState,
  updateAppUIState,
  setCurrentWorkspace,
  addWorkspaceUIState,
  addChatAppUIState,
  getCurrentWorkspaceUIState,
  getChatAppUIState,
  createLightTheme,
  createDarkTheme,
} from "./app-ui-state"; 