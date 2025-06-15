/**
 * AgentService implementation using Effect.Service pattern
 *
 * Provides access to agent configurations with proper error handling
 * and validation using the separated API, types, errors, and schema files.
 */

import { Chunk, Effect, Option, Ref } from "effect";
import { Schema } from "effect";
import type { AgentServiceApi } from "./api";
import { AgentConfigValidationError, AgentPersistenceError } from "./errors";
import { AgentConfigSchema } from "./schema";
import type { AgentConfig } from "./types";

export class AgentService extends Effect.Service<AgentServiceApi>()(
  "AgentService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* Ref.make<Chunk.Chunk<AgentConfig>>(Chunk.empty());

      const getAll = () =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          return Chunk.toArray(chunk);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AgentPersistenceError({
                message: "Failed to retrieve agent configs",
                operation: "load",
                cause,
              }),
          ),
        );

      const getById = (id: string) =>
        Effect.gen(function* () {
          const chunk = yield* Ref.get(ref);
          const optionAgent = Chunk.findFirst(chunk, (a) => a.id === id);
          return Option.getOrUndefined(optionAgent);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AgentPersistenceError({
                message: "Failed to retrieve agent config",
                operation: "load",
                cause,
              }),
          ),
        );

      const create = (agent: AgentConfig) =>
        Effect.gen(function* () {
          const validAgent = yield* Schema.decode(AgentConfigSchema)(
            agent,
          ).pipe(
            Effect.mapError(
              (cause) =>
                new AgentConfigValidationError({
                  message: "Invalid agent config format",
                  cause,
                }),
            ),
          );

          yield* Ref.update(ref, (chunk) =>
            Chunk.append(chunk, validAgent),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new AgentPersistenceError({
                  message: "Failed to save agent config",
                  operation: "save",
                  cause,
                }),
            ),
          );
        });

      const update = (id: string, patch: Partial<AgentConfig>) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.map(chunk, (agent) =>
              agent.id === id ? { ...agent, ...patch } : agent,
            ),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new AgentPersistenceError({
                  message: "Failed to update agent config",
                  operation: "save",
                  cause,
                }),
            ),
          );
        });

      const delete_ = (id: string) =>
        Effect.gen(function* () {
          yield* Ref.update(ref, (chunk) =>
            Chunk.filter(chunk, (agent) => agent.id !== id),
          ).pipe(
            Effect.mapError(
              (cause) =>
                new AgentPersistenceError({
                  message: "Failed to delete agent config",
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
      } satisfies AgentServiceApi;
    }),
    dependencies: [],
  },
) {}
