import { Data } from "effect";

export class ToolbarConfigValidationError extends Data.TaggedError(
  "ToolbarConfigValidationError",
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class ToolbarNotFoundError extends Data.TaggedError(
  "ToolbarNotFoundError",
)<{
  readonly id: string;
  readonly message: string;
}> {}

export class ToolbarPersistenceError extends Data.TaggedError(
  "ToolbarPersistenceError",
)<{
  readonly message: string;
  readonly operation: "load" | "save" | "delete";
  readonly cause?: unknown;
}> {}

export type ToolbarServiceError =
  | ToolbarConfigValidationError
  | ToolbarNotFoundError
  | ToolbarPersistenceError;
