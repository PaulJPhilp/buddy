import { Effect, Ref } from "effect";
import type { LayoutServiceApi } from "./api";
import {
  LayoutStateError,
  LayoutSubscriptionError,
  LayoutValidationError,
} from "./errors";
import type {
  LayoutConfig,
  LayoutMode,
  LayoutState,
  ScreenSize,
  SidebarEditor,
} from "./types";
import { DEFAULT_LAYOUT_STATE, LAYOUT_CONSTANTS } from "./types";

export class LayoutService extends Effect.Service<LayoutServiceApi>()(
  "LayoutService",
  {
    scoped: Effect.gen(function* () {
      // Initialize state management
      const stateRef = yield* Ref.make<LayoutState>(DEFAULT_LAYOUT_STATE);
      const listenersRef = yield* Ref.make<Set<(state: LayoutState) => void>>(
        new Set()
      );

      // Helper function to update state and notify listeners
      const updateState = (updater: (state: LayoutState) => LayoutState) =>
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, updater);
          const listeners = yield* Ref.get(listenersRef);

          // Notify all listeners
          console.log("[LayoutService] Notifying", listeners.size, "listeners with state:", newState.isSidebarOpen);
          yield* Effect.forEach(Array.from(listeners), (listener) =>
            Effect.sync(() => {
              console.log("[LayoutService] Calling listener with state:", newState.isSidebarOpen);
              listener(newState);
            })
          );

          return newState;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new LayoutStateError({
                message: "Failed to update layout state",
                cause,
              })
          )
        );

      // Validation helpers
      const validateSidebarWidth = (width: number) =>
        Effect.gen(function* () {
          if (
            width < LAYOUT_CONSTANTS.MIN_SIDEBAR_WIDTH ||
            width > LAYOUT_CONSTANTS.MAX_SIDEBAR_WIDTH
          ) {
            return yield* Effect.fail(
              new LayoutValidationError({
                message: `Sidebar width must be between ${LAYOUT_CONSTANTS.MIN_SIDEBAR_WIDTH} and ${LAYOUT_CONSTANTS.MAX_SIDEBAR_WIDTH}`,
                field: "sidebarWidth",
              })
            );
          }
          return width;
        });

      const validateToolbarHeight = (height: number) =>
        Effect.gen(function* () {
          if (
            height < LAYOUT_CONSTANTS.MIN_TOOLBAR_HEIGHT ||
            height > LAYOUT_CONSTANTS.MAX_TOOLBAR_HEIGHT
          ) {
            return yield* Effect.fail(
              new LayoutValidationError({
                message: `Toolbar height must be between ${LAYOUT_CONSTANTS.MIN_TOOLBAR_HEIGHT} and ${LAYOUT_CONSTANTS.MAX_TOOLBAR_HEIGHT}`,
                field: "toolbarHeight",
              })
            );
          }
          return height;
        });

      // State access
      const getState = () =>
        Ref.get(stateRef).pipe(
          Effect.mapError(
            (cause) =>
              new LayoutStateError({
                message: "Failed to get layout state",
                cause,
              })
          )
        );

      const subscribe = (listener: (state: LayoutState) => void) =>
        Effect.gen(function* () {
          yield* Ref.update(
            listenersRef,
            (listeners) => new Set([...listeners, listener])
          );

          // Immediately notify with current state
          const currentState = yield* getState();
          yield* Effect.sync(() => listener(currentState));

          // Return unsubscribe function
          const unsubscribe = () =>
            Effect.gen(function* () {
              yield* Ref.update(listenersRef, (listeners) => {
                const newListeners = new Set(listeners);
                newListeners.delete(listener);
                return newListeners;
              });
            });

          return unsubscribe;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new LayoutSubscriptionError({
                message: "Failed to subscribe to layout state",
                cause,
              })
          )
        );

      // Sidebar management
      const toggleSidebar = () =>
        Effect.gen(function* () {
          console.log("[LayoutService] toggleSidebar called");
          const currentState = yield* getState();
          console.log(
            "[LayoutService] Current isSidebarOpen:",
            currentState.isSidebarOpen
          );
          const newState = yield* updateState((state) => ({
            ...state,
            isSidebarOpen: !state.isSidebarOpen,
          }));
          console.log(
            "[LayoutService] New isSidebarOpen:",
            newState.isSidebarOpen
          );
          return newState;
        });

      const openSidebar = () =>
        updateState((state) => ({
          ...state,
          isSidebarOpen: true,
        }));

      const closeSidebar = () =>
        updateState((state) => ({
          ...state,
          isSidebarOpen: false,
          activeSidebarEditor: null,
        }));

      const setSidebarWidth = (width: number) =>
        Effect.gen(function* () {
          const validatedWidth = yield* validateSidebarWidth(width);
          return yield* updateState((state) => ({
            ...state,
            sidebarWidth: validatedWidth,
          }));
        });

      const setSidebarCollapsedWidth = (width: number) =>
        Effect.gen(function* () {
          const validatedWidth = yield* validateSidebarWidth(width);
          return yield* updateState((state) => ({
            ...state,
            sidebarCollapsedWidth: validatedWidth,
          }));
        });

      // Toolbar management
      const toggleToolbar = () =>
        updateState((state) => ({
          ...state,
          isToolbarVisible: !state.isToolbarVisible,
        }));

      const setToolbarVisible = (visible: boolean) =>
        updateState((state) => ({
          ...state,
          isToolbarVisible: visible,
        }));

      const setToolbarHeight = (height: number) =>
        Effect.gen(function* () {
          const validatedHeight = yield* validateToolbarHeight(height);
          return yield* updateState((state) => ({
            ...state,
            toolbarHeight: validatedHeight,
          }));
        });

      // Layout management
      const setLayoutMode = (mode: LayoutMode) =>
        updateState((state) => ({
          ...state,
          layoutMode: mode,
        }));

      const setScreenSize = (size: ScreenSize, isMobile: boolean) =>
        updateState((state) => ({
          ...state,
          screenSize: size,
          isMobile,
          // Auto-close sidebar on mobile if configured
          isSidebarOpen: isMobile ? false : state.isSidebarOpen,
        }));

      const setAnimating = (isAnimating: boolean) =>
        updateState((state) => ({
          ...state,
          isAnimating,
        }));

      // Sidebar editor management
      const setActiveSidebarEditor = (editor: SidebarEditor) =>
        updateState((state) => ({
          ...state,
          activeSidebarEditor: editor,
          isSidebarOpen: !!editor,
        }));

      const clearActiveSidebarEditor = () =>
        updateState((state) => ({
          ...state,
          activeSidebarEditor: null,
        }));

      // Utility
      const reset = () => updateState(() => DEFAULT_LAYOUT_STATE);

      return {
        getState,
        subscribe,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setSidebarWidth,
        setSidebarCollapsedWidth,
        toggleToolbar,
        setToolbarVisible,
        setToolbarHeight,
        setLayoutMode,
        setScreenSize,
        setAnimating,
        setActiveSidebarEditor,
        clearActiveSidebarEditor,
        reset,
      } satisfies LayoutServiceApi;
    }),
    dependencies: [],
  }
) {}
