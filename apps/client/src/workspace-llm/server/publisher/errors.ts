import { Data } from "effect";

export class WorkspaceEventPublishError extends Data.TaggedError(
  "WorkspaceEventPublishError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
