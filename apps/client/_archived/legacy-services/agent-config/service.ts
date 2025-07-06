import { Effect, Layer } from "effect";
import type { AgentUrlServiceApi } from "./api";
import { AgentConfigPathError } from "./errors";
import { AGENTS_DIR } from "./types";

export class AgentUrlService extends Effect.Service<AgentUrlServiceApi>()(
  "AgentUrlService",
  {
    scoped: Effect.gen(function* () {
      const agentsPath = AGENTS_DIR;

      const getAgentsPath = () =>
        Effect.gen(function* () {
          if (!agentsPath) {
            return yield* Effect.fail(
              new AgentConfigPathError({
                message: "Agents path not configured",
              })
            );
          }
          return agentsPath;
        });

      return {
        agentsPath,
        getAgentsPath,
      } satisfies AgentUrlServiceApi;
    }),
    dependencies: [],
  }
) {}

export function agentUrlServiceLayerWithPath(agentsPath: string) {
  return Layer.scoped(
    AgentUrlService,
    Effect.succeed({
      agentsPath,
      getAgentsPath: () => Effect.succeed(agentsPath),
    } satisfies AgentUrlServiceApi)
  );
}

// Alias for backward compatibility
export const agentConfigServiceLayerWithPath = agentUrlServiceLayerWithPath;
