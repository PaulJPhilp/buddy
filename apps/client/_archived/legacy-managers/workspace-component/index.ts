// Main exports
export type { WorkspaceManagerApi } from "./api";
export {
  WorkspaceNotFoundError,
  ChatAppNotFoundError,
  WorkspaceCapacityError,
  ChatAppCapacityError,
  WorkspaceValidationError,
  ChatAppValidationError,
  WorkspaceStateError,
  ChatAppStateError,
  WorkspaceLoadingError,
  WorkspaceIntegrityError,
  FocusModeError,
  WorkspacePermissionError,
  WorkspaceSubscriptionError,
} from "./errors";
export type { WorkspaceError } from "./errors";
export { WorkspaceComponent as WorkspaceManager } from "./service";
export type {
  WorkspaceEntry,
  ChatAppEntry,
  WorkspaceState,
  CreateWorkspaceParams,
  UpdateWorkspaceParams,
  AddChatAppParams,
  UpdateChatAppParams,
  LayoutPreferences,
  FocusModeConfig,
  ChatAppStatus,
  WorkspaceStats,
  ChatAppConfig,
} from "./types";
export {
  DEFAULT_WORKSPACE_STATE,
  WORKSPACE_CONSTANTS,
  createDefaultWorkspace,
  getActiveWorkspaces,
  getFirstActiveWorkspaceId,
  ensureAtLeastOneWorkspace,
  isValidWorkspaceName,
  isValidWorkspaceColor,
  isValidMaxExpandedApps,
  isValidAvailableAgents,
} from "./types";
