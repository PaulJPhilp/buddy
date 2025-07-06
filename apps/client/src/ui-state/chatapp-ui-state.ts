/**
 * ChatApp UI State Model
 * Contains ONLY presentation and styling concerns
 * References chatapp by ID - no business logic duplication
 */

// UI state for chat app presentation
export interface ChatAppUIState {
  readonly chatAppId: string; // Reference to domain model
  readonly windowState: ChatAppWindowState;
  readonly style: ChatAppStyle;
  readonly isVisible: boolean;
  readonly isFocused: boolean;
  readonly lastUpdated: number;
}

// Window state for chat app
export interface ChatAppWindowState {
  readonly isOpen: boolean;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly position: WindowPosition;
  readonly size: WindowSize;
  readonly zIndex: number;
}

// Visual styling for chat app
export interface ChatAppStyle {
  readonly colors?: {
    readonly primary?: string;
    readonly secondary?: string;
    readonly accent?: string;
    readonly background?: string;
    readonly text?: string;
  };
  readonly borders?: {
    readonly color?: string;
    readonly thickness?: string;
    readonly radius?: string;
  };
  readonly bubbles?: {
    readonly user?: ChatBubbleStyle;
    readonly agent?: ChatBubbleStyle;
  };
  readonly userArea?: {
    readonly background?: string;
    readonly inputRingColor?: string;
    readonly padding?: string;
  };
  readonly header?: {
    readonly background?: string;
    readonly text?: string;
    readonly borderBottom?: string;
    readonly padding?: string;
  };
  readonly chatArea?: {
    readonly background?: string;
    readonly border?: string;
    readonly radius?: string;
    readonly padding?: string;
  };
  readonly typography?: {
    readonly fontFamily?: string;
    readonly fontSize?: string;
  };
}

export interface ChatBubbleStyle {
  readonly background?: string;
  readonly text?: string;
  readonly radius?: string;
  readonly border?: string;
  readonly padding?: string;
}

export interface WindowPosition {
  readonly x: number;
  readonly y: number;
}

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

// Factory functions for UI state
export function createChatAppUIState(params: {
  chatAppId: string;
  windowState?: Partial<ChatAppWindowState>;
  style?: Partial<ChatAppStyle>;
  isVisible?: boolean;
}): ChatAppUIState {
  return {
    chatAppId: params.chatAppId,
    windowState: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 100 },
      size: { width: 400, height: 600 },
      zIndex: 1,
      ...params.windowState,
    },
    style: {
      colors: {
        primary: "#007bff",
        secondary: "#6c757d",
        background: "#ffffff",
        text: "#000000",
      },
      bubbles: {
        user: {
          background: "#007bff",
          text: "#ffffff",
          radius: "8px",
          padding: "8px 12px",
        },
        agent: {
          background: "#f8f9fa",
          text: "#000000",
          radius: "8px",
          padding: "8px 12px",
        },
      },
      ...params.style,
    },
    isVisible: params.isVisible ?? true,
    isFocused: false,
    lastUpdated: Date.now(),
  };
}

export function updateChatAppUIState(
  uiState: ChatAppUIState,
  updates: Partial<Omit<ChatAppUIState, "chatAppId">>
): ChatAppUIState {
  return {
    ...uiState,
    ...updates,
    lastUpdated: Date.now(),
  };
}

// UI utilities
export function createDefaultChatAppStyle(): ChatAppStyle {
  return {
    colors: {
      primary: "#007bff",
      secondary: "#6c757d",
      background: "#ffffff",
      text: "#000000",
    },
    borders: {
      color: "#dee2e6",
      thickness: "1px",
      radius: "8px",
    },
    bubbles: {
      user: {
        background: "#007bff",
        text: "#ffffff",
        radius: "8px",
        padding: "8px 12px",
      },
      agent: {
        background: "#f8f9fa",
        text: "#000000",
        radius: "8px",
        padding: "8px 12px",
      },
    },
    userArea: {
      background: "#ffffff",
      inputRingColor: "#007bff",
      padding: "16px",
    },
    header: {
      background: "#f8f9fa",
      text: "#000000",
      borderBottom: "1px solid #dee2e6",
      padding: "12px 16px",
    },
    chatArea: {
      background: "#ffffff",
      border: "1px solid #dee2e6",
      radius: "8px",
      padding: "16px",
    },
    typography: {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
    },
  };
}

export function isWindowOpen(uiState: ChatAppUIState): boolean {
  return uiState.windowState.isOpen && uiState.isVisible;
}

export function canWindowResize(uiState: ChatAppUIState): boolean {
  return !uiState.windowState.isMaximized && !uiState.windowState.isMinimized;
}
