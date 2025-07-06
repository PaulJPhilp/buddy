import { AppService } from "@/services/app";
import { Agent } from "@/types/global";
import { Duration, Effect, Layer, Option, ReadonlyArray } from "effect";
import type { AgentRegistryApi } from "./api";
import { DuplicateAgentIdError } from "./errors";

export class AgentRegistryService extends Effect.Service<AgentRegistryApi>()(
  "AgentRegistryService",
  {
    scoped: Effect.gen(function* (_) {
      const appService = yield* AppService;

      const getAllAgentsEffect = Effect.gen(function* (_) {
        try {
          const appConfigs = yield* appService.getAll();
          const agentMap = new Map<string, Agent>();

          for (const config of appConfigs) {
            if (config.agents) {
              for (const agent of config.agents) {
                if (agentMap.has(agent.id)) {
                  return yield* Effect.fail(
                    new DuplicateAgentIdError({ agentId: agent.id })
                  );
                }
                agentMap.set(agent.id, agent);
              }
            }
          }
          return Array.from(agentMap.values());
        } catch (error) {
          console.error("Failed to load agents:", error);
          return [];
        }
      });

      const getAllAgents = () => getAllAgentsEffect;

      const getAgentById = (agentId: string) =>
        Effect.gen(function* (_) {
          try {
            const agents = yield* getAllAgentsEffect;
            const agent = agents.find((a) => a.id === agentId);
            return Option.fromNullable(agent);
          } catch (error) {
            console.error("Failed to get agent by ID:", error);
            return Option.none();
          }
        });

      const getAgentsByAppId = (appId: string) =>
        Effect.gen(function* (_) {
          try {
            const config = yield* appService.getById(appId);
            return config?.agents ?? [];
          } catch (error) {
            console.error("Failed to get agents by app ID:", error);
            return [];
          }
        });

      return {
        getAllAgents,
        getAgentById,
        getAgentsByAppId,
      };
    }),
    dependencies: [AppService.Default],
  }
) {}
