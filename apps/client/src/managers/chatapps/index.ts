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
  WorkspaceCapacityValidationError,
  BulkOperationError,
  ChatAppsManagerStateError,
  ChatAppsManagerSubscriptionError,
} from "./errors";
export type { ChatAppsManagerError } from "./errors";
export { ChatAppsManager } from "./service";
export type {
  ChatAppInstance,
  ChatAppInstanceMetadata,
  ChatAppStatus,
  ChatAppsManagerState,
  ChatAppsManagerStats,
  ChatAppsOperation,
  ChatAppsOperationType,
  FocusModeConfig,
  FocusModeState,
  LayoutConfig,
  WorkspaceCapacityConfig,
  WorkspaceLayoutConfig,
  WorkspaceSpecificStats,
  ChatAppMetrics,
  ChatAppConfig,
} from "./types";
export {
  CHAT_APPS_MANAGER_CONSTANTS,
  isValidChatAppStatus,
  isValidStatusTransition,
  isValidCapacityConfig,
  generateOperationId,
  generateChatAppId,
} from "./types";
