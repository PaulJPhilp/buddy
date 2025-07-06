import { Data } from "effect";

export class CoreComponentInitializationError extends Data.TaggedError(
  "CoreComponentInitializationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CoreComponentStateError extends Data.TaggedError(
  "CoreComponentStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class CoreComponentSubscriptionError extends Data.TaggedError(
  "CoreComponentSubscriptionError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CoreComponentCleanupError extends Data.TaggedError(
  "CoreComponentCleanupError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type CoreComponentError =
  | CoreComponentInitializationError
  | CoreComponentStateError
  | CoreComponentSubscriptionError
  | CoreComponentCleanupError;
