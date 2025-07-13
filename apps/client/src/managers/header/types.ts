export interface HeaderManagerState {
  readonly title: string;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly isStatusPanelOpen: boolean;
  readonly errorInfo: ErrorInfo | null;
  readonly statusInfo: StatusInfo | null;
  readonly isLoading: boolean;
  readonly lastUpdated: Date;
}

export interface ErrorInfo {
  readonly message: string;
  readonly details?: string;
  readonly severity: "error" | "warning";
}

export interface StatusInfo {
  readonly tokens?: {
    readonly used: number;
    readonly remaining: number;
  };
  readonly cost?: {
    readonly current: number;
    readonly limit: number;
    readonly currency: string;
  };
  readonly agentStatus?: {
    readonly state: "idle" | "thinking" | "paused" | "error" | "connecting";
    readonly details?: string;
  };
}

export interface HeaderManagerConfig {
  readonly chatAppId: string;
  readonly initialTitle: string;
  readonly showStatusPanel: boolean;
  readonly showControls: boolean;
  readonly enableErrorDisplay: boolean;
}

export interface HeaderAction {
  readonly type:
    | "expand"
    | "compact"
    | "stash"
    | "close"
    | "settings"
    | "clear";
  readonly enabled: boolean;
  readonly visible: boolean;
}

export interface HeaderActions {
  readonly expand: HeaderAction;
  readonly compact: HeaderAction;
  readonly stash: HeaderAction;
  readonly close: HeaderAction;
  readonly settings: HeaderAction;
  readonly clear: HeaderAction;
}

export interface HeaderManagerStats {
  readonly totalInteractions: number;
  readonly lastInteractionAt: Date | null;
  readonly statusPanelToggleCount: number;
  readonly errorCount: number;
  readonly lastErrorAt: Date | null;
}

// Constants
export const HEADER_MANAGER_CONSTANTS = {
  DEFAULT_TITLE: "Chat App",
  MAX_TITLE_LENGTH: 50,
  STATUS_PANEL_TOGGLE_DELAY: 200,
  ERROR_DISPLAY_TIMEOUT: 5000,
} as const;
