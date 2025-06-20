import { ToolbarConfig, isCommand } from "@/components/Toolbar/types";
import { appLayoutStore } from "@/stores/appLayoutStore";

import { useSelector } from "@xstate/store/react";
import { useMemo } from "react";

/**
 * Core dynamic toolbar logic without React hooks for testing
 */
export function createDynamicToolbarLogic(
  baseConfig: ToolbarConfig,
  storeState: { isSidebarOpen: boolean },
): ToolbarConfig {
  const updatedItems = baseConfig.items.map((item) => {
    if (!isCommand(item)) {
      return item;
    }

    // Update active states based on store state
    switch (item.id) {
      case "toggle-sidebar":
        return { ...item, active: storeState.isSidebarOpen };

      default:
        // Keep original item unchanged
        return item;
    }
  });

  return {
    ...baseConfig,
    items: updatedItems,
  };
}

/**
 * Hook that creates a dynamic toolbar configuration with active states
 * synchronized to store state
 */
export function useDynamicToolbar(baseConfig: ToolbarConfig): ToolbarConfig {
  // Use useSelector consistently for all stores to ensure reactivity
  const isSidebarOpen = useSelector(
    appLayoutStore,
    (state) => state.context.isSidebarOpen,
  );

  const dynamicConfig = useMemo((): ToolbarConfig => {
    return createDynamicToolbarLogic(baseConfig, { isSidebarOpen });
  }, [baseConfig, isSidebarOpen]);

  return dynamicConfig;
}
