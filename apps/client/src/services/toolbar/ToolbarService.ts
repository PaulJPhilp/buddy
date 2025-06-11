/**
 * @file Implements the ToolbarService which provides access to toolbar configs.
 * @module services/toolbar/ToolbarService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT    !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern!!!
 * !!! used here is the canonical implementation.                        !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

import { Chunk, Effect, Option, Ref, Schema } from "effect";
import {
  ToolbarConfig,
  ToolbarConfigSchema,
} from "../../schemas/ToolbarConfigSchema";

export interface ToolbarServiceApi {
  getAll(): Effect.Effect<readonly ToolbarConfig[]>;
  getById(id: string): Effect.Effect<ToolbarConfig | undefined>;
  create(toolbar: ToolbarConfig): Effect.Effect<void>;
  update(id: string, toolbar: Partial<ToolbarConfig>): Effect.Effect<void>;
  delete(id: string): Effect.Effect<void>;
}

export class ToolbarService extends Effect.Service<ToolbarServiceApi>()(
  "ToolbarService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* Ref.make<Chunk.Chunk<ToolbarConfig>>(Chunk.empty());
      const getAll = () =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          return Chunk.toArray(chunk);
        });
      const getById = (id: string) =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          const optionToolbar = Chunk.findFirst(chunk, (a) => a.id === id);
          return Option.getOrUndefined(optionToolbar);
        });
      const create = (toolbar: ToolbarConfig) =>
        Effect.gen(function* () {
          const validToolbar =
            yield* Schema.decode(ToolbarConfigSchema)(toolbar);
          yield* Ref.update(ref, (chunk) => Chunk.append(chunk, validToolbar));
        }).pipe(
          Effect.catchTag("ParseError", (e) =>
            Effect.logWarning("Failed to decode toolbar config", e).pipe(
              Effect.flatMap(() => Effect.void),
            ),
          ),
        );
      const update = (id: string, patch: Partial<ToolbarConfig>) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.map(chunk, (toolbar) =>
              toolbar.id === id ? { ...toolbar, ...patch } : toolbar,
            ),
          );
        });
      const delete_ = (id: string) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.filter(chunk, (toolbar) => toolbar.id !== id),
          );
        });
      return {
        getAll,
        getById,
        create,
        update,
        delete: delete_,
      } satisfies ToolbarServiceApi;
    }),
    dependencies: [],
  },
) {}
