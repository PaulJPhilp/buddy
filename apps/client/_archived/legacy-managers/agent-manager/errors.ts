import { Data } from "effect";

export class AgentNotFoundError extends Data.TaggedError("AgentNotFoundError")<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentAlreadyExistsError extends Data.TaggedError(
  "AgentAlreadyExistsError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentInitializationError extends Data.TaggedError(
  "AgentInitializationError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentTerminationError extends Data.TaggedError(
  "AgentTerminationError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentConfigurationError extends Data.TaggedError(
  "AgentConfigurationError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentCommunicationError extends Data.TaggedError(
  "AgentCommunicationError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentHealthCheckError extends Data.TaggedError(
  "AgentHealthCheckError",
)<{
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class NoActiveAgentError extends Data.TaggedError("NoActiveAgentError")<{
  readonly message: string;
  readonly operation: string;
}> {}

export class AgentRegistryError extends Data.TaggedError("AgentRegistryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentManagerOperationError extends Data.TaggedError(
  "AgentManagerOperationError",
)<{
  readonly operation: string;
  readonly agentId?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AgentManagerError =
  | AgentNotFoundError
  | AgentAlreadyExistsError
  | AgentInitializationError
  | AgentTerminationError
  | AgentConfigurationError
  | AgentCommunicationError
  | AgentHealthCheckError
  | NoActiveAgentError
  | AgentRegistryError
  | AgentManagerOperationError;
