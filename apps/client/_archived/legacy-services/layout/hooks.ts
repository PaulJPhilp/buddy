import { Effect } from "effect";
import { useCallback, useEffect, useState } from "react";
import { LayoutService } from "./service";
import type { LayoutState } from "./types";
import { useServiceLayer } from "@/hooks/useServiceLayer";

/**
 * React hook to use the LayoutService in components
 */
export function useLayoutService() {
  const [state, setState] = useState<LayoutState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { runWithServices } = useServiceLayer();

  useEffect(() => {
    let cleanup: (() => Effect.Effect<void, never>) | null = null;

    const initializeService = async () => {
      try {
        console.log(
          "[useLayoutService] Getting LayoutService from shared layer"
        );

        // Get initial state
        const initialState = await runWithServices(
          Effect.gen(function* () {
            const layoutService = yield* LayoutService;
            return yield* layoutService.getState();
          })
        );

        setState(initialState);
        setIsLoading(false);

        // Subscribe to state changes
        const unsubscribe = await runWithServices(
          Effect.gen(function* () {
            const layoutService = yield* LayoutService;
            return yield* layoutService.subscribe((newState) => {
              console.log(
                "[useLayoutService] State update received:",
                newState.isSidebarOpen
              );
              setState(newState);
            });
          })
        );

        cleanup = unsubscribe;
      } catch (error) {
        console.error("Failed to initialize LayoutService:", error);
        setIsLoading(false);
      }
    };

    initializeService();

    return () => {
      if (cleanup) {
        Effect.runPromise(cleanup()).catch((error) => {
          console.error("Failed to cleanup LayoutService subscription:", error);
        });
      }
    };
  }, [runWithServices]);

  // Action creators
  const toggleSidebar = useCallback(() => {
    console.log("[useLayoutService] toggleSidebar called");
    runWithServices(
      Effect.gen(function* () {
        const layoutService = yield* LayoutService;
        console.log(
          "[useLayoutService] Got LayoutService, calling toggleSidebar"
        );
        return yield* layoutService.toggleSidebar();
      })
    )
      .then(() => {
        console.log("[useLayoutService] toggleSidebar completed");
      })
      .catch((error) => {
        console.error("Failed to toggle sidebar:", error);
      });
  }, [runWithServices]);

  const openSidebar = useCallback(() => {
    runWithServices(
      Effect.gen(function* () {
        const layoutService = yield* LayoutService;
        return yield* layoutService.openSidebar();
      })
    ).catch((error) => {
      console.error("Failed to open sidebar:", error);
    });
  }, [runWithServices]);

  const closeSidebar = useCallback(() => {
    runWithServices(
      Effect.gen(function* () {
        const layoutService = yield* LayoutService;
        return yield* layoutService.closeSidebar();
      })
    ).catch((error) => {
      console.error("Failed to close sidebar:", error);
    });
  }, [runWithServices]);

  const setSidebarWidth = useCallback(
    (width: number) => {
      runWithServices(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarWidth(width);
        })
      ).catch((error) => {
        console.error("Failed to set sidebar width:", error);
      });
    },
    [runWithServices]
  );

  const toggleToolbar = useCallback(() => {
    runWithServices(
      Effect.gen(function* () {
        const layoutService = yield* LayoutService;
        return yield* layoutService.toggleToolbar();
      })
    ).catch((error) => {
      console.error("Failed to toggle toolbar:", error);
    });
  }, [runWithServices]);

  const setLayoutMode = useCallback(
    (mode: "default" | "compact" | "wide") => {
      runWithServices(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setLayoutMode(mode);
        })
      ).catch((error) => {
        console.error("Failed to set layout mode:", error);
      });
    },
    [runWithServices]
  );

  const setScreenSize = useCallback(
    (size: "sm" | "md" | "lg" | "xl", isMobile: boolean) => {
      runWithServices(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setScreenSize(size, isMobile);
        })
      ).catch((error) => {
        console.error("Failed to set screen size:", error);
      });
    },
    [runWithServices]
  );

  const setActiveSidebarEditor = useCallback(
    (editor: "stashed" | "workspace" | null) => {
      runWithServices(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setActiveSidebarEditor(editor);
        })
      ).catch((error) => {
        console.error("Failed to set active sidebar editor:", error);
      });
    },
    [runWithServices]
  );

  return {
    // State
    state,
    isLoading,

    // Sidebar actions
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setSidebarWidth,

    // Toolbar actions
    toggleToolbar,

    // Layout actions
    setLayoutMode,
    setScreenSize,
    setActiveSidebarEditor,

    // Convenience getters
    isSidebarOpen: state?.isSidebarOpen ?? false,
    sidebarWidth: state?.sidebarWidth ?? 280,
    isToolbarVisible: state?.isToolbarVisible ?? true,
    layoutMode: state?.layoutMode ?? "default",
    screenSize: state?.screenSize ?? "lg",
    isMobile: state?.isMobile ?? false,
    activeSidebarEditor: state?.activeSidebarEditor ?? null,
  };
}

/**
 * Simplified hook for just sidebar state (most common use case)
 */
export function useSidebarState() {
  const {
    isSidebarOpen,
    sidebarWidth,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  } = useLayoutService();

  return {
    isOpen: isSidebarOpen,
    width: isSidebarOpen ? sidebarWidth : 60, // Use collapsed width when closed
    toggle: toggleSidebar,
    open: openSidebar,
    close: closeSidebar,
  };
}
