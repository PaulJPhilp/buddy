import { Data } from "effect";

// --- Error Types ---
export class MdxCompilationError extends Data.TaggedError(
  "MdxCompilationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class MdxParsingError extends Data.TaggedError("MdxParsingError")<{
  readonly message: string;
  readonly filePath?: string;
  readonly cause?: unknown;
}> {}

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly message: string;
  readonly path: string;
  readonly operation: "read" | "stat" | "write";
  readonly cause?: unknown;
}> {}

export type MdxError = MdxCompilationError | MdxParsingError | FileSystemError;
