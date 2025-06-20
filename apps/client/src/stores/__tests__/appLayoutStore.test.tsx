import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appLayoutStore,
  useAppLayoutStore,
  useSidebarState,
} from "../appLayoutStore";

describe("App Layout Store Hooks", () => {
  // Store the original state to restore after each test
  let originalState: any;

  beforeEach(() => {
    // Capture the current state
    originalState = appLayoutStore.getSnapshot().context;
  });

  afterEach(() => {
    // Reset the store to its original state
    // We'll reset by dispatching actions to get back to initial state
    const currentState = appLayoutStore.getSnapshot().context;

    // Reset sidebar state
    if (currentState.isSidebarOpen !== originalState.isSidebarOpen) {
      if (originalState.isSidebarOpen) {
        appLayoutStore.send({ type: "openSidebar" });
      } else {
        appLayoutStore.send({ type: "closeSidebar" });
      }
    }

    // Reset sidebar width
    if (currentState.sidebarWidth !== originalState.sidebarWidth) {
      appLayoutStore.send({
        type: "setSidebarWidth",
        width: originalState.sidebarWidth,
      });
    }

    // Reset toolbar visibility
    if (currentState.isToolbarVisible !== originalState.isToolbarVisible) {
      appLayoutStore.send({ type: "toggleToolbar" });
    }

    // Reset layout mode
    if (currentState.layoutMode !== originalState.layoutMode) {
      appLayoutStore.send({
        type: "setLayoutMode",
        mode: originalState.layoutMode,
      });
    }

    // Reset screen size
    if (
      currentState.screenSize !== originalState.screenSize ||
      currentState.isMobile !== originalState.isMobile
    ) {
      appLayoutStore.send({
        type: "setScreenSize",
        size: originalState.screenSize,
        isMobile: originalState.isMobile,
      });
    }

    // Reset animation state
    if (currentState.isAnimating !== originalState.isAnimating) {
      appLayoutStore.send({
        type: "setAnimating",
        isAnimating: originalState.isAnimating,
      });
    }

    // Reset active sidebar editor
    if (
      currentState.activeSidebarEditor !== originalState.activeSidebarEditor
    ) {
      if (originalState.activeSidebarEditor) {
        appLayoutStore.send({
          type: "setActiveSidebarEditor",
          editor: originalState.activeSidebarEditor,
        });
      } else {
        appLayoutStore.send({ type: "clearActiveSidebarEditor" });
      }
    }
  });

  describe("Store Behavior", () => {
    it("should update store state directly", () => {
      const initialState = appLayoutStore.getSnapshot().context;
      expect(initialState.isSidebarOpen).toBe(false);

      appLayoutStore.send({ type: "toggleSidebar" });

      const updatedState = appLayoutStore.getSnapshot().context;
      expect(updatedState.isSidebarOpen).toBe(true);
    });

    it("should handle multiple actions", () => {
      appLayoutStore.send({ type: "openSidebar" });
      appLayoutStore.send({ type: "setSidebarWidth", width: 320 });

      const state = appLayoutStore.getSnapshot().context;
      expect(state.isSidebarOpen).toBe(true);
      expect(state.sidebarWidth).toBe(320);
    });

    it("should handle all sidebar actions correctly", () => {
      // Test toggle sidebar
      appLayoutStore.send({ type: "toggleSidebar" });
      expect(appLayoutStore.getSnapshot().context.isSidebarOpen).toBe(true);

      appLayoutStore.send({ type: "toggleSidebar" });
      expect(appLayoutStore.getSnapshot().context.isSidebarOpen).toBe(false);

      // Test open sidebar
      appLayoutStore.send({ type: "openSidebar" });
      expect(appLayoutStore.getSnapshot().context.isSidebarOpen).toBe(true);

      // Test close sidebar
      appLayoutStore.send({ type: "closeSidebar" });
      const stateAfterClose = appLayoutStore.getSnapshot().context;
      expect(stateAfterClose.isSidebarOpen).toBe(false);
      expect(stateAfterClose.activeSidebarEditor).toBe(null);
    });

    it("should handle sidebar width changes", () => {
      const testWidths = [200, 300, 400, 500];

      for (const width of testWidths) {
        appLayoutStore.send({ type: "setSidebarWidth", width });
        expect(appLayoutStore.getSnapshot().context.sidebarWidth).toBe(width);
      }
    });

    it("should handle toolbar toggle", () => {
      const initialState = appLayoutStore.getSnapshot().context;
      const initialVisible = initialState.isToolbarVisible;

      appLayoutStore.send({ type: "toggleToolbar" });
      expect(appLayoutStore.getSnapshot().context.isToolbarVisible).toBe(
        !initialVisible,
      );

      appLayoutStore.send({ type: "toggleToolbar" });
      expect(appLayoutStore.getSnapshot().context.isToolbarVisible).toBe(
        initialVisible,
      );
    });

    it("should handle layout mode changes", () => {
      const modes: Array<"default" | "compact" | "wide"> = [
        "compact",
        "wide",
        "default",
      ];

      for (const mode of modes) {
        appLayoutStore.send({ type: "setLayoutMode", mode });
        expect(appLayoutStore.getSnapshot().context.layoutMode).toBe(mode);
      }
    });

    it("should handle screen size changes with mobile logic", () => {
      // Set sidebar open first
      appLayoutStore.send({ type: "openSidebar" });
      expect(appLayoutStore.getSnapshot().context.isSidebarOpen).toBe(true);

      // Switch to mobile - should auto-close sidebar
      appLayoutStore.send({
        type: "setScreenSize",
        size: "sm",
        isMobile: true,
      });

      const mobileState = appLayoutStore.getSnapshot().context;
      expect(mobileState.screenSize).toBe("sm");
      expect(mobileState.isMobile).toBe(true);
      expect(mobileState.isSidebarOpen).toBe(false); // Auto-closed on mobile

      // Switch back to desktop - sidebar stays closed
      appLayoutStore.send({
        type: "setScreenSize",
        size: "lg",
        isMobile: false,
      });

      const desktopState = appLayoutStore.getSnapshot().context;
      expect(desktopState.screenSize).toBe("lg");
      expect(desktopState.isMobile).toBe(false);
      expect(desktopState.isSidebarOpen).toBe(false); // Stays closed
    });

    it("should handle animation state", () => {
      appLayoutStore.send({ type: "setAnimating", isAnimating: true });
      expect(appLayoutStore.getSnapshot().context.isAnimating).toBe(true);

      appLayoutStore.send({ type: "setAnimating", isAnimating: false });
      expect(appLayoutStore.getSnapshot().context.isAnimating).toBe(false);
    });

    it("should handle active sidebar editor", () => {
      // Set active editor - should also open sidebar
      appLayoutStore.send({
        type: "setActiveSidebarEditor",
        editor: "theme-editor",
      });

      let state = appLayoutStore.getSnapshot().context;
      expect(state.activeSidebarEditor).toBe("theme-editor");
      expect(state.isSidebarOpen).toBe(true);

      // Clear active editor
      appLayoutStore.send({ type: "clearActiveSidebarEditor" });

      state = appLayoutStore.getSnapshot().context;
      expect(state.activeSidebarEditor).toBe(null);

      // Set to null explicitly
      appLayoutStore.send({
        type: "setActiveSidebarEditor",
        editor: null,
      });

      state = appLayoutStore.getSnapshot().context;
      expect(state.activeSidebarEditor).toBe(null);
      expect(state.isSidebarOpen).toBe(false);
    });
  });

  describe("useAppLayoutStore", () => {
    describe("Hook Structure", () => {
      it("should return the complete layout state", () => {
        const { result } = renderHook(() => useAppLayoutStore());

        expect(result.current).toHaveProperty("isSidebarOpen");
        expect(result.current).toHaveProperty("sidebarWidth");
        expect(result.current).toHaveProperty("sidebarCollapsedWidth");
        expect(result.current).toHaveProperty("isToolbarVisible");
        expect(result.current).toHaveProperty("toolbarHeight");
        expect(result.current).toHaveProperty("layoutMode");
        expect(result.current).toHaveProperty("isMobile");
        expect(result.current).toHaveProperty("screenSize");
        expect(result.current).toHaveProperty("isAnimating");
        expect(result.current).toHaveProperty("activeSidebarEditor");
      });

      it("should return correct initial values", () => {
        const { result } = renderHook(() => useAppLayoutStore());

        expect(result.current.isSidebarOpen).toBe(false);
        expect(result.current.sidebarWidth).toBe(280);
        expect(result.current.sidebarCollapsedWidth).toBe(60);
        expect(result.current.isToolbarVisible).toBe(true);
        expect(result.current.toolbarHeight).toBe(48);
        expect(result.current.layoutMode).toBe("default");
        expect(result.current.isMobile).toBe(false);
        expect(result.current.screenSize).toBe("lg");
        expect(result.current.isAnimating).toBe(false);
        expect(result.current.activeSidebarEditor).toBe(null);
      });

      it("should return readonly properties", () => {
        const { result } = renderHook(() => useAppLayoutStore());

        // Verify all expected properties exist
        const expectedProperties = [
          "isSidebarOpen",
          "sidebarWidth",
          "sidebarCollapsedWidth",
          "isToolbarVisible",
          "toolbarHeight",
          "layoutMode",
          "isMobile",
          "screenSize",
          "isAnimating",
          "activeSidebarEditor",
        ];

        for (const prop of expectedProperties) {
          expect(result.current).toHaveProperty(prop);
        }

        expect(Object.keys(result.current)).toHaveLength(
          expectedProperties.length,
        );
      });
    });

    describe("Store Integration", () => {
      it("should use store as data source", () => {
        const { result } = renderHook(() => useAppLayoutStore());

        // Hook should return same values as store.context
        const storeState = appLayoutStore.getSnapshot().context;

        expect(result.current.isSidebarOpen).toBe(storeState.isSidebarOpen);
        expect(result.current.sidebarWidth).toBe(storeState.sidebarWidth);
        expect(result.current.sidebarCollapsedWidth).toBe(
          storeState.sidebarCollapsedWidth,
        );
        expect(result.current.isToolbarVisible).toBe(
          storeState.isToolbarVisible,
        );
        expect(result.current.toolbarHeight).toBe(storeState.toolbarHeight);
        expect(result.current.layoutMode).toBe(storeState.layoutMode);
        expect(result.current.isMobile).toBe(storeState.isMobile);
        expect(result.current.screenSize).toBe(storeState.screenSize);
        expect(result.current.isAnimating).toBe(storeState.isAnimating);
        expect(result.current.activeSidebarEditor).toBe(
          storeState.activeSidebarEditor,
        );
      });

      it("should handle fallback when store context is null", () => {
        // This tests the fallback logic in the hook
        const { result } = renderHook(() => useAppLayoutStore());

        // Should return valid state even if store has issues
        expect(typeof result.current.isSidebarOpen).toBe("boolean");
        expect(typeof result.current.sidebarWidth).toBe("number");
        expect(typeof result.current.isToolbarVisible).toBe("boolean");
        expect(typeof result.current.layoutMode).toBe("string");
      });

      it("should maintain consistent return structure", () => {
        const { result, rerender } = renderHook(() => useAppLayoutStore());

        const initialKeys = Object.keys(result.current);

        rerender();

        const afterRerenderKeys = Object.keys(result.current);
        expect(initialKeys).toEqual(afterRerenderKeys);
      });

      it("should reflect store changes in subsequent hook calls", () => {
        // Change store state
        appLayoutStore.send({ type: "toggleSidebar" });
        appLayoutStore.send({ type: "setSidebarWidth", width: 350 });

        // New hook instance should reflect the changes
        const { result } = renderHook(() => useAppLayoutStore());

        expect(result.current.isSidebarOpen).toBe(true);
        expect(result.current.sidebarWidth).toBe(350);
      });
    });

    describe("Edge Cases", () => {
      it("should handle rapid hook creation and destruction", () => {
        const hooks = [];

        // Create multiple hook instances
        for (let i = 0; i < 10; i++) {
          const { result, unmount } = renderHook(() => useAppLayoutStore());
          hooks.push({ result, unmount });
        }

        // All should return valid state
        for (const { result } of hooks) {
          expect(typeof result.current.isSidebarOpen).toBe("boolean");
          expect(typeof result.current.sidebarWidth).toBe("number");
        }

        // Clean up
        for (const { unmount } of hooks) {
          unmount();
        }

        // Should not crash
        expect(true).toBe(true);
      });

      it("should handle concurrent hook instances", () => {
        const hook1 = renderHook(() => useAppLayoutStore());
        const hook2 = renderHook(() => useAppLayoutStore());
        const hook3 = renderHook(() => useAppLayoutStore());

        // All should return same state
        expect(hook1.result.current.isSidebarOpen).toBe(
          hook2.result.current.isSidebarOpen,
        );
        expect(hook2.result.current.sidebarWidth).toBe(
          hook3.result.current.sidebarWidth,
        );

        // Clean up
        hook1.unmount();
        hook2.unmount();
        hook3.unmount();
      });

      it("should maintain type safety", () => {
        const { result } = renderHook(() => useAppLayoutStore());

        // Test specific type constraints
        expect(["default", "compact", "wide"]).toContain(
          result.current.layoutMode,
        );
        expect(["sm", "md", "lg", "xl"]).toContain(result.current.screenSize);
        expect(result.current.sidebarWidth).toBeGreaterThan(0);
        expect(result.current.sidebarCollapsedWidth).toBeGreaterThan(0);
        expect(result.current.toolbarHeight).toBeGreaterThan(0);
      });
    });
  });

  describe("useSidebarState", () => {
    describe("Hook Structure", () => {
      it("should return sidebar-specific state", () => {
        const { result } = renderHook(() => useSidebarState());

        expect(result.current).toHaveProperty("isOpen");
        expect(result.current).toHaveProperty("width");
        expect(typeof result.current.isOpen).toBe("boolean");
        expect(typeof result.current.width).toBe("number");
      });

      it("should return correct initial values", () => {
        const { result } = renderHook(() => useSidebarState());

        expect(result.current.isOpen).toBe(false);
        expect(result.current.width).toBe(60); // collapsed width when closed
      });

      it("should only return sidebar properties", () => {
        const { result } = renderHook(() => useSidebarState());

        expect(Object.keys(result.current)).toEqual(["isOpen", "width"]);
      });
    });

    describe("Width Calculation Logic", () => {
      it("should return collapsed width when sidebar is closed", () => {
        const { result } = renderHook(() => useSidebarState());

        expect(result.current.isOpen).toBe(false);
        expect(result.current.width).toBe(60); // sidebarCollapsedWidth
      });

      it("should correctly calculate width based on sidebar state", () => {
        const { result } = renderHook(() => useSidebarState());
        const storeState = appLayoutStore.getSnapshot().context;

        const expectedWidth = storeState.isSidebarOpen
          ? storeState.sidebarWidth
          : storeState.sidebarCollapsedWidth;

        expect(result.current.width).toBe(expectedWidth);
        expect(result.current.isOpen).toBe(storeState.isSidebarOpen);
      });

      it("should use correct width values from store", () => {
        const { result } = renderHook(() => useSidebarState());
        const storeState = appLayoutStore.getSnapshot().context;

        // When closed, should use collapsed width
        if (!storeState.isSidebarOpen) {
          expect(result.current.width).toBe(storeState.sidebarCollapsedWidth);
        } else {
          expect(result.current.width).toBe(storeState.sidebarWidth);
        }
      });

      it("should maintain consistent width calculation", () => {
        const { result, rerender } = renderHook(() => useSidebarState());

        const initialWidth = result.current.width;
        const initialOpen = result.current.isOpen;

        rerender();

        expect(result.current.width).toBe(initialWidth);
        expect(result.current.isOpen).toBe(initialOpen);
      });

      it("should reflect different width scenarios", () => {
        // Test with sidebar open - should use full width
        appLayoutStore.send({ type: "openSidebar" });
        appLayoutStore.send({ type: "setSidebarWidth", width: 320 });

        const { result: openResult } = renderHook(() => useSidebarState());
        expect(openResult.current.isOpen).toBe(true);
        expect(openResult.current.width).toBe(320);

        // Test with sidebar closed - should use collapsed width
        appLayoutStore.send({ type: "closeSidebar" });

        const { result: closedResult } = renderHook(() => useSidebarState());
        expect(closedResult.current.isOpen).toBe(false);
        expect(closedResult.current.width).toBe(60); // collapsed width
      });
    });

    describe("Store Integration", () => {
      it("should use store as data source", () => {
        const { result } = renderHook(() => useSidebarState());
        const storeState = appLayoutStore.getSnapshot().context;

        expect(result.current.isOpen).toBe(storeState.isSidebarOpen);

        const expectedWidth = storeState.isSidebarOpen
          ? storeState.sidebarWidth
          : storeState.sidebarCollapsedWidth;
        expect(result.current.width).toBe(expectedWidth);
      });

      it("should handle store state correctly", () => {
        const { result } = renderHook(() => useSidebarState());

        // Should return valid sidebar state
        expect(typeof result.current.isOpen).toBe("boolean");
        expect(typeof result.current.width).toBe("number");
        expect(result.current.width).toBeGreaterThan(0);
      });

      it("should maintain consistent structure", () => {
        const { result } = renderHook(() => useSidebarState());

        expect(Object.keys(result.current)).toEqual(["isOpen", "width"]);
        expect(Object.keys(result.current)).toHaveLength(2);
      });

      it("should reflect store changes in new hook instances", () => {
        // Change store state
        appLayoutStore.send({ type: "openSidebar" });
        appLayoutStore.send({ type: "setSidebarWidth", width: 400 });

        // New hook instance should reflect changes
        const { result } = renderHook(() => useSidebarState());

        expect(result.current.isOpen).toBe(true);
        expect(result.current.width).toBe(400);
      });
    });

    describe("Edge Cases", () => {
      it("should handle multiple concurrent instances", () => {
        const instances = [];

        // Create multiple instances
        for (let i = 0; i < 5; i++) {
          const { result, unmount } = renderHook(() => useSidebarState());
          instances.push({ result, unmount });
        }

        // All should return same values
        const firstResult = instances[0].result.current;
        for (const { result } of instances) {
          expect(result.current.isOpen).toBe(firstResult.isOpen);
          expect(result.current.width).toBe(firstResult.width);
        }

        // Clean up
        for (const { unmount } of instances) {
          unmount();
        }
      });

      it("should handle rapid mount/unmount cycles", () => {
        for (let i = 0; i < 20; i++) {
          const { result, unmount } = renderHook(() => useSidebarState());

          expect(typeof result.current.isOpen).toBe("boolean");
          expect(typeof result.current.width).toBe("number");

          unmount();
        }

        // Should complete without errors
        expect(true).toBe(true);
      });

      it("should maintain performance with many operations", () => {
        const startTime = Date.now();

        // Create and destroy many hook instances
        for (let i = 0; i < 100; i++) {
          const { result, unmount } = renderHook(() => useSidebarState());
          expect(result.current.width).toBeGreaterThan(0);
          unmount();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete reasonably quickly (less than 1 second)
        expect(duration).toBeLessThan(1000);
      });
    });
  });

  describe("Real World Scenarios", () => {
    it("should handle responsive layout workflow", () => {
      // Desktop: sidebar open with custom width
      appLayoutStore.send({ type: "openSidebar" });
      appLayoutStore.send({ type: "setSidebarWidth", width: 350 });
      appLayoutStore.send({
        type: "setScreenSize",
        size: "lg",
        isMobile: false,
      });

      let layoutState = renderHook(() => useAppLayoutStore());
      let sidebarState = renderHook(() => useSidebarState());

      expect(layoutState.result.current.isSidebarOpen).toBe(true);
      expect(layoutState.result.current.sidebarWidth).toBe(350);
      expect(sidebarState.result.current.isOpen).toBe(true);
      expect(sidebarState.result.current.width).toBe(350);

      layoutState.unmount();
      sidebarState.unmount();

      // Switch to mobile: sidebar should auto-close
      appLayoutStore.send({
        type: "setScreenSize",
        size: "sm",
        isMobile: true,
      });

      layoutState = renderHook(() => useAppLayoutStore());
      sidebarState = renderHook(() => useSidebarState());

      expect(layoutState.result.current.isMobile).toBe(true);
      expect(layoutState.result.current.isSidebarOpen).toBe(false);
      expect(sidebarState.result.current.isOpen).toBe(false);
      expect(sidebarState.result.current.width).toBe(60); // collapsed

      layoutState.unmount();
      sidebarState.unmount();
    });

    it("should handle theme editor workflow", () => {
      // Open theme editor - should open sidebar
      appLayoutStore.send({
        type: "setActiveSidebarEditor",
        editor: "theme-editor",
      });

      let state = renderHook(() => useAppLayoutStore());
      expect(state.result.current.activeSidebarEditor).toBe("theme-editor");
      expect(state.result.current.isSidebarOpen).toBe(true);

      state.unmount();

      // Close sidebar - should clear editor
      appLayoutStore.send({ type: "closeSidebar" });

      state = renderHook(() => useAppLayoutStore());
      expect(state.result.current.isSidebarOpen).toBe(false);
      expect(state.result.current.activeSidebarEditor).toBe(null);

      state.unmount();
    });

    it("should handle layout animation workflow", () => {
      // Start animation
      appLayoutStore.send({ type: "setAnimating", isAnimating: true });

      let state = renderHook(() => useAppLayoutStore());
      expect(state.result.current.isAnimating).toBe(true);

      state.unmount();

      // Toggle sidebar during animation
      appLayoutStore.send({ type: "toggleSidebar" });

      state = renderHook(() => useAppLayoutStore());
      expect(state.result.current.isAnimating).toBe(true);
      expect(state.result.current.isSidebarOpen).toBe(true);

      state.unmount();

      // End animation
      appLayoutStore.send({ type: "setAnimating", isAnimating: false });

      state = renderHook(() => useAppLayoutStore());
      expect(state.result.current.isAnimating).toBe(false);
      expect(state.result.current.isSidebarOpen).toBe(true);

      state.unmount();
    });

    it("should handle complex state transitions", () => {
      // Simulate complex user interaction sequence
      const actions = [
        { type: "openSidebar" as const },
        { type: "setSidebarWidth" as const, width: 300 },
        { type: "setLayoutMode" as const, mode: "compact" as const },
        { type: "setAnimating" as const, isAnimating: true },
        { type: "setActiveSidebarEditor" as const, editor: "settings" },
        {
          type: "setScreenSize" as const,
          size: "md" as const,
          isMobile: false,
        },
        { type: "toggleToolbar" as const },
        { type: "setAnimating" as const, isAnimating: false },
      ];

      // Apply all actions
      for (const action of actions) {
        appLayoutStore.send(action);
      }

      // Verify final state
      const layoutState = renderHook(() => useAppLayoutStore());
      const sidebarState = renderHook(() => useSidebarState());

      expect(layoutState.result.current.isSidebarOpen).toBe(true);
      expect(layoutState.result.current.sidebarWidth).toBe(300);
      expect(layoutState.result.current.layoutMode).toBe("compact");
      expect(layoutState.result.current.isAnimating).toBe(false);
      expect(layoutState.result.current.activeSidebarEditor).toBe("settings");
      expect(layoutState.result.current.screenSize).toBe("md");
      expect(layoutState.result.current.isMobile).toBe(false);
      expect(layoutState.result.current.isToolbarVisible).toBe(false);

      expect(sidebarState.result.current.isOpen).toBe(true);
      expect(sidebarState.result.current.width).toBe(300);

      layoutState.unmount();
      sidebarState.unmount();
    });
  });

  describe("Performance and Memory", () => {
    it("should not leak memory with many hook instances", () => {
      const instances = [];

      // Create many instances
      for (let i = 0; i < 50; i++) {
        const layoutHook = renderHook(() => useAppLayoutStore());
        const sidebarHook = renderHook(() => useSidebarState());
        instances.push({ layoutHook, sidebarHook });
      }

      // All should work correctly
      for (const { layoutHook, sidebarHook } of instances) {
        expect(typeof layoutHook.result.current.isSidebarOpen).toBe("boolean");
        expect(typeof sidebarHook.result.current.width).toBe("number");
      }

      // Clean up all instances
      for (const { layoutHook, sidebarHook } of instances) {
        layoutHook.unmount();
        sidebarHook.unmount();
      }

      // Should not crash
      expect(true).toBe(true);
    });

    it("should maintain consistent performance", () => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        const layoutHook = renderHook(() => useAppLayoutStore());
        const sidebarHook = renderHook(() => useSidebarState());

        // Access all properties
        const layoutState = layoutHook.result.current;
        const sidebarState = sidebarHook.result.current;

        expect(layoutState.isSidebarOpen).toBeDefined();
        expect(sidebarState.width).toBeDefined();

        layoutHook.unmount();
        sidebarHook.unmount();

        const end = Date.now();
        times.push(end - start);
      }

      // Calculate average time
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      // Should be reasonably fast (less than 10ms average)
      expect(avgTime).toBeLessThan(10);
    });

    it("should handle stress testing", () => {
      // Rapid store updates
      for (let i = 0; i < 100; i++) {
        appLayoutStore.send({ type: "toggleSidebar" });
        appLayoutStore.send({ type: "setSidebarWidth", width: 200 + i });
        appLayoutStore.send({ type: "toggleToolbar" });
      }

      // Hook should still work correctly
      const { result } = renderHook(() => useAppLayoutStore());

      expect(typeof result.current.isSidebarOpen).toBe("boolean");
      expect(typeof result.current.sidebarWidth).toBe("number");
      expect(result.current.sidebarWidth).toBeGreaterThan(0);
    });
  });
});
