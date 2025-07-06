import type { Effect } from "effect";
import type { LayoutError } from "./errors";
import type {
  LayoutState,
  LayoutMode,
  ScreenSize,
  SidebarEditor,
} from "./types";

export interface LayoutServiceApi {
  // State access
  readonly getState: () => Effect.Effect<LayoutState, LayoutError>;
  readonly subscribe: (
    listener: (state: LayoutState) => void
  ) => Effect.Effect<() => Effect.Effect<void, never>, LayoutError>;

  // Sidebar management
  readonly toggleSidebar: () => Effect.Effect<LayoutState, LayoutError>;
  readonly openSidebar: () => Effect.Effect<LayoutState, LayoutError>;
  readonly closeSidebar: () => Effect.Effect<LayoutState, LayoutError>;
  readonly setSidebarWidth: (
    width: number
  ) => Effect.Effect<LayoutState, LayoutError>;
  readonly setSidebarCollapsedWidth: (
    width: number
  ) => Effect.Effect<LayoutState, LayoutError>;

  // Toolbar management
  readonly toggleToolbar: () => Effect.Effect<LayoutState, LayoutError>;
  readonly setToolbarVisible: (
    visible: boolean
  ) => Effect.Effect<LayoutState, LayoutError>;
  readonly setToolbarHeight: (
    height: number
  ) => Effect.Effect<LayoutState, LayoutError>;

  // Layout management
  readonly setLayoutMode: (
    mode: LayoutMode
  ) => Effect.Effect<LayoutState, LayoutError>;
  readonly setScreenSize: (
    size: ScreenSize,
    isMobile: boolean
  ) => Effect.Effect<LayoutState, LayoutError>;
  readonly setAnimating: (
    isAnimating: boolean
  ) => Effect.Effect<LayoutState, LayoutError>;

  // Sidebar editor management
  readonly setActiveSidebarEditor: (
    editor: SidebarEditor
  ) => Effect.Effect<LayoutState, LayoutError>;
  readonly clearActiveSidebarEditor: () => Effect.Effect<
    LayoutState,
    LayoutError
  >;

  // Utility
  readonly reset: () => Effect.Effect<LayoutState, LayoutError>;
}
