/**
 * @file Implements the AgentsService which provides access to agent configs.
 * @module services/dynamic/AgentsService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT    !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern!!!
 * !!! used here is the canonical implementation.                        !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

import { Chunk, Effect, Ref, Schema } from "effect"
import { AgentConfig, AgentConfigSchema } from "../../schemas/AgentConfigSchema"

export interface AgentsServiceApi {
  getAll(): Effect.Effect<readonly AgentConfig[]>
  getById(id: string): Effect.Effect<AgentConfig | undefined>
  create(agent: AgentConfig): Effect.Effect<void>
  update(id: string, agent: Partial<AgentConfig>): Effect.Effect<void>
  delete(id: string): Effect.Effect<void>
}

export class AgentsService extends Effect.Service<AgentsServiceApi>()(
  "AgentsService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* Ref.make<Chunk.Chunk<AgentConfig>>(Chunk.empty())
      const getAll = () => Effect.gen(function* () {
        const chunk = yield* Ref.get(ref)
        return Chunk.toArray(chunk)
      })
      const getById = (id: string) => Effect.gen(function* () {
        const chunk = yield* Ref.get(ref)
        return Chunk.findFirst(chunk, a => a.id === id)
      })
      const create = (agent: AgentConfig) => Effect.gen(function* () {
        const validAgent = yield* Schema.decode(AgentConfigSchema)(agent)
        yield* Ref.update(ref, chunk => Chunk.append(chunk, validAgent))
      })
      const update = (id: string, patch: Partial<AgentConfig>) => Effect.gen(function* () {
        yield* Ref.update(ref, chunk =>
          Chunk.map(chunk, agent =>
            agent.id === id ? { ...agent, ...patch } : agent
          )
        )
      })
      const delete_ = (id: string) => Effect.gen(function* () {
        yield* Ref.update(ref, chunk => Chunk.filter(chunk, agent => agent.id !== id))
      })
      return {
        getAll,
        getById,
        create,
        update,
        delete: delete_,
      } satisfies AgentsServiceApi
    }),
    dependencies: []
  }
) {}

import { Layer } from "effect"
export const AgentsServiceLive = Layer.scoped(AgentsService)
