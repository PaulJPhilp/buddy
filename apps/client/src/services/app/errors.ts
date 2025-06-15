import { Data } from "effect";

export class AppConfigValidationError extends Data.TaggedError(
  "AppConfigValidationError",
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class AppConfigNotFoundError extends Data.TaggedError(
  "AppConfigNotFoundError",
)<{
  readonly id: string;
  readonly message: string;
}> {}

export class AppConfigReferenceError extends Data.TaggedError(
  "AppConfigReferenceError",
)<{
  readonly message: string;
  readonly referenceType: "agent" | "toolbar";
  readonly referenceId: string;
  readonly cause?: unknown;
}> {}

export class AppConfigPersistenceError extends Data.TaggedError(
  "AppConfigPersistenceError",
)<{
  readonly message: string;
  readonly operation: "load" | "save" | "delete";
  readonly cause?: unknown;
}> {}

export type AppServiceError =
  | AppConfigValidationError
  | AppConfigNotFoundError
  | AppConfigReferenceError
  | AppConfigPersistenceError;
