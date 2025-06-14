import { createStore } from "@xstate/store";
import { useStore } from "@xstate/store/react";

// App layout store state interface
interface AppLayoutState {
  readonly isSidebarOpen: boolean;
  readonly sidebarWidth: number;
  readonly sidebarCollapsedWidth: number;
  readonly isToolbarVisible: boolean;
  readonly toolbarHeight: number;
  readonly layoutMode: "default" | "compact" | "wide";
  readonly isMobile: boolean;
  readonly screenSize: "sm" | "md" | "lg" | "xl";
  readonly isAnimating: boolean;
  readonly activeSidebarEditor: string | null;
}

// Initial state factory
const createInitialState = (): AppLayoutState => ({
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
});

// App layout store
export const appLayoutStore = createStore({
  context: createInitialState(),
  on: {
    toggleSidebar: (context) => ({
      ...context,
      isSidebarOpen: !context.isSidebarOpen,
    }),

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

    setActiveSidebarEditor: (context, event: { editor: string | null }) => ({
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

// Hook for components to use layout store
export function useAppLayoutStore() {
  const store = useStore(appLayoutStore);
  return store.context || createInitialState();
}

// Hook for just sidebar state (most common use case)
export function useSidebarState() {
  const store = useStore(appLayoutStore);
  const state = store.context || createInitialState();
  return {
    isOpen: state.isSidebarOpen,
    width: state.isSidebarOpen
      ? state.sidebarWidth
      : state.sidebarCollapsedWidth,
  };
}
