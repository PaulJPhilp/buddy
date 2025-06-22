import { Data } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class StorageReadError extends Data.TaggedError("StorageReadError")<{
  readonly message: string;
  readonly key: string;
  readonly cause?: unknown;
}> {}

export class StorageWriteError extends Data.TaggedError("StorageWriteError")<{
  readonly message: string;
  readonly key: string;
  readonly cause?: unknown;
}> {}
