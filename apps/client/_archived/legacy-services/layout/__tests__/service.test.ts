import { Effect, TestClock, TestContext } from "effect";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT_STATE,
  LAYOUT_CONSTANTS,
  LayoutService,
  LayoutStateError,
  LayoutValidationError,
} from "../index";

// Test helper to run effects with the LayoutService
const runWithLayoutService = <A, E>(
  effect: Effect.Effect<A, E, LayoutService>
) => Effect.runPromise(Effect.provide(effect, LayoutService.Default));

describe("LayoutService", () => {
  describe("State Management", () => {
    it("should initialize with default state", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.getState();
        })
      );

      expect(result).toEqual(DEFAULT_LAYOUT_STATE);
    });

    it("should update state and notify subscribers", async () => {
      const states: any[] = [];

      await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Subscribe to state changes
          const unsubscribe = yield* layoutService.subscribe((state) => {
            states.push(state);
          });

          // Toggle sidebar
          yield* layoutService.toggleSidebar();

          // Cleanup
          yield* unsubscribe();
        })
      );

      expect(states).toHaveLength(2); // Initial state + toggle
      expect(states[0]).toEqual(DEFAULT_LAYOUT_STATE);
      expect(states[1]).toEqual({
        ...DEFAULT_LAYOUT_STATE,
        isSidebarOpen: true,
      });
    });

    it("should handle multiple subscribers", async () => {
      const states1: any[] = [];
      const states2: any[] = [];

      await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Subscribe with two different listeners
          const unsubscribe1 = yield* layoutService.subscribe((state) => {
            states1.push(state);
          });
          const unsubscribe2 = yield* layoutService.subscribe((state) => {
            states2.push(state);
          });

          // Toggle sidebar
          yield* layoutService.toggleSidebar();

          // Cleanup
          yield* unsubscribe1();
          yield* unsubscribe2();
        })
      );

      expect(states1).toHaveLength(2);
      expect(states2).toHaveLength(2);
      expect(states1[1]).toEqual(states2[1]);
    });

    it("should unsubscribe properly", async () => {
      const states: any[] = [];

      await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Subscribe and immediately unsubscribe
          const unsubscribe = yield* layoutService.subscribe((state) => {
            states.push(state);
          });
          yield* unsubscribe();

          // Toggle sidebar - should not notify unsubscribed listener
          yield* layoutService.toggleSidebar();
        })
      );

      expect(states).toHaveLength(1); // Only initial state
    });
  });

  describe("Sidebar Management", () => {
    it("should toggle sidebar state", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Initially closed
          const initialState = yield* layoutService.getState();
          expect(initialState.isSidebarOpen).toBe(false);

          // Toggle to open
          const openState = yield* layoutService.toggleSidebar();
          expect(openState.isSidebarOpen).toBe(true);

          // Toggle to close
          const closedState = yield* layoutService.toggleSidebar();
          expect(closedState.isSidebarOpen).toBe(false);

          return closedState;
        })
      );

      expect(result.isSidebarOpen).toBe(false);
    });

    it("should open sidebar explicitly", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.openSidebar();
        })
      );

      expect(result.isSidebarOpen).toBe(true);
    });

    it("should close sidebar and clear active editor", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // First set an active editor
          yield* layoutService.setActiveSidebarEditor("workspace");

          // Then close sidebar
          return yield* layoutService.closeSidebar();
        })
      );

      expect(result.isSidebarOpen).toBe(false);
      expect(result.activeSidebarEditor).toBe(null);
    });

    it("should validate sidebar width", async () => {
      const validResult = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarWidth(300);
        })
      );

      expect(validResult.sidebarWidth).toBe(300);

      // Test invalid width
      const invalidEffect = runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarWidth(100); // Too small
        })
      );

      await expect(invalidEffect).rejects.toThrow();
    });

    it("should validate collapsed sidebar width", async () => {
      const validResult = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarCollapsedWidth(250);
        })
      );

      expect(validResult.sidebarCollapsedWidth).toBe(250);

      // Test invalid width
      const invalidEffect = runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarCollapsedWidth(600); // Too large
        })
      );

      await expect(invalidEffect).rejects.toThrow();
    });
  });

  describe("Toolbar Management", () => {
    it("should toggle toolbar visibility", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Initially visible
          const initialState = yield* layoutService.getState();
          expect(initialState.isToolbarVisible).toBe(true);

          // Toggle to hidden
          const hiddenState = yield* layoutService.toggleToolbar();
          expect(hiddenState.isToolbarVisible).toBe(false);

          // Toggle back to visible
          const visibleState = yield* layoutService.toggleToolbar();
          expect(visibleState.isToolbarVisible).toBe(true);

          return visibleState;
        })
      );

      expect(result.isToolbarVisible).toBe(true);
    });

    it("should set toolbar visibility explicitly", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          const hiddenState = yield* layoutService.setToolbarVisible(false);
          expect(hiddenState.isToolbarVisible).toBe(false);

          const visibleState = yield* layoutService.setToolbarVisible(true);
          expect(visibleState.isToolbarVisible).toBe(true);

          return visibleState;
        })
      );

      expect(result.isToolbarVisible).toBe(true);
    });

    it("should validate toolbar height", async () => {
      const validResult = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setToolbarHeight(60);
        })
      );

      expect(validResult.toolbarHeight).toBe(60);

      // Test invalid height
      const invalidEffect = runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setToolbarHeight(20); // Too small
        })
      );

      await expect(invalidEffect).rejects.toThrow();
    });
  });

  describe("Layout Management", () => {
    it("should set layout mode", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          const compactState = yield* layoutService.setLayoutMode("compact");
          expect(compactState.layoutMode).toBe("compact");

          const wideState = yield* layoutService.setLayoutMode("wide");
          expect(wideState.layoutMode).toBe("wide");

          return wideState;
        })
      );

      expect(result.layoutMode).toBe("wide");
    });

    it("should set screen size and handle mobile auto-close", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // First open sidebar
          yield* layoutService.openSidebar();

          // Then set to mobile - should auto-close sidebar
          const mobileState = yield* layoutService.setScreenSize("sm", true);
          expect(mobileState.screenSize).toBe("sm");
          expect(mobileState.isMobile).toBe(true);
          expect(mobileState.isSidebarOpen).toBe(false); // Auto-closed

          // Set back to desktop - sidebar should stay closed
          const desktopState = yield* layoutService.setScreenSize("lg", false);
          expect(desktopState.screenSize).toBe("lg");
          expect(desktopState.isMobile).toBe(false);
          expect(desktopState.isSidebarOpen).toBe(false);

          return desktopState;
        })
      );

      expect(result.isMobile).toBe(false);
      expect(result.screenSize).toBe("lg");
    });

    it("should set animation state", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          const animatingState = yield* layoutService.setAnimating(true);
          expect(animatingState.isAnimating).toBe(true);

          const notAnimatingState = yield* layoutService.setAnimating(false);
          expect(notAnimatingState.isAnimating).toBe(false);

          return notAnimatingState;
        })
      );

      expect(result.isAnimating).toBe(false);
    });
  });

  describe("Sidebar Editor Management", () => {
    it("should set active sidebar editor and open sidebar", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          const workspaceState = yield* layoutService.setActiveSidebarEditor(
            "workspace"
          );
          expect(workspaceState.activeSidebarEditor).toBe("workspace");
          expect(workspaceState.isSidebarOpen).toBe(true); // Auto-opened

          const stashedState = yield* layoutService.setActiveSidebarEditor(
            "stashed"
          );
          expect(stashedState.activeSidebarEditor).toBe("stashed");
          expect(stashedState.isSidebarOpen).toBe(true);

          return stashedState;
        })
      );

      expect(result.activeSidebarEditor).toBe("stashed");
      expect(result.isSidebarOpen).toBe(true);
    });

    it("should clear active sidebar editor", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // First set an editor
          yield* layoutService.setActiveSidebarEditor("workspace");

          // Then clear it
          const clearedState = yield* layoutService.clearActiveSidebarEditor();
          expect(clearedState.activeSidebarEditor).toBe(null);

          return clearedState;
        })
      );

      expect(result.activeSidebarEditor).toBe(null);
    });

    it("should handle null sidebar editor", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          const nullState = yield* layoutService.setActiveSidebarEditor(null);
          expect(nullState.activeSidebarEditor).toBe(null);
          expect(nullState.isSidebarOpen).toBe(false); // Should close when null

          return nullState;
        })
      );

      expect(result.activeSidebarEditor).toBe(null);
      expect(result.isSidebarOpen).toBe(false);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset to default state", async () => {
      const result = await runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;

          // Make some changes
          yield* layoutService.openSidebar();
          yield* layoutService.setLayoutMode("compact");
          yield* layoutService.setActiveSidebarEditor("workspace");

          // Verify changes were made
          const modifiedState = yield* layoutService.getState();
          expect(modifiedState.isSidebarOpen).toBe(true);
          expect(modifiedState.layoutMode).toBe("compact");
          expect(modifiedState.activeSidebarEditor).toBe("workspace");

          // Reset
          const resetState = yield* layoutService.reset();
          expect(resetState).toEqual(DEFAULT_LAYOUT_STATE);

          return resetState;
        })
      );

      expect(result).toEqual(DEFAULT_LAYOUT_STATE);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors for sidebar width", async () => {
      const effect = runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setSidebarWidth(50); // Too small
        })
      );

      await expect(effect).rejects.toThrow();
    });

    it("should handle validation errors for toolbar height", async () => {
      const effect = runWithLayoutService(
        Effect.gen(function* () {
          const layoutService = yield* LayoutService;
          return yield* layoutService.setToolbarHeight(100); // Too large
        })
      );

      await expect(effect).rejects.toThrow();
    });
  });

  describe("Constants and Defaults", () => {
    it("should use correct default values", () => {
      expect(DEFAULT_LAYOUT_STATE.sidebarWidth).toBe(
        LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_WIDTH
      );
      expect(DEFAULT_LAYOUT_STATE.sidebarCollapsedWidth).toBe(
        LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_COLLAPSED_WIDTH
      );
      expect(DEFAULT_LAYOUT_STATE.toolbarHeight).toBe(
        LAYOUT_CONSTANTS.DEFAULT_TOOLBAR_HEIGHT
      );
    });

    it("should have valid constant ranges", () => {
      expect(LAYOUT_CONSTANTS.MIN_SIDEBAR_WIDTH).toBeLessThan(
        LAYOUT_CONSTANTS.MAX_SIDEBAR_WIDTH
      );
      expect(LAYOUT_CONSTANTS.MIN_TOOLBAR_HEIGHT).toBeLessThan(
        LAYOUT_CONSTANTS.MAX_TOOLBAR_HEIGHT
      );
      expect(LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_WIDTH).toBeGreaterThanOrEqual(
        LAYOUT_CONSTANTS.MIN_SIDEBAR_WIDTH
      );
      expect(LAYOUT_CONSTANTS.DEFAULT_SIDEBAR_WIDTH).toBeLessThanOrEqual(
        LAYOUT_CONSTANTS.MAX_SIDEBAR_WIDTH
      );
    });
  });
});
