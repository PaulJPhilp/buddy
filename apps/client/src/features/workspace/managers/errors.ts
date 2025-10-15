import { Data } from "effect";

export class WorkspaceLoadError extends Data.TaggedError("WorkspaceLoadError")<{
  readonly message: string;
  readonly workspaceId: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceChatAppError extends Data.TaggedError(
  "WorkspaceChatAppError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly chatAppId: string;
  readonly operation: "load" | "activate" | "deactivate" | "get";
  readonly cause?: unknown;
}> {}

export class WorkspaceAgentError extends Data.TaggedError(
  "WorkspaceAgentError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly operation: "load" | "get" | "filter";
  readonly cause?: unknown;
}> {}

export class WorkspaceUIError extends Data.TaggedError("WorkspaceUIError")<{
  readonly message: string;
  readonly workspaceId: string;
  readonly operation: "render" | "check";
  readonly cause?: unknown;
}> {}

export class WorkspaceOperationError extends Data.TaggedError(
  "WorkspaceOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceStateError extends Data.TaggedError(
  "WorkspaceStateError"
)<{
  readonly message: string;
  readonly operation: "get" | "set" | "subscribe";
  readonly cause?: unknown;
}> {}

export class WorkspaceValidationError extends Data.TaggedError(
  "WorkspaceValidationError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly field: string;
  readonly value?: unknown;
  readonly cause?: unknown;
}> {}

export class WorkspaceSwitchError extends Data.TaggedError(
  "WorkspaceSwitchError"
)<{
  readonly message: string;
  readonly fromWorkspaceId?: string;
  readonly toWorkspaceId: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceInitializationError extends Data.TaggedError(
  "WorkspaceInitializationError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly phase: "initialization" | "configuration" | "setup";
  readonly cause?: unknown;
}> {}

export class WorkspaceConfigurationError extends Data.TaggedError(
  "WorkspaceConfigurationError"
)<{
  readonly message: string;
  readonly workspaceId: string;
  readonly cause?: unknown;
}> {}

export type WorkspaceComponentError =
  | WorkspaceLoadError
  | WorkspaceChatAppError
  | WorkspaceAgentError
  | WorkspaceUIError
  | WorkspaceOperationError
  | WorkspaceStateError
  | WorkspaceValidationError
  | WorkspaceSwitchError
  | WorkspaceInitializationError
  | WorkspaceConfigurationError;
