import { createStore } from "@xstate/store";
import { createStoreHooks } from "./createStoreHooks";

// App layout store state interface
export interface AppLayoutState {
  readonly isSidebarOpen: boolean;
  readonly sidebarWidth: number;
  readonly sidebarCollapsedWidth: number;
  readonly isToolbarVisible: boolean;
  readonly toolbarHeight: number;
  readonly layoutMode: "default" | "compact" | "wide";
  readonly isMobile: boolean;
  readonly screenSize: "sm" | "md" | "lg" | "xl";
  readonly isAnimating: boolean;
  readonly activeSidebarEditor: "stashed" | "workspace" | null;
  readonly activeChatAppId: string | null;
}

// App layout store events
export type AppLayoutAction =
  | { type: "toggleSidebar" }
  | { type: "openSidebar" }
  | { type: "closeSidebar" }
  | { type: "setSidebarWidth"; width: number }
  | { type: "toggleToolbar" }
  | { type: "setLayoutMode"; mode: "default" | "compact" | "wide" }
  | {
      type: "setScreenSize";
      size: "sm" | "md" | "lg" | "xl";
      isMobile: boolean;
    }
  | { type: "setAnimating"; isAnimating: boolean }
  | { type: "setActiveSidebarEditor"; editor: "stashed" | "workspace" | null }
  | { type: "clearActiveSidebarEditor" };

// Create a stable initial state object.
export const initialState: AppLayoutState = {
  isSidebarOpen: false,
  sidebarWidth: 280,
  sidebarCollapsedWidth: 60,
  isToolbarVisible: true,
  toolbarHeight: 48,
  layoutMode: "default",
  isMobile: false,
  screenSize: "lg",
  isAnimating: false,
  activeSidebarEditor: null,
  activeChatAppId: null,
};

// App layout store
export const appLayoutStore = createStore({
  context: initialState,
  on: {
    toggleSidebar: (context) => {
      console.log(
        `appLayoutStore: toggleSidebar received. Current isSidebarOpen: ${context.isSidebarOpen}`,
      );
      const newContext = {
        ...context,
        isSidebarOpen: !context.isSidebarOpen,
      };
      console.log(
        `appLayoutStore: New isSidebarOpen: ${newContext.isSidebarOpen}`,
      );
      return newContext;
    },

    openSidebar: (context) => ({
      ...context,
      isSidebarOpen: true,
    }),

    closeSidebar: (context) => ({
      ...context,
      isSidebarOpen: false,
      activeSidebarEditor: null,
    }),

    setSidebarWidth: (context, event: { width: number }) => ({
      ...context,
      sidebarWidth: event.width,
    }),

    toggleToolbar: (context) => ({
      ...context,
      isToolbarVisible: !context.isToolbarVisible,
    }),

    setLayoutMode: (
      context,
      event: { mode: "default" | "compact" | "wide" },
    ) => ({
      ...context,
      layoutMode: event.mode,
    }),

    setScreenSize: (
      context,
      event: { size: "sm" | "md" | "lg" | "xl"; isMobile: boolean },
    ) => ({
      ...context,
      screenSize: event.size,
      isMobile: event.isMobile,
      // Auto-close sidebar on mobile
      isSidebarOpen: event.isMobile ? false : context.isSidebarOpen,
    }),

    setAnimating: (context, event: { isAnimating: boolean }) => ({
      ...context,
      isAnimating: event.isAnimating,
    }),

    setActiveSidebarEditor: (
      context,
      event: { editor: "stashed" | "workspace" | null },
    ) => ({
      ...context,
      activeSidebarEditor: event.editor,
      isSidebarOpen: !!event.editor,
    }),
    clearActiveSidebarEditor: (context) => ({
      ...context,
      activeSidebarEditor: null,
    }),
  },
});

// Create and export the hooks using the new factory
const { useSelector, useDispatch } = createStoreHooks(
  appLayoutStore,
  initialState,
);

export const useAppLayoutStore = useSelector;
export const useAppLayoutActions = useDispatch;

// Hook for just sidebar state (most common use case)
export function useSidebarState() {
  const store = useSelector(appLayoutStore);
  const state = store.context || initialState;
  return {
    isOpen: state.isSidebarOpen,
    width: state.isSidebarOpen
      ? state.sidebarWidth
      : state.sidebarCollapsedWidth,
  };
}
