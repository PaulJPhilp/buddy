/**
 * UI State Service Errors
 */

import { Data } from "effect";

export class UIStateNotFoundError extends Data.TaggedError(
  "UIStateNotFoundError"
)<{
  readonly message: string;
  readonly stateId?: string;
}> {}

export class UIStateValidationError extends Data.TaggedError(
  "UIStateValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class UIStatePersistenceError extends Data.TaggedError(
  "UIStatePersistenceError"
)<{
  readonly message: string;
  readonly operation: "save" | "load" | "reset";
  readonly cause?: unknown;
}> {}

export class UIStateOperationError extends Data.TaggedError(
  "UIStateOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export type UIStateServiceError =
  | UIStateNotFoundError
  | UIStateValidationError
  | UIStatePersistenceError
  | UIStateOperationError;
