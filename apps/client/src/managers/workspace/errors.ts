import { Data } from "effect";

/**
 * Represents an error where a workspace could not be found.
 * This is a tagged error, making it easy to catch and handle specifically.
 * It includes the workspaceId for better debugging and context.
 */
export class WorkspaceNotFoundError extends Data.TaggedError(
  "WorkspaceNotFoundError"
)<{
  readonly workspaceId: string;
}> {}
