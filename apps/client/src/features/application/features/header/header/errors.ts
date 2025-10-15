import { Data } from "effect";

export class HeaderManagerError extends Data.TaggedError("HeaderManagerError")<{
  readonly message: string;
  readonly chatAppId?: string;
  readonly cause?: unknown;
}> {}

export class HeaderManagerInitializationError extends Data.TaggedError(
  "HeaderManagerInitializationError"
)<{
  readonly message: string;
  readonly chatAppId?: string;
  readonly cause?: unknown;
}> {}

export class HeaderManagerStateError extends Data.TaggedError(
  "HeaderManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class HeaderManagerOperationError extends Data.TaggedError(
  "HeaderManagerOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly chatAppId?: string;
  readonly cause?: unknown;
}> {}

export class HeaderManagerValidationError extends Data.TaggedError(
  "HeaderManagerValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
  readonly cause?: unknown;
}> {}

export class HeaderManagerConfigError extends Data.TaggedError(
  "HeaderManagerConfigError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}
