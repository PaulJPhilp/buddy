import { Effect } from "effect";
import type {
  HeaderManagerError,
  HeaderManagerInitializationError,
  HeaderManagerOperationError,
  HeaderManagerStateError,
  HeaderManagerValidationError,
} from "./errors";

type HeaderManagerErrors =
  | HeaderManagerError
  | HeaderManagerInitializationError
  | HeaderManagerOperationError
  | HeaderManagerStateError
  | HeaderManagerValidationError;
import type {
  ErrorInfo,
  HeaderActions,
  HeaderManagerConfig,
  HeaderManagerState,
  HeaderManagerStats,
  StatusInfo,
} from "./types";

export interface HeaderManagerApi {
  // Core state management
  readonly getState: () => Effect.Effect<
    HeaderManagerState,
    HeaderManagerErrors
  >;
  readonly setState: (
    updates: Partial<HeaderManagerState>
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly resetState: () => Effect.Effect<void, HeaderManagerErrors>;

  // Initialization and lifecycle
  readonly initialize: (
    config: HeaderManagerConfig
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly cleanup: () => Effect.Effect<void, HeaderManagerErrors>;

  // Title management
  readonly setTitle: (
    title: string
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly getTitle: () => Effect.Effect<string, HeaderManagerErrors>;

  // Expansion state
  readonly setExpanded: (
    isExpanded: boolean
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly toggleExpanded: () => Effect.Effect<boolean, HeaderManagerErrors>;
  readonly isExpanded: () => Effect.Effect<boolean, HeaderManagerErrors>;

  // Selection state
  readonly setSelected: (
    isSelected: boolean
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly isSelected: () => Effect.Effect<boolean, HeaderManagerErrors>;

  // Status panel management
  readonly toggleStatusPanel: () => Effect.Effect<boolean, HeaderManagerErrors>;
  readonly setStatusPanelOpen: (
    isOpen: boolean
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly isStatusPanelOpen: () => Effect.Effect<boolean, HeaderManagerErrors>;

  // Error management
  readonly setError: (
    error: ErrorInfo
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly clearError: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly getError: () => Effect.Effect<ErrorInfo | null, HeaderManagerErrors>;

  // Status information
  readonly setStatusInfo: (
    status: StatusInfo
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly clearStatusInfo: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly getStatusInfo: () => Effect.Effect<
    StatusInfo | null,
    HeaderManagerErrors
  >;

  // Action management
  readonly getActions: () => Effect.Effect<HeaderActions, HeaderManagerErrors>;
  readonly setActionEnabled: (
    action: keyof HeaderActions,
    enabled: boolean
  ) => Effect.Effect<void, HeaderManagerErrors>;
  readonly setActionVisible: (
    action: keyof HeaderActions,
    visible: boolean
  ) => Effect.Effect<void, HeaderManagerErrors>;

  // Event handling
  readonly onHeaderClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onExpandClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onCompactClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onStashClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onCloseClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onSettingsClick: () => Effect.Effect<void, HeaderManagerErrors>;
  readonly onClearClick: () => Effect.Effect<void, HeaderManagerErrors>;

  // Statistics and monitoring
  readonly getStats: () => Effect.Effect<
    HeaderManagerStats,
    HeaderManagerErrors
  >;
  readonly recordInteraction: (
    action: string
  ) => Effect.Effect<void, HeaderManagerErrors>;

  // Subscription management
  readonly subscribe: (
    listener: (state: HeaderManagerState) => void
  ) => Effect.Effect<() => void, HeaderManagerErrors>;
}
