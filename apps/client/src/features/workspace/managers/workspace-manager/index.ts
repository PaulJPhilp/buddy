// Main service export
export { WorkspaceManager } from "./service";

// Types exports
export type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  WorkspaceManagerState,
  WorkspaceManagerConfig,
  WorkspaceManagerStats,
} from "./types";
export {
  WORKSPACE_MANAGER_CONSTANTS,
  createDefaultWorkspaceManagerState,
  createDefaultWorkspaceManagerConfig,
  generateWorkspaceId,
  createWorkspaceFromInput,
} from "./types";

// API exports
export type { WorkspaceManagerApi } from "./api";

// Error exports
export type { WorkspaceError } from "./errors";
export {
  WorkspaceManagerError,
  WorkspaceManagerStateError,
  WorkspaceManagerInitializationError,
  WorkspaceOperationError,
  WorkspaceValidationError,
  WorkspaceNotFoundError,
  WorkspaceDuplicateError,
  WorkspaceLimitError,
  WorkspacePersistenceError,
} from "./errors";
