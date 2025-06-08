import { Data } from "effect";

// --- Error Types ---
export class MdxCompilationError extends Data.TaggedError(
  "MdxCompilationError",
)<{
  readonly underlyingError: unknown;
  readonly details?: string;
}> {}

export class MdxParsingError extends Data.TaggedError("MdxParsingError")<{
  readonly underlyingError: unknown;
  readonly details?: string;
}> {}

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly underlyingError: unknown;
  readonly path: string;
  readonly operation: "read" | "stat" | "write";
}> {}

export type MdxError = MdxCompilationError | MdxParsingError | FileSystemError;
