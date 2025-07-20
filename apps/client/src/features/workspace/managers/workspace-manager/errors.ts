import { Data } from "effect";

// Base workspace manager error
export class WorkspaceManagerError extends Data.TaggedError(
  "WorkspaceManagerError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}

// State management errors
export class WorkspaceManagerStateError extends Data.TaggedError(
  "WorkspaceManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: Error;
}> {}

// Initialization errors
export class WorkspaceManagerInitializationError extends Data.TaggedError(
  "WorkspaceManagerInitializationError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}

// Workspace operation errors
export class WorkspaceOperationError extends Data.TaggedError(
  "WorkspaceOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly workspaceId?: string;
  readonly cause?: Error;
}> {}

// Workspace validation errors
export class WorkspaceValidationError extends Data.TaggedError(
  "WorkspaceValidationError"
)<{
  readonly message: string;
  readonly workspaceId?: string;
  readonly validationErrors: readonly string[];
}> {}

// Workspace not found error
export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError"
)<{
  readonly message: string;
  readonly workspaceId: string;
}> {}

// Workspace already exists error
export class WorkspaceDuplicateError extends Data.TaggedError(
  "WorkspaceDuplicateError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly existingWorkspace: string;
}> {}

// Workspace limit exceeded error
export class WorkspaceLimitError extends Data.TaggedError(
  "WorkspaceLimitError"
)<{
  readonly message: string;
  readonly currentCount: number;
  readonly maxAllowed: number;
}> {}

// Workspace persistence errors
export class WorkspacePersistenceError extends Data.TaggedError(
  "WorkspacePersistenceError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly workspaceId?: string;
  readonly cause?: Error;
}> {}

// Union type for all workspace errors
export type WorkspaceError =
  | WorkspaceManagerError
  | WorkspaceManagerStateError
  | WorkspaceManagerInitializationError
  | WorkspaceOperationError
  | WorkspaceValidationError
  | WorkspaceNotFoundError
  | WorkspaceDuplicateError
  | WorkspaceLimitError
  | WorkspacePersistenceError;
