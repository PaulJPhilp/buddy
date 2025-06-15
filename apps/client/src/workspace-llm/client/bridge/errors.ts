import { Data } from "effect";

export class WorkspaceBridgeValidationError extends Data.TaggedError(
  "WorkspaceBridgeValidationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
