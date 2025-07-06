// Re-export external types if needed
export type { ChatAppConfig } from "../../types/global";

// ChatApp Status Types
export type ChatAppStatus =
  | "stashed"
  | "compact"
  | "expanded"
  | "archived"
  | "closed";

// ChatApp Instance
export interface ChatAppInstance {
  readonly id: string;
  readonly workspaceId: string;
  readonly config: any; // ChatAppConfig
  readonly status: ChatAppStatus;
  readonly isActive: boolean; // Only one app can be active at a time
  readonly agentId: string | null;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly lastStatusChangeAt: Date;
  readonly previousStatus?: ChatAppStatus; // For restoration after focus mode
  readonly metadata: ChatAppInstanceMetadata;
  readonly layout?: LayoutConfig;
}

// ChatApp Instance Metadata
export interface ChatAppInstanceMetadata {
  readonly totalMessages: number;
  readonly totalInteractions: number;
  readonly lastInteractionAt: Date | null;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly successRate: number;
  readonly tags: string[];
  readonly customData: Record<string, any>;
}

// Focus Mode
export interface FocusModeConfig {
  readonly hideOtherApps: boolean;
  readonly dimOtherApps: boolean;
  readonly disableOtherApps: boolean;
  readonly showExitButton: boolean;
  readonly autoExitTimeout?: number; // milliseconds
}

export interface FocusModeState {
  readonly isActive: boolean;
  readonly focusedAppId: string | null;
  readonly config: FocusModeConfig | null;
  readonly enteredAt: Date | null;
  readonly previousAppStates: Record<string, ChatAppStatus>;
}

// Workspace Capacity
export interface WorkspaceCapacityConfig {
  readonly maxTotalApps: number;
  readonly maxExpandedApps: number;
  readonly autoStashPolicy: "oldest" | "least-used" | "manual";
  readonly warningThreshold: number; // percentage
}

// Layout Configuration
export interface LayoutConfig {
  readonly position: { x: number; y: number };
  readonly size: { width: number; height: number };
  readonly zIndex: number;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly customProperties: Record<string, any>;
}

export interface WorkspaceLayoutConfig {
  readonly gridSize: { rows: number; columns: number };
  readonly defaultAppSize: { width: number; height: number };
  readonly spacing: { horizontal: number; vertical: number };
  readonly autoLayout: boolean;
  readonly layoutMode: "grid" | "cascade" | "custom";
  readonly customProperties: Record<string, any>;
}

// Statistics and Metrics
export interface ChatAppMetrics {
  readonly totalMessages: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
  readonly uptime: number;
  readonly lastActiveAt: Date;
  readonly performanceScore: number;
}

export interface WorkspaceSpecificStats {
  readonly workspaceId: string;
  readonly totalApps: number;
  readonly activeApps: number;
  readonly expandedApps: number;
  readonly compactApps: number;
  readonly stashedApps: number;
  readonly archivedApps: number;
  readonly totalMessages: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
  readonly capacityUtilization: number;
  readonly lastUpdated: Date;
}

export interface ChatAppsManagerStats {
  readonly totalApps: number;
  readonly activeApps: number;
  readonly expandedApps: number;
  readonly compactApps: number;
  readonly stashedApps: number;
  readonly archivedApps: number;
  readonly totalWorkspaces: number;
  readonly averageAppsPerWorkspace: number;
  readonly totalMessages: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
  readonly focusModeUsage: {
    readonly totalSessions: number;
    readonly totalTimeInFocus: number;
    readonly averageSessionDuration: number;
  };
  readonly capacityUtilization: Record<string, number>;
  readonly lastUpdated: Date;
}

// Manager State
export interface ChatAppsManagerState {
  readonly chatAppInstances: Record<string, ChatAppInstance>;
  readonly activeAppId: string | null;
  readonly focusMode: FocusModeState;
  readonly workspaceCapacities: Record<string, WorkspaceCapacityConfig>;
  readonly workspaceLayouts: Record<string, WorkspaceLayoutConfig>;
  readonly stats: ChatAppsManagerStats;
  readonly lastUpdated: Date;
  readonly isLoading: boolean;
  readonly lastError: string | null;
  readonly operationHistory: ChatAppsOperation[];
  readonly lastOperation: ChatAppsOperation | null;
}

// Operations
export interface ChatAppsOperation {
  readonly id: string;
  readonly type: ChatAppsOperationType;
  readonly appId?: string;
  readonly workspaceId?: string;
  readonly params: Record<string, any>;
  readonly timestamp: Date;
  readonly status: "pending" | "in-progress" | "completed" | "failed";
  readonly result?: any;
  readonly error?: string;
  readonly duration?: number;
}

export type ChatAppsOperationType =
  | "register-app"
  | "unregister-app"
  | "set-status"
  | "set-active"
  | "enter-focus"
  | "exit-focus"
  | "expand-multiple"
  | "stash-all"
  | "close-all"
  | "update-config"
  | "switch-agent"
  | "save-layout"
  | "migrate-apps"
  | "enforce-capacity"
  | "bulk-operation";

// Configuration Constants
export const CHAT_APPS_MANAGER_CONSTANTS = {
  DEFAULT_MAX_EXPANDED_APPS: 2,
  DEFAULT_MAX_TOTAL_APPS: 10,
  DEFAULT_AUTO_STASH_POLICY: "oldest" as const,
  DEFAULT_CAPACITY_WARNING_THRESHOLD: 80, // percentage
  DEFAULT_FOCUS_MODE_CONFIG: {
    hideOtherApps: false,
    dimOtherApps: true,
    disableOtherApps: false,
    showExitButton: true,
  } as FocusModeConfig,
  VALID_STATUS_TRANSITIONS: {
    stashed: ["compact", "expanded", "archived", "closed"],
    compact: ["stashed", "expanded", "archived", "closed"],
    expanded: ["stashed", "compact", "archived", "closed"],
    archived: ["stashed", "compact", "expanded", "closed"],
    closed: [], // No transitions from closed
  } as Record<ChatAppStatus, ChatAppStatus[]>,
  AUTO_EXIT_FOCUS_MODE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CAPACITY_CHECK_INTERVAL: 5000, // 5 seconds
  STATS_UPDATE_INTERVAL: 10000, // 10 seconds
  LAYOUT_SAVE_DEBOUNCE: 1000, // 1 second
  MAX_OPERATION_HISTORY: 100,
  OPERATION_TIMEOUT: 30000, // 30 seconds
} as const;

// Validation helpers
export const isValidChatAppStatus = (
  status: string
): status is ChatAppStatus => {
  return ["stashed", "compact", "expanded", "archived", "closed"].includes(
    status
  );
};

export const isValidStatusTransition = (
  from: ChatAppStatus,
  to: ChatAppStatus
): boolean => {
  return CHAT_APPS_MANAGER_CONSTANTS.VALID_STATUS_TRANSITIONS[from].includes(
    to
  );
};

export const isValidCapacityConfig = (
  config: Partial<WorkspaceCapacityConfig>
): boolean => {
  if (config.maxTotalApps !== undefined && config.maxTotalApps < 1)
    return false;
  if (config.maxExpandedApps !== undefined && config.maxExpandedApps < 1)
    return false;
  if (
    config.warningThreshold !== undefined &&
    (config.warningThreshold < 0 || config.warningThreshold > 100)
  )
    return false;
  return true;
};

export const generateOperationId = (): string => {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateChatAppId = (): string => {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
