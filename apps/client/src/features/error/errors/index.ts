import { Data, TaggedError } from "effect";

export class AppError extends Data.TaggedError("AppError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FatalError extends Data.TaggedError("FatalError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class HandledError extends Data.TaggedError("HandledError")<{
  readonly message: string;
  readonly details?: string;
}> {}
