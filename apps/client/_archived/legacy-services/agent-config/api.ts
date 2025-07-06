import { Effect } from "effect";
import type { AgentUrlServiceError } from "./errors";

export interface AgentUrlServiceApi {
  readonly agentsPath: string;
  readonly getAgentsPath: () => Effect.Effect<string, AgentUrlServiceError>;
}
