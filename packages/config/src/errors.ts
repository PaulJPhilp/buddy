import { Data } from "effect";

export class WorkspaceError extends Data.TaggedError("WorkspaceError")<{
  message: string;
  cause?: unknown;
}> {}

export class StorageError extends Data.TaggedError("StorageError")<{
  message: string;
  cause?: unknown;
}> {}
