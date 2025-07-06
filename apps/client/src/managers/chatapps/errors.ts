import { Data } from "effect";

export class ChatAppNotFoundError extends Data.TaggedError(
  "ChatAppNotFoundError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatAppAlreadyExistsError extends Data.TaggedError(
  "ChatAppAlreadyExistsError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly workspaceId: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityExceededError extends Data.TaggedError(
  "WorkspaceCapacityExceededError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly currentCount: number;
  readonly maxAllowed: number;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class InvalidChatAppStatusError extends Data.TaggedError(
  "InvalidChatAppStatusError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly currentStatus: string;
  readonly targetStatus: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class FocusModeViolationError extends Data.TaggedError(
  "FocusModeViolationError"
)<{
  readonly message: string;
  readonly appId?: string;
  readonly focusedAppId?: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatAppConfigurationError extends Data.TaggedError(
  "ChatAppConfigurationError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly configField?: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatAppStateTransitionError extends Data.TaggedError(
  "ChatAppStateTransitionError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatAppsManagerOperationError extends Data.TaggedError(
  "ChatAppsManagerOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly appId?: string;
  readonly workspaceId?: string;
  readonly cause?: unknown;
}> {}

export class LayoutConfigurationError extends Data.TaggedError(
  "LayoutConfigurationError"
)<{
  readonly message: string;
  readonly appId?: string;
  readonly workspaceId?: string;
  readonly layoutType: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class AgentAssignmentError extends Data.TaggedError(
  "AgentAssignmentError"
)<{
  readonly message: string;
  readonly appId: string;
  readonly agentId: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityValidationError extends Data.TaggedError(
  "WorkspaceCapacityValidationError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly field: string;
  readonly value: any;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class BulkOperationError extends Data.TaggedError("BulkOperationError")<{
  readonly message: string;
  readonly operation: string;
  readonly successful: string[];
  readonly failed: Array<{ id: string; error: string }>;
  readonly cause?: unknown;
}> {}

export class ChatAppsManagerStateError extends Data.TaggedError(
  "ChatAppsManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatAppsManagerSubscriptionError extends Data.TaggedError(
  "ChatAppsManagerSubscriptionError"
)<{
  readonly message: string;
  readonly operation?: string;
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
  | BulkOperationError
  | ChatAppsManagerStateError
  | ChatAppsManagerSubscriptionError;
