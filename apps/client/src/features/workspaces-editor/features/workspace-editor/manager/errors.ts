import { Data } from "effect";

export class WorkspaceEditorError extends Data.TaggedError(
  "WorkspaceEditorError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}
