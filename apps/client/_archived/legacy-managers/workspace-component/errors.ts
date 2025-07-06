import { Data } from "effect";

export class WorkspaceLoadError extends Data.TaggedError("WorkspaceLoadError")<{
  readonly source: "api" | "storage" | "validation";
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceParseError extends Data.TaggedError(
  "WorkspaceParseError"
)<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError"
)<{
  readonly workspaceId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppNotFoundError extends Data.TaggedError(
  "ChatAppNotFoundError"
)<{
  readonly appId: string;
  readonly workspaceId?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityError extends Data.TaggedError(
  "WorkspaceCapacityError"
)<{
  readonly limit: number;
  readonly current: number;
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppCapacityError extends Data.TaggedError(
  "ChatAppCapacityError"
)<{
  readonly workspaceId: string;
  readonly limit: number;
  readonly current: number;
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceValidationError extends Data.TaggedError(
  "WorkspaceValidationError"
)<{
  readonly field: string;
  readonly value: unknown;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppValidationError extends Data.TaggedError(
  "ChatAppValidationError"
)<{
  readonly appId: string;
  readonly field: string;
  readonly value: unknown;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceStateError extends Data.TaggedError(
  "WorkspaceStateError"
)<{
  readonly operation: string;
  readonly workspaceId?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppStateError extends Data.TaggedError("ChatAppStateError")<{
  readonly appId: string;
  readonly workspaceId: string;
  readonly operation: string;
  readonly currentStatus?: string;
  readonly targetStatus?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceLoadingError extends Data.TaggedError(
  "WorkspaceLoadingError"
)<{
  readonly source: "api" | "storage" | "validation";
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceIntegrityError extends Data.TaggedError(
  "WorkspaceIntegrityError"
)<{
  readonly workspaceId?: string;
  readonly appId?: string;
  readonly issue: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FocusModeError extends Data.TaggedError("FocusModeError")<{
  readonly workspaceId: string;
  readonly appId?: string;
  readonly operation: "enter" | "exit";
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspacePermissionError extends Data.TaggedError(
  "WorkspacePermissionError"
)<{
  readonly workspaceId: string;
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceSubscriptionError extends Data.TaggedError(
  "WorkspaceSubscriptionError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Union type for all workspace errors
export type WorkspaceError =
  | WorkspaceLoadError
  | WorkspaceNotFoundError
  | ChatAppNotFoundError
  | WorkspaceCapacityError
  | ChatAppCapacityError
  | WorkspaceValidationError
  | ChatAppValidationError
  | WorkspaceStateError
  | ChatAppStateError
  | WorkspaceLoadingError
  | WorkspaceIntegrityError
  | FocusModeError
  | WorkspacePermissionError
  | WorkspaceSubscriptionError;
