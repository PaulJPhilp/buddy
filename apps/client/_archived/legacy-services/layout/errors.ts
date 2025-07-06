import { Data } from "effect";

export class LayoutStateError extends Data.TaggedError("LayoutStateError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class LayoutValidationError extends Data.TaggedError(
  "LayoutValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class LayoutSubscriptionError extends Data.TaggedError(
  "LayoutSubscriptionError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type LayoutError =
  | LayoutStateError
  | LayoutValidationError
  | LayoutSubscriptionError;
