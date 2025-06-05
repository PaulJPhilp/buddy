import { Chunk, Effect, Option, Ref, Schema } from "effect"
import { ChatAppConfig, ChatAppConfigSchema } from "../../schemas/ChatAppConfigSchema"
import { AgentsService, AgentsServiceApi } from "./AgentsService"
import { ToolbarsService, ToolbarsServiceApi } from "./ToolbarsService"

/**
 * @file Implements the AppsService which provides access to chat app configs.
 * @module services/dynamic/AppsService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT    !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern!!!
 * !!! used here is the canonical implementation.                        !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

export interface AppsServiceApi {
  getAll(): Effect.Effect<readonly ChatAppConfig[]>
  getById(id: string): Effect.Effect<ChatAppConfig | undefined>
  create(app: ChatAppConfig): Effect.Effect<void, never, AgentsService | ToolbarsService>
  update(id: string, app: Partial<ChatAppConfig>): Effect.Effect<void>
  delete(id: string): Effect.Effect<void>
}

// Helper function to validate references
const validateReferences = (
  agents: AgentsServiceApi,
  toolbars: ToolbarsServiceApi,
  app: ChatAppConfig
) =>
  Effect.all([
    Effect.flatMap(
      agents.getById(app.agentId),
      a => a ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid agentId"))
    ),
    Effect.flatMap(
      toolbars.getById(app.toolbarId),
      t => t ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid toolbarId"))
    )
  ]).pipe(Effect.map(_ => void 0))

export class AppsService extends Effect.Service<AppsServiceApi>()(
  "AppsService",
  {
    scoped: Effect.gen(function* () {
      const agents = yield* AgentsService
      const toolbars = yield* ToolbarsService
      const ref = yield* Ref.make<Chunk.Chunk<ChatAppConfig>>(Chunk.empty())

      return {
        getAll: () => Effect.map(
          Ref.get(ref),
          Chunk.toArray
        ),
        getById: (id: string) =>
          Ref.get(ref).pipe(
            Effect.map(chunk => Chunk.findFirst(chunk, a => a.id === id)),
            Effect.map(Option.getOrUndefined)
          ),
        create: (app: ChatAppConfig) =>
          Effect.gen(function* () {
            const validApp = yield* Schema.decode(ChatAppConfigSchema)(app)
            yield* validateReferences(agents, toolbars, validApp)
            yield* Ref.update(ref, chunk => Chunk.append(chunk, validApp))
          }).pipe(
            Effect.catchAll(e =>
              Effect.logWarning("Failed to create app config due to validation/decode error", e).pipe(
                Effect.flatMap(() => Effect.void)
              )
            )
          ),
        update: (id: string, patch: Partial<ChatAppConfig>) =>
          Ref.update(ref, chunk =>
            Chunk.map(chunk, app =>
              app.id === id ? { ...app, ...patch } : app
            )
          ),
        delete: (id: string) =>
          Ref.update(ref, chunk => Chunk.filter(chunk, app => app.id !== id))
      } satisfies AppsServiceApi
    }),
    dependencies: [AgentsService.Default, ToolbarsService.Default]
  }
) { }
