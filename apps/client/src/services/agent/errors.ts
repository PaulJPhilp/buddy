import { Data } from "effect";

export class AgentConfigValidationError extends Data.TaggedError(
  "AgentConfigValidationError",
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class AgentNotFoundError extends Data.TaggedError("AgentNotFoundError")<{
  readonly id: string;
  readonly message: string;
}> {}

export class AgentPersistenceError extends Data.TaggedError(
  "AgentPersistenceError",
)<{
  readonly message: string;
  readonly operation: "load" | "save" | "delete";
  readonly cause?: unknown;
}> {}

export type AgentServiceError =
  | AgentConfigValidationError
  | AgentNotFoundError
  | AgentPersistenceError;
