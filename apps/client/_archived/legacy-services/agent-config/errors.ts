import { Data } from "effect";

export class AgentConfigPathError extends Data.TaggedError(
  "AgentConfigPathError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AgentUrlServiceError = AgentConfigPathError;
