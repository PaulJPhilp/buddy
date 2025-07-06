/**
 * Workspace UI State Model
 * Contains ONLY presentation and layout concerns
 * References workspace by ID - no business logic duplication
 */

// UI layout configuration for workspaces
export interface WorkspaceLayoutConfig {
  readonly mode: "grid" | "stack" | "tabs" | "free";
  readonly gridConfig?: {
    readonly columns: number;
    readonly rows: number;
    readonly gap: number;
  };
  readonly stackConfig?: {
    readonly direction: "horizontal" | "vertical";
    readonly spacing: number;
  };
  readonly tabsConfig?: {
    readonly position: "top" | "bottom" | "left" | "right";
    readonly closable: boolean;
  };
  readonly freeConfig?: {
    readonly snapToGrid: boolean;
    readonly gridSize: number;
  };
}

// UI state for workspace presentation
export interface WorkspaceUIState {
  readonly workspaceId: string; // Reference to domain model
  readonly layoutConfig: WorkspaceLayoutConfig;
  readonly theme?: WorkspaceTheme;
  readonly position?: WindowPosition;
  readonly size?: WindowSize;
  readonly isMinimized: boolean;
  readonly isMaximized: boolean;
  readonly zIndex: number;
  readonly lastUpdated: number;
}

// Visual theme for workspace
export interface WorkspaceTheme {
  readonly icon?: string;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly borderRadius?: string;
}

// Window positioning
export interface WindowPosition {
  readonly x: number;
  readonly y: number;
}

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

// Factory functions for UI state
export function createWorkspaceUIState(params: {
  workspaceId: string;
  layoutConfig?: Partial<WorkspaceLayoutConfig>;
  theme?: Partial<WorkspaceTheme>;
  position?: WindowPosition;
  size?: WindowSize;
}): WorkspaceUIState {
  return {
    workspaceId: params.workspaceId,
    layoutConfig: {
      mode: "grid",
      gridConfig: {
        columns: 2,
        rows: 2,
        gap: 8,
      },
      ...params.layoutConfig,
    },
    theme: params.theme,
    position: params.position,
    size: params.size,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    lastUpdated: Date.now(),
  };
}

export function updateWorkspaceUIState(
  uiState: WorkspaceUIState,
  updates: Partial<Omit<WorkspaceUIState, "workspaceId">>
): WorkspaceUIState {
  return {
    ...uiState,
    ...updates,
    lastUpdated: Date.now(),
  };
}

// UI utilities
export function createDefaultGridLayout(): WorkspaceLayoutConfig {
  return {
    mode: "grid",
    gridConfig: {
      columns: 2,
      rows: 2,
      gap: 8,
    },
  };
}

export function createDefaultStackLayout(): WorkspaceLayoutConfig {
  return {
    mode: "stack",
    stackConfig: {
      direction: "horizontal",
      spacing: 12,
    },
  };
}

export function createDefaultTabsLayout(): WorkspaceLayoutConfig {
  return {
    mode: "tabs",
    tabsConfig: {
      position: "top",
      closable: true,
    },
  };
}

export function isLayoutMode(
  layout: WorkspaceLayoutConfig,
  mode: string
): boolean {
  return layout.mode === mode;
}

export function calculateNextZIndex(currentStates: WorkspaceUIState[]): number {
  const maxZ = Math.max(...currentStates.map((state) => state.zIndex), 0);
  return maxZ + 1;
}
