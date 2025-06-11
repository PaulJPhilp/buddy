import { Chunk, Effect, Option, Ref, Schema } from "effect";
import {
  ChatAppConfig,
  ChatAppConfigSchema,
} from "../../schemas/ChatAppConfigSchema";
import { AgentService, AgentServiceApi } from "../agent";
import { ThemesService, ThemesServiceApi } from "../themes/ThemesService";
import { ToolbarService, ToolbarServiceApi } from "../toolbar";

/**
 * @file Implements the AppService which provides access to chat app configs.
 * @module services/app/AppService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT    !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern!!!
 * !!! used here is the canonical implementation.                        !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

export interface AppServiceApi {
  getAll(): Effect.Effect<readonly ChatAppConfig[]>;
  getById(id: string): Effect.Effect<ChatAppConfig | undefined>;
  create(app: ChatAppConfig): Effect.Effect<void>;
  update(id: string, app: Partial<ChatAppConfig>): Effect.Effect<void>;
  delete(id: string): Effect.Effect<void>;
}

// Helper function to validate references
const validateReferences = (
  agents: AgentServiceApi,
  toolbars: ToolbarServiceApi,
  themes: ThemesServiceApi,
  app: ChatAppConfig,
) =>
  Effect.all([
    Effect.flatMap(agents.getById(app.agentId), (a) =>
      a ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid agentId")),
    ),
    Effect.flatMap(toolbars.getById(app.toolbarId), (t) =>
      t ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid toolbarId")),
    ),
    Effect.flatMap(
      themes
        .getTheme(app.themeId)
        .pipe(Effect.catchAll(() => Effect.succeed(undefined))),
      (th) =>
        th ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid themeId")),
    ),
  ]).pipe(Effect.map((_) => void 0));

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;
    const themesService = yield* ThemesService;
    const ref = yield* Ref.make<Chunk.Chunk<ChatAppConfig>>(Chunk.empty());

    return {
      getAll: () => Effect.map(Ref.get(ref), Chunk.toArray),
      getById: (id: string) =>
        Ref.get(ref).pipe(
          Effect.map((chunk) => Chunk.findFirst(chunk, (a) => a.id === id)),
          Effect.map(Option.getOrUndefined),
        ),
      create: (app: ChatAppConfig) =>
        Effect.gen(function* () {
          const validApp = yield* Schema.decode(ChatAppConfigSchema)(app);
          yield* validateReferences(
            agentService,
            toolbarService,
            themesService,
            validApp,
          );
          yield* Ref.update(ref, (chunk) => Chunk.append(chunk, validApp));
        }).pipe(
          Effect.catchAll((e) =>
            Effect.logWarning(
              "Failed to create app config due to validation/decode error",
              { error: e },
              e,
              { service: "AppService" },
            ).pipe(Effect.flatMap(() => Effect.void)),
          ),
        ),
      update: (id: string, patch: Partial<ChatAppConfig>) =>
        Ref.update(ref, (chunk) =>
          Chunk.map(chunk, (app) =>
            app.id === id ? { ...app, ...patch } : app,
          ),
        ),
      delete: (id: string) =>
        Ref.update(ref, (chunk) => Chunk.filter(chunk, (app) => app.id !== id)),
    } satisfies AppServiceApi;
  }),
  dependencies: [AgentService, ToolbarService, ThemesService],
}) {}
