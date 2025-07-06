import type {
  CoreComponentConfig,
  CoreComponentState,
} from "@/components/core";
import type { AgentConfig, ChatAppConfig } from "@/types/global";

// Chat app UI states
export interface ChatAppUIState {
  readonly isWindowOpen: boolean;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly windowPosition: { x: number; y: number };
  readonly windowSize: { width: number; height: number };
  readonly zIndex: number;
  readonly isFocused: boolean;
}

// Chat app component state (extends CoreComponentState)
export interface ChatAppComponentState extends CoreComponentState {
  readonly chatAppConfig: ChatAppConfig | null;
  readonly assignedAgents: AgentConfig[];
  readonly uiState: ChatAppUIState;
  readonly isChatAppLoaded: boolean;
  readonly isUIRendered: boolean;
  readonly conversationCount: number;
  readonly lastActivity: number;
}

// Chat app component configuration (extends CoreComponentConfig)
export interface ChatAppComponentConfig extends CoreComponentConfig {
  readonly chatAppId: string;
  readonly autoLoadAgents?: boolean;
  readonly autoRenderUI?: boolean;
  readonly defaultWindowSize?: { width: number; height: number };
  readonly defaultWindowPosition?: { x: number; y: number };
}

// Chat app lifecycle states
export const CHATAPP_LIFECYCLE = {
  UNINITIALIZED: "uninitialized",
  LOADING_CHATAPP: "loading_chatapp",
  CHATAPP_LOADED: "chatapp_loaded",
  LOADING_AGENTS: "loading_agents",
  AGENTS_LOADED: "agents_loaded",
  OPENING_WINDOW: "opening_window",
  WINDOW_OPENED: "window_opened",
  RENDERING_UI: "rendering_ui",
  UI_RENDERED: "ui_rendered",
  READY: "ready",
  MINIMIZED: "minimized",
  MAXIMIZED: "maximized",
  CLOSING: "closing",
  CLOSED: "closed",
  ERROR: "error",
} as const;

export type ChatAppLifecycleState =
  (typeof CHATAPP_LIFECYCLE)[keyof typeof CHATAPP_LIFECYCLE];

// Chat app operations
export const CHATAPP_OPERATIONS = {
  LOAD_CONFIG: "load_config",
  LOAD_AGENTS: "load_agents",
  OPEN_WINDOW: "open_window",
  CLOSE_WINDOW: "close_window",
  MINIMIZE_WINDOW: "minimize_window",
  MAXIMIZE_WINDOW: "maximize_window",
  RESTORE_WINDOW: "restore_window",
  MOVE_WINDOW: "move_window",
  RESIZE_WINDOW: "resize_window",
  FOCUS_WINDOW: "focus_window",
  BLUR_WINDOW: "blur_window",
  RENDER_UI: "render_ui",
  START_CONVERSATION: "start_conversation",
  END_CONVERSATION: "end_conversation",
} as const;

export type ChatAppOperationType =
  (typeof CHATAPP_OPERATIONS)[keyof typeof CHATAPP_OPERATIONS];

// Window management types
export interface WindowPosition {
  readonly x: number;
  readonly y: number;
}

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

export interface WindowState {
  readonly position: WindowPosition;
  readonly size: WindowSize;
  readonly isOpen: boolean;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly isFocused: boolean;
  readonly zIndex: number;
}

// Default UI state
export function createDefaultUIState(): ChatAppUIState {
  return {
    isWindowOpen: false,
    isMinimized: false,
    isMaximized: false,
    windowPosition: { x: 100, y: 100 },
    windowSize: { width: 800, height: 600 },
    zIndex: 1,
    isFocused: false,
  };
}

// Default chat app component state
export function createDefaultChatAppState(): ChatAppComponentState {
  return {
    isInitialized: false,
    isLoading: false,
    lastUpdated: Date.now(),
    chatAppConfig: null,
    assignedAgents: [],
    uiState: createDefaultUIState(),
    isChatAppLoaded: false,
    isUIRendered: false,
    conversationCount: 0,
    lastActivity: Date.now(),
  };
}

// Helper to filter agents for chat app
export function filterAgentsForChatApp(
  agents: AgentConfig[],
  chatApp: ChatAppConfig
): AgentConfig[] {
  return agents.filter((agent) => agent.id === chatApp.agentId);
}

// Helper to calculate next z-index
export function calculateNextZIndex(currentMaxZ: number): number {
  return currentMaxZ + 1;
}

// Helper to validate window bounds
export function validateWindowBounds(
  position: WindowPosition,
  size: WindowSize,
  screenBounds: { width: number; height: number }
): { position: WindowPosition; size: WindowSize } {
  const validatedSize = {
    width: Math.min(Math.max(size.width, 300), screenBounds.width),
    height: Math.min(Math.max(size.height, 200), screenBounds.height),
  };

  const validatedPosition = {
    x: Math.min(
      Math.max(position.x, 0),
      screenBounds.width - validatedSize.width
    ),
    y: Math.min(
      Math.max(position.y, 0),
      screenBounds.height - validatedSize.height
    ),
  };

  return {
    position: validatedPosition,
    size: validatedSize,
  };
}
