import { Data } from "effect";

export class WorkspacesEditorManagerError extends Data.TaggedError(
  "WorkspacesEditorManagerError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}
