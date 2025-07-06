import { Data } from "effect";

export class ChatAppNotFoundError extends Data.TaggedError(
  "ChatAppNotFoundError"
)<{
  readonly appId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppAlreadyExistsError extends Data.TaggedError(
  "ChatAppAlreadyExistsError"
)<{
  readonly appId: string;
  readonly workspaceId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityExceededError extends Data.TaggedError(
  "WorkspaceCapacityExceededError"
)<{
  readonly workspaceId: string;
  readonly currentCount: number;
  readonly maxAllowed: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class InvalidChatAppStatusError extends Data.TaggedError(
  "InvalidChatAppStatusError"
)<{
  readonly appId: string;
  readonly currentStatus: string;
  readonly requestedStatus: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FocusModeViolationError extends Data.TaggedError(
  "FocusModeViolationError"
)<{
  readonly appId: string;
  readonly focusedAppId: string;
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppConfigurationError extends Data.TaggedError(
  "ChatAppConfigurationError"
)<{
  readonly appId: string;
  readonly configField?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError"
)<{
  readonly workspaceId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppStateTransitionError extends Data.TaggedError(
  "ChatAppStateTransitionError"
)<{
  readonly appId: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly reason: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppsManagerOperationError extends Data.TaggedError(
  "ChatAppsManagerOperationError"
)<{
  readonly operation: string;
  readonly appId?: string;
  readonly workspaceId?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class LayoutConfigurationError extends Data.TaggedError(
  "LayoutConfigurationError"
)<{
  readonly appId?: string;
  readonly workspaceId?: string;
  readonly layoutType: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentAssignmentError extends Data.TaggedError(
  "AgentAssignmentError"
)<{
  readonly appId: string;
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityValidationError extends Data.TaggedError(
  "WorkspaceCapacityValidationError"
)<{
  readonly workspaceId: string;
  readonly invalidValue: number;
  readonly field: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class BulkOperationError extends Data.TaggedError("BulkOperationError")<{
  readonly operation: string;
  readonly failedAppIds: string[];
  readonly totalAttempted: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ChatAppsManagerError =
  | ChatAppNotFoundError
  | ChatAppAlreadyExistsError
  | WorkspaceCapacityExceededError
  | InvalidChatAppStatusError
  | FocusModeViolationError
  | ChatAppConfigurationError
  | WorkspaceNotFoundError
  | ChatAppStateTransitionError
  | ChatAppsManagerOperationError
  | LayoutConfigurationError
  | AgentAssignmentError
  | WorkspaceCapacityValidationError
  | BulkOperationError;
