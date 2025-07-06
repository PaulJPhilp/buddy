import type { Agent } from "@/types/global";
import type { Effect, Option } from "effect";
import type { AgentRegistryError } from "./errors";

export interface AgentRegistryApi {
  readonly getAllAgents: () => Effect.Effect<
    Agent[],
    AgentRegistryError,
    never
  >;
  readonly getAgentById: (
    agentId: string,
  ) => Effect.Effect<Option.Option<Agent>, AgentRegistryError, never>;
  readonly getAgentsByAppId: (
    appId: string,
  ) => Effect.Effect<Agent[], AgentRegistryError, never>;
}
