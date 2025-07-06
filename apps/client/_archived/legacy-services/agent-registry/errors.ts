import { Data } from "effect";

export class AgentNotFoundError extends Data.TaggedError("AgentNotFoundError")<{
  readonly agentId: string;
}> {}

export class DuplicateAgentIdError extends Data.TaggedError(
  "DuplicateAgentIdError",
)<{
  readonly agentId: string;
}> {}

export type AgentRegistryError = AgentNotFoundError | DuplicateAgentIdError;
