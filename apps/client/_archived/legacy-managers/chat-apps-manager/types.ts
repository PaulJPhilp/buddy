import type { ChatAppConfig } from "@/types/global";

// Re-export external types if needed
export type { ChatAppConfig } from "@/types/global";

// ChatApp Status Types
export type ChatAppStatus =
  | "stashed" // Hidden, not taking up UI space
  | "compact" // Visible but minimized
  | "expanded" // Full size, can receive input
  | "archived" // Soft deleted, can be restored
  | "closed"; // Hard deleted, cannot be restored

// ChatApp Instance
export interface ChatAppInstance {
  readonly id: string;
  readonly workspaceId: string;
  readonly config: ChatAppConfig;
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

export interface ChatAppInstanceMetadata {
  readonly messageCount: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly lastInteractionAt?: Date;
  readonly errorCount: number;
  readonly agentSwitchCount: number;
  readonly statusChangeCount: number;
  readonly focusModeEnterCount: number;
  readonly timeInExpanded: number; // milliseconds
  readonly timeInCompact: number; // milliseconds
}

// Layout Configuration
export interface LayoutConfig {
  readonly position?: {
    readonly x: number;
    readonly y: number;
  };
  readonly size?: {
    readonly width: number;
    readonly height: number;
  };
  readonly zIndex?: number;
  readonly isMinimized?: boolean;
  readonly customProperties?: Record<string, unknown>;
}

export interface WorkspaceLayoutConfig {
  readonly workspaceId: string;
  readonly maxExpandedApps: number;
  readonly layoutMode: "grid" | "stack" | "tabs" | "free";
  readonly gridConfig?: {
    readonly columns: number;
    readonly rows: number;
    readonly gap: number;
  };
  readonly stackConfig?: {
    readonly direction: "horizontal" | "vertical";
    readonly spacing: number;
  };
  readonly customProperties?: Record<string, unknown>;
}

// Focus Mode Configuration
export interface FocusModeConfig {
  readonly hideOtherApps: boolean;
  readonly dimOtherApps: boolean;
  readonly disableOtherApps: boolean;
  readonly showExitButton: boolean;
  readonly autoExitOnInactivity?: number; // milliseconds
  readonly customProperties?: Record<string, unknown>;
}

export interface FocusModeState {
  readonly isActive: boolean;
  readonly focusedAppId: string | null;
  readonly config: FocusModeConfig | null;
  readonly enteredAt: Date | null;
  readonly previousAppStates: Record<string, ChatAppStatus>; // For restoration
}

// Capacity Management
export interface WorkspaceCapacityConfig {
  readonly workspaceId: string;
  readonly maxExpandedApps: number;
  readonly maxTotalApps: number;
  readonly autoStashPolicy: "oldest" | "least-used" | "manual";
  readonly capacityWarningThreshold: number; // percentage
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
}

// Statistics
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
    readonly totalTimeInFocus: number; // milliseconds
    readonly averageSessionDuration: number; // milliseconds
  };
  readonly capacityUtilization: Record<
    string,
    {
      readonly workspaceId: string;
      readonly current: number;
      readonly max: number;
      readonly utilization: number; // percentage
    }
  >;
  readonly lastUpdated: Date;
}

export interface WorkspaceSpecificStats {
  readonly workspaceId: string;
  readonly totalApps: number;
  readonly expandedApps: number;
  readonly compactApps: number;
  readonly stashedApps: number;
  readonly archivedApps: number;
  readonly activeAppId: string | null;
  readonly capacityUtilization: number; // percentage
  readonly totalMessages: number;
  readonly lastActivityAt: Date | null;
  readonly mostUsedAppId: string | null;
  readonly averageAppLifetime: number; // milliseconds
}

export interface ChatAppMetrics {
  readonly appId: string;
  readonly workspaceId: string;
  readonly status: ChatAppStatus;
  readonly isActive: boolean;
  readonly agentId: string | null;
  readonly messageCount: number;
  readonly interactionCount: number;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly timeActive: number; // milliseconds
  readonly timeInCurrentStatus: number; // milliseconds
  readonly agentSwitchCount: number;
  readonly focusModeEnterCount: number;
  readonly lastActivityAt: Date | null;
  readonly createdAt: Date;
  readonly performance: {
    readonly responseTimeP50: number;
    readonly responseTimeP95: number;
    readonly responseTimeP99: number;
    readonly throughputPerMinute: number;
  };
}

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
} as const;

// NOTE: ChatAppsManager does not own workspace or agent state. It only stores IDs and queries the owning manager for details.
