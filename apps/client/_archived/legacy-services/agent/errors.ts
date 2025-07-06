import { Data } from "effect";

/**
 * Error for when agent configuration validation fails.
 */
export class AgentConfigValidationError extends Data.TaggedError(
  "AgentConfigValidationError",
)<{
  readonly message: string;
  readonly operation: "load" | "save" | "delete";
  readonly field?: string;
  readonly cause?: unknown;
}> {}

/**
 * Error for when persisting agent configurations fails.
 */
export class AgentPersistenceError extends Data.TaggedError(
  "AgentPersistenceError",
)<{
  readonly message: string;
  readonly operation: "load" | "save" | "delete";
  readonly cause?: unknown;
}> {}

/**
 * Error for when a specific agent is not found.
 */
export class AgentNotFoundError extends Data.TaggedError("AgentNotFoundError")<{
  readonly agentId: string;
}> {}

export type AgentServiceError =
  | AgentConfigValidationError
  | AgentNotFoundError
  | AgentPersistenceError;
