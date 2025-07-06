// Layout mode types
export type LayoutMode = "default" | "compact" | "wide";

// Screen size types
export type ScreenSize = "sm" | "md" | "lg" | "xl";

// Sidebar editor types
export type SidebarEditor = "stashed" | "workspace" | null;

// Layout state interface
export interface LayoutState {
  readonly isSidebarOpen: boolean;
  readonly sidebarWidth: number;
  readonly sidebarCollapsedWidth: number;
  readonly isToolbarVisible: boolean;
  readonly toolbarHeight: number;
  readonly layoutMode: LayoutMode;
  readonly isMobile: boolean;
  readonly screenSize: ScreenSize;
  readonly isAnimating: boolean;
  readonly activeSidebarEditor: SidebarEditor;
  readonly activeChatAppId: string | null;
}

// Layout configuration interface
export interface LayoutConfig {
  readonly defaultSidebarWidth: number;
  readonly defaultSidebarCollapsedWidth: number;
  readonly defaultToolbarHeight: number;
  readonly autoCloseSidebarOnMobile: boolean;
  readonly enableAnimations: boolean;
}

// Layout constants
export const LAYOUT_CONSTANTS = {
  DEFAULT_SIDEBAR_WIDTH: 280,
  DEFAULT_SIDEBAR_COLLAPSED_WIDTH: 60,
  DEFAULT_TOOLBAR_HEIGHT: 48,
  MIN_SIDEBAR_WIDTH: 200,
  MAX_SIDEBAR_WIDTH: 500,
  MIN_TOOLBAR_HEIGHT: 32,
  MAX_TOOLBAR_HEIGHT: 80,
  ANIMATION_DURATION: 200,
} as const;

// Default layout state
export const DEFAULT_LAYOUT_STATE: LayoutState = {
  isSidebarOpen: false,
  sidebarWidth: LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsedWidth: LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_COLLAPSED_WIDTH,
  isToolbarVisible: true,
  toolbarHeight: LAYOUT_CONSTANTS.DEFAULT_TOOLBAR_HEIGHT,
  layoutMode: "default",
  isMobile: false,
  screenSize: "lg",
  isAnimating: false,
  activeSidebarEditor: null,
  activeChatAppId: null,
};
