import { Data } from "effect";

export class AppManagerError extends Data.TaggedError(
  "AppManagerError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError",
)<{
  readonly workspaceId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAppNotFoundError extends Data.TaggedError(
  "ChatAppNotFoundError",
)<{
  readonly appId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceValidationError extends Data.TaggedError(
  "WorkspaceValidationError",
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceCapacityError extends Data.TaggedError(
  "WorkspaceCapacityError",
)<{
  readonly workspaceId: string;
  readonly currentCount: number;
  readonly maxAllowed: number;
  readonly message: string;
}> {}

export class WorkspaceConfigError extends Data.TaggedError(
  "WorkspaceConfigError",
)<{
  readonly configPath?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AppManagerErrors =
  | AppManagerError
  | WorkspaceNotFoundError
  | ChatAppNotFoundError
  | WorkspaceValidationError
  | WorkspaceCapacityError
  | WorkspaceConfigError;
