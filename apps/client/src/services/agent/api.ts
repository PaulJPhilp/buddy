import { Effect } from "effect";
import type { AgentServiceError } from "./errors";
import type { AgentConfig } from "./types";

export interface AgentServiceApi {
  readonly getAll: () => Effect.Effect<
    readonly AgentConfig[],
    AgentServiceError
  >;
  readonly getById: (
    id: string,
  ) => Effect.Effect<AgentConfig | undefined, AgentServiceError>;
  readonly create: (
    agent: AgentConfig,
  ) => Effect.Effect<void, AgentServiceError>;
  readonly update: (
    id: string,
    agent: Partial<AgentConfig>,
  ) => Effect.Effect<void, AgentServiceError>;
  readonly delete: (id: string) => Effect.Effect<void, AgentServiceError>;
}
