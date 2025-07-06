import { Data } from "effect";

export class CoreManagerInitializationError extends Data.TaggedError(
  "CoreManagerInitializationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CoreManagerStateError extends Data.TaggedError(
  "CoreManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class CoreManagerSubscriptionError extends Data.TaggedError(
  "CoreManagerSubscriptionError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CoreManagerOperationError extends Data.TaggedError(
  "CoreManagerOperationError"
)<{
  readonly message: string;
  readonly operation: "start" | "stop" | "cleanup";
  readonly cause?: unknown;
}> {}

export class CoreManagerCoordinationError extends Data.TaggedError(
  "CoreManagerCoordinationError"
)<{
  readonly message: string;
  readonly context: string;
  readonly cause?: unknown;
}> {}

export type CoreManagerError =
  | CoreManagerInitializationError
  | CoreManagerStateError
  | CoreManagerSubscriptionError
  | CoreManagerOperationError
  | CoreManagerCoordinationError;
