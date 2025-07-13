import { Effect, Ref } from "effect";
import type { HeaderManagerApi } from "./api";
import {
  HeaderManagerConfigError,
  HeaderManagerError,
  HeaderManagerInitializationError,
  HeaderManagerOperationError,
  HeaderManagerStateError,
  HeaderManagerValidationError,
} from "./errors";
import type {
  ErrorInfo,
  HeaderActions,
  HeaderManagerConfig,
  HeaderManagerState,
  HeaderManagerStats,
  StatusInfo,
} from "./types";
import { HEADER_MANAGER_CONSTANTS } from "./types";

export class HeaderManager extends Effect.Service<HeaderManagerApi>()(
  "HeaderManager",
  {
    scoped: Effect.gen(function* () {
      // Initialize state
      const stateRef = yield* Ref.make<HeaderManagerState>({
        title: HEADER_MANAGER_CONSTANTS.DEFAULT_TITLE,
        isExpanded: false,
        isSelected: false,
        isStatusPanelOpen: false,
        errorInfo: null,
        statusInfo: null,
        isLoading: false,
        lastUpdated: new Date(),
      });

      const configRef = yield* Ref.make<HeaderManagerConfig | null>(null);
      const statsRef = yield* Ref.make<HeaderManagerStats>({
        totalInteractions: 0,
        lastInteractionAt: null,
        statusPanelToggleCount: 0,
        errorCount: 0,
        lastErrorAt: null,
      });

      const listenersRef = yield* Ref.make<
        Set<(state: HeaderManagerState) => void>
      >(new Set());

      // Helper functions
      const updateState = (
        updater: (state: HeaderManagerState) => HeaderManagerState
      ) =>
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, (state) => ({
            ...updater(state),
            lastUpdated: new Date(),
          }));
          yield* notifyListeners(newState);
          return newState;
        });

      const notifyListeners = (state: HeaderManagerState) =>
        Effect.gen(function* () {
          const listeners = yield* Ref.get(listenersRef);
          yield* Effect.forEach(Array.from(listeners), (listener) =>
            Effect.sync(() => listener(state))
          );
        });

      const validateTitle = (title: string) =>
        Effect.gen(function* () {
          if (!title || title.trim().length === 0) {
            yield* Effect.fail(
              new HeaderManagerValidationError({
                message: "Title cannot be empty",
                field: "title",
                value: title,
              })
            );
          }
          if (title.length > HEADER_MANAGER_CONSTANTS.MAX_TITLE_LENGTH) {
            yield* Effect.fail(
              new HeaderManagerValidationError({
                message: `Title cannot exceed ${HEADER_MANAGER_CONSTANTS.MAX_TITLE_LENGTH} characters`,
                field: "title",
                value: title,
              })
            );
          }
        });

      const recordInteraction = (action: string) =>
        Effect.gen(function* () {
          yield* Ref.update(statsRef, (stats) => ({
            ...stats,
            totalInteractions: stats.totalInteractions + 1,
            lastInteractionAt: new Date(),
          }));
        });

      // API Implementation
      const getState = () => Ref.get(stateRef);

      const setState = (updates: Partial<HeaderManagerState>) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, ...updates }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new HeaderManagerStateError({
                message: "Failed to update state",
                operation: "setState",
                cause,
              })
          )
        );

      const resetState = () =>
        Effect.gen(function* () {
          const config = yield* Ref.get(configRef);
          yield* Ref.set(stateRef, {
            title:
              config?.initialTitle || HEADER_MANAGER_CONSTANTS.DEFAULT_TITLE,
            isExpanded: false,
            isSelected: false,
            isStatusPanelOpen: false,
            errorInfo: null,
            statusInfo: null,
            isLoading: false,
            lastUpdated: new Date(),
          });
        });

      const initialize = (config: HeaderManagerConfig) =>
        Effect.gen(function* () {
          // Validate config
          if (!config.chatAppId) {
            yield* Effect.fail(
              new HeaderManagerConfigError({
                message: "Chat app ID is required",
                field: "chatAppId",
              })
            );
          }

          yield* validateTitle(config.initialTitle);

          // Store config
          yield* Ref.set(configRef, config);

          // Initialize state
          yield* Ref.set(stateRef, {
            title: config.initialTitle,
            isExpanded: false,
            isSelected: false,
            isStatusPanelOpen: false,
            errorInfo: null,
            statusInfo: null,
            isLoading: false,
            lastUpdated: new Date(),
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new HeaderManagerInitializationError({
                message: "Failed to initialize HeaderManager",
                chatAppId: config.chatAppId,
                cause,
              })
          )
        );

      const cleanup = () =>
        Effect.gen(function* () {
          yield* Ref.set(listenersRef, new Set());
          yield* Ref.set(configRef, null);
          yield* resetState();
        });

      // Title management
      const setTitle = (title: string) =>
        Effect.gen(function* () {
          yield* validateTitle(title);
          yield* updateState((state) => ({ ...state, title }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new HeaderManagerOperationError({
                message: "Failed to set title",
                operation: "setTitle",
                chatAppId: "unknown",
                cause,
              })
          )
        );

      const getTitle = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.title;
        });

      // Expansion state
      const setExpanded = (isExpanded: boolean) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, isExpanded }));
          yield* recordInteraction(isExpanded ? "expand" : "compact");
        });

      const toggleExpanded = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const newExpanded = !state.isExpanded;
          yield* setExpanded(newExpanded);
          return newExpanded;
        });

      const isExpanded = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.isExpanded;
        });

      // Selection state
      const setSelected = (isSelected: boolean) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, isSelected }));
        });

      const isSelected = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.isSelected;
        });

      // Status panel management
      const toggleStatusPanel = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const newOpen = !state.isStatusPanelOpen;
          yield* updateState((state) => ({
            ...state,
            isStatusPanelOpen: newOpen,
          }));
          yield* Ref.update(statsRef, (stats) => ({
            ...stats,
            statusPanelToggleCount: stats.statusPanelToggleCount + 1,
          }));
          return newOpen;
        });

      const setStatusPanelOpen = (isOpen: boolean) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({
            ...state,
            isStatusPanelOpen: isOpen,
          }));
        });

      const isStatusPanelOpen = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.isStatusPanelOpen;
        });

      // Error management
      const setError = (error: ErrorInfo) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, errorInfo: error }));
          yield* Ref.update(statsRef, (stats) => ({
            ...stats,
            errorCount: stats.errorCount + 1,
            lastErrorAt: new Date(),
          }));
        });

      const clearError = () =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, errorInfo: null }));
        });

      const getError = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.errorInfo;
        });

      // Status information
      const setStatusInfo = (status: StatusInfo) =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, statusInfo: status }));
        });

      const clearStatusInfo = () =>
        Effect.gen(function* () {
          yield* updateState((state) => ({ ...state, statusInfo: null }));
        });

      const getStatusInfo = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.statusInfo;
        });

      // Action management
      const getActions = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const config = yield* Ref.get(configRef);

          const actions: HeaderActions = {
            expand: {
              type: "expand",
              enabled: !state.isExpanded,
              visible: config?.showControls ?? true,
            },
            compact: {
              type: "compact",
              enabled: state.isExpanded,
              visible: config?.showControls ?? true,
            },
            stash: {
              type: "stash",
              enabled: true,
              visible: config?.showControls ?? true,
            },
            close: {
              type: "close",
              enabled: true,
              visible: config?.showControls ?? true,
            },
            settings: {
              type: "settings",
              enabled: true,
              visible: config?.showControls ?? true,
            },
            clear: {
              type: "clear",
              enabled: true,
              visible: config?.showControls ?? true,
            },
          };

          return actions;
        });

      const setActionEnabled = (
        action: keyof HeaderActions,
        enabled: boolean
      ) =>
        Effect.gen(function* () {
          // Actions are computed dynamically based on state
          // This is a no-op for now but could be extended
          yield* Effect.succeed(undefined);
        });

      const setActionVisible = (
        action: keyof HeaderActions,
        visible: boolean
      ) =>
        Effect.gen(function* () {
          // Actions are computed dynamically based on config
          // This is a no-op for now but could be extended
          yield* Effect.succeed(undefined);
        });

      // Event handling
      const onHeaderClick = () =>
        Effect.gen(function* () {
          yield* recordInteraction("header_click");
        });

      const onExpandClick = () =>
        Effect.gen(function* () {
          yield* setExpanded(true);
          yield* recordInteraction("expand_click");
        });

      const onCompactClick = () =>
        Effect.gen(function* () {
          yield* setExpanded(false);
          yield* recordInteraction("compact_click");
        });

      const onStashClick = () =>
        Effect.gen(function* () {
          yield* recordInteraction("stash_click");
        });

      const onCloseClick = () =>
        Effect.gen(function* () {
          yield* recordInteraction("close_click");
        });

      const onSettingsClick = () =>
        Effect.gen(function* () {
          yield* recordInteraction("settings_click");
        });

      const onClearClick = () =>
        Effect.gen(function* () {
          yield* recordInteraction("clear_click");
        });

      // Statistics
      const getStats = () => Ref.get(statsRef);

      // Subscription management
      const subscribe = (listener: (state: HeaderManagerState) => void) =>
        Effect.gen(function* () {
          const listeners = yield* Ref.get(listenersRef);
          const newListeners = new Set(listeners);
          newListeners.add(listener);
          yield* Ref.set(listenersRef, newListeners);

          // Return unsubscribe function
          return () => {
            Effect.runSync(
              Effect.gen(function* () {
                const currentListeners = yield* Ref.get(listenersRef);
                const updatedListeners = new Set(currentListeners);
                updatedListeners.delete(listener);
                yield* Ref.set(listenersRef, updatedListeners);
              })
            );
          };
        });

      return {
        getState,
        setState,
        resetState,
        initialize,
        cleanup,
        setTitle,
        getTitle,
        setExpanded,
        toggleExpanded,
        isExpanded,
        setSelected,
        isSelected,
        toggleStatusPanel,
        setStatusPanelOpen,
        isStatusPanelOpen,
        setError,
        clearError,
        getError,
        setStatusInfo,
        clearStatusInfo,
        getStatusInfo,
        getActions,
        setActionEnabled,
        setActionVisible,
        onHeaderClick,
        onExpandClick,
        onCompactClick,
        onStashClick,
        onCloseClick,
        onSettingsClick,
        onClearClick,
        getStats,
        recordInteraction,
        subscribe,
      } satisfies HeaderManagerApi;
    }),
    dependencies: [],
  }
) {}
