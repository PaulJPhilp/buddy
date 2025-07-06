/**
 * UI State Service Types
 * Re-exports UI models and adds service-specific types
 */

// Re-export UI models
export type {
  AppUIState,
  AppTheme,
  AppLayoutState,
  WorkspaceUIState,
  WorkspaceLayoutConfig,
  WorkspaceTheme,
  ChatAppUIState,
  ChatAppWindowState,
  ChatAppStyle,
  ChatBubbleStyle,
  WindowPosition,
  WindowSize,
} from "../../ui";

// Service-specific types
export interface UIStatePersistenceOptions {
  readonly storageKey?: string;
  readonly compression?: boolean;
  readonly encryption?: boolean;
  readonly debounceMs?: number;
}

export interface UIStateValidationOptions {
  readonly strict?: boolean;
  readonly allowPartialState?: boolean;
  readonly validateReferences?: boolean;
}

export interface UIStateRestoreOptions {
  readonly fallbackToDefaults?: boolean;
  readonly validateOnRestore?: boolean;
  readonly mergeWithCurrent?: boolean;
}

// UI state events
export interface UIStateChangeEvent {
  readonly type: "theme" | "layout" | "workspace" | "chatapp";
  readonly target: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: number;
}

// UI state snapshots
export interface UIStateSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly appUIState: AppUIState;
  readonly metadata?: Record<string, unknown>;
}

// Constants
export const UI_STATE_CONSTANTS = {
  DEFAULT_STORAGE_KEY: "buddy-ui-state",
  DEFAULT_DEBOUNCE_MS: 300,
  MAX_SNAPSHOTS: 10,
  THEME_STORAGE_KEY: "buddy-theme",
  LAYOUT_STORAGE_KEY: "buddy-layout",
} as const;
