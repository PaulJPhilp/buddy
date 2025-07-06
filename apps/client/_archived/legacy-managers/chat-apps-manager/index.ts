// Main exports
export type { ChatAppsManagerApi } from "./api";
export {
  ChatAppNotFoundError,
  ChatAppAlreadyExistsError,
  WorkspaceCapacityExceededError,
  InvalidChatAppStatusError,
  FocusModeViolationError,
  ChatAppConfigurationError,
  WorkspaceNotFoundError,
  ChatAppStateTransitionError,
  ChatAppsManagerOperationError,
  LayoutConfigurationError,
  AgentAssignmentError,
  BulkOperationError,
} from "./errors";
export type { ChatAppsManagerError } from "./errors";
export { ChatAppsManager } from "./service";
export type {
  ChatAppInstance,
  ChatAppsManagerState,
  ChatAppStatus,
  ChatAppsManagerStats,
  FocusModeConfig,
  FocusModeState,
  WorkspaceCapacityConfig,
  WorkspaceLayoutConfig,
  LayoutConfig,
  ChatAppInstanceMetadata,
  WorkspaceSpecificStats,
  ChatAppMetrics,
  ChatAppConfig,
} from "./types";
export {
  CHAT_APPS_MANAGER_CONSTANTS,
} from "./types"; 