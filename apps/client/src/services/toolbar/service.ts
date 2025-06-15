/**
 * ToolbarService implementation using Effect.Service pattern
 *
 * Provides access to toolbar configurations with proper error handling.
 */

import { Chunk, Effect, Option, Ref } from "effect";
import type { ToolbarServiceApi } from "./api";
import { ToolbarPersistenceError } from "./errors";
import type { ToolbarConfig } from "./types";

export class ToolbarService extends Effect.Service<ToolbarServiceApi>()(
  "ToolbarService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* Ref.make<Chunk.Chunk<ToolbarConfig>>(Chunk.empty());

      const getAll = () =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          return Chunk.toArray(chunk);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ToolbarPersistenceError({
                message: "Failed to retrieve toolbar configs",
                operation: "load",
                cause,
              }),
          ),
        );

      const getById = (id: string) =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          const optionToolbar = Chunk.findFirst(chunk, (a) => a.id === id);
          return Option.getOrUndefined(optionToolbar);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ToolbarPersistenceError({
                message: "Failed to retrieve toolbar config",
                operation: "load",
                cause,
              }),
          ),
        );

      const create = (toolbar: ToolbarConfig) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) => Chunk.append(chunk, toolbar)).pipe(
            Effect.mapError(
              (cause) =>
                new ToolbarPersistenceError({
                  message: "Failed to save toolbar config",
                  operation: "save",
                  cause,
                }),
            ),
          );
        });

      const update = (id: string, patch: Partial<ToolbarConfig>) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.map(chunk, (toolbar) =>
              toolbar.id === id ? { ...toolbar, ...patch } : toolbar,
            ),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ToolbarPersistenceError({
                  message: "Failed to update toolbar config",
                  operation: "save",
                  cause,
                }),
            ),
          );
        });

      const delete_ = (id: string) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.filter(chunk, (toolbar) => toolbar.id !== id),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ToolbarPersistenceError({
                  message: "Failed to delete toolbar config",
                  operation: "delete",
                  cause,
                }),
            ),
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
