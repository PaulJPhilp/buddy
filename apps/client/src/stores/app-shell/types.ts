/**
 * @file App Shell Store Types
 * @module stores/app-shell/types
 */

// Layout Store Types
export interface AppLayoutState {
    // Sidebar state
    readonly isSidebarOpen: boolean;
    readonly sidebarWidth: number;
    readonly sidebarCollapsedWidth: number;

    // Toolbar state
    readonly isToolbarVisible: boolean;
    readonly toolbarHeight: number;

    // Layout preferences
  readonly layoutMode: "default" | "compact" | "wide";

    // Responsive state
    readonly isMobile: boolean;
  readonly screenSize: "sm" | "md" | "lg" | "xl";

    // Animation state
    readonly isAnimating: boolean;
}

export type AppLayoutEvent =
  | { type: "toggleSidebar" }
  | { type: "setSidebarOpen"; isOpen: boolean }
  | { type: "setSidebarWidth"; width: number }
  | { type: "setLayoutMode"; mode: AppLayoutState["layoutMode"] }
  | { type: "setScreenSize"; size: AppLayoutState["screenSize"] }
  | { type: "setToolbarVisible"; visible: boolean }
  | { type: "setMobile"; isMobile: boolean }
  | { type: "startAnimation" }
  | { type: "endAnimation" };

// Navigation Store Types
export interface BreadcrumbItem {
    readonly id: string;
    readonly label: string;
    readonly route: string;
    readonly isActive: boolean;
}

export interface NavigationState {
    // Current location
    readonly currentRoute: string;
    readonly previousRoute: string | null;

    // Navigation history
    readonly history: readonly string[];
    readonly historyIndex: number;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;

    // Active sections
  readonly activeSection: "chat" | "settings" | "help" | "dashboard";
    readonly activeChatId: string | null;
    readonly activeToolId: string | null;

    // Breadcrumbs
    readonly breadcrumbs: readonly BreadcrumbItem[];

    // Navigation state
    readonly isNavigating: boolean;
    readonly navigationError: string | null;
}

export type NavigationEvent =
  | { type: "navigate"; route: string }
  | { type: "goBack" }
  | { type: "goForward" }
  | { type: "setActiveSection"; section: NavigationState["activeSection"] }
  | { type: "setActiveChatId"; chatId: string | null }
  | { type: "setActiveToolId"; toolId: string | null }
  | { type: "updateBreadcrumbs"; breadcrumbs: BreadcrumbItem[] }
  | { type: "startNavigation" }
  | { type: "navigationComplete" }
  | { type: "navigationError"; error: string }
  | { type: "clearNavigationError" };

// Shared types
export interface StoreSelectors<TState> {
    getState: (state: () => { context: TState }) => TState;
}

export interface StoreActions<TEvent> {
    send: (event: TEvent) => void;
}

// Utility types for store creation
export type StoreConfig<TState, TEvent> = {
    context: TState;
    on: Record<string, (context: TState, event: any) => TState>;
};

// Re-export for convenience
export type {
  AppLayoutEvent as LayoutEvent,
  AppLayoutState as LayoutState,
  NavigationEvent,
  NavigationState,
};
