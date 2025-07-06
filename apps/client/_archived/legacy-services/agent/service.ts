import { Effect, Layer, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { AgentUrlService } from "../agent-config";
import type { AgentServiceApi } from "./api";
import {
  AgentConfigValidationError,
  AgentNotFoundError,
  AgentPersistenceError,
  type AgentServiceError,
} from "./errors";
import { AgentConfigSchema } from "./schema";
import type { AgentConfig } from "./types";

export class AgentService extends Effect.Service<AgentServiceApi>()(
  "AgentService",
  {
    scoped: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const config = yield* AgentUrlService;

      const getAll = (basePath?: string) =>
        Effect.gen(function* () {
          const agentsPath = yield* config.getAgentsPath().pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to get agents path: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "load",
                  cause: error,
                })
            )
          );

          const files = yield* fs.readDirectory(agentsPath).pipe(
            Effect.mapError(
              (error): AgentServiceError =>
                new AgentPersistenceError({
                  message: `Failed to list agent configs: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "load",
                  cause: error,
                })
            )
          );

          const jsonFiles = files.filter((file) => file.endsWith(".json"));

          const configs = yield* Effect.all(
            jsonFiles.map((file) => readJsonFile(fs, `${agentsPath}/${file}`))
          );

          return configs;
        });

      const getById = (id: string, basePath?: string) =>
        Effect.gen(function* () {
          const agentsPath = yield* config.getAgentsPath().pipe(
            Effect.mapError(
              (error): AgentServiceError =>
                new AgentPersistenceError({
                  message: `Failed to get agents path: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "load",
                  cause: error,
                })
            )
          );

          const filePath = `${agentsPath}/${id}.json`;

          const exists = yield* fs.exists(filePath).pipe(
            Effect.mapError(
              (error): AgentServiceError =>
                new AgentPersistenceError({
                  message: `Failed to check if agent exists: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "load",
                  cause: error,
                })
            )
          );

          if (!exists) {
            return yield* Effect.succeed(undefined);
          }

          return yield* readJsonFile(fs, filePath);
        });

      const create = (
        agent: AgentConfig
      ): Effect.Effect<void, AgentServiceError, never> =>
        Effect.gen(function* () {
          const agentsPath = yield* config.getAgentsPath().pipe(
            Effect.mapError(
              (error): AgentServiceError =>
                new AgentPersistenceError({
                  message: `Failed to get agents path: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "save",
                  cause: error,
                })
            )
          );

          const filePath = `${agentsPath}/${agent.id}.json`;

          const exists = yield* fs.exists(filePath).pipe(
            Effect.mapError(
              (error): AgentServiceError =>
                new AgentPersistenceError({
                  message: `Failed to check if agent exists: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "save",
                  cause: error,
                })
            )
          );

          if (exists) {
            return yield* Effect.fail(
              new AgentPersistenceError({
                message: `Agent with ID ${agent.id} already exists`,
                operation: "save",
                cause: new Error(`Agent with ID ${agent.id} already exists`),
              })
            );
          }

          yield* writeJsonFile(fs, filePath, agent);
        });

      const update = (
        id: string,
        patch: Partial<AgentConfig>
      ): Effect.Effect<void, AgentServiceError, never> =>
        Effect.gen(function* () {
          const agentsPath = yield* config.getAgentsPath().pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to get agents path: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "save",
                  cause: error,
                })
            )
          );

          const filePath = `${agentsPath}/${id}.json`;

          const exists = yield* fs.exists(filePath).pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to check if agent exists: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "save",
                  cause: error,
                })
            )
          );

          if (!exists) {
            return yield* Effect.fail(
              new AgentNotFoundError({
                agentId: id,
              })
            );
          }

          const current = yield* readJsonFile(fs, filePath);
          const currentConfig = yield* parseConfig(current, "load");
          const updated = { ...currentConfig, ...patch };
          const validated = yield* parseConfig(updated, "save");

          yield* writeJsonFile(fs, filePath, validated);
        });

      const deleteAgent = (
        id: string
      ): Effect.Effect<void, AgentServiceError, never> =>
        Effect.gen(function* () {
          const agentsPath = yield* config.getAgentsPath().pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to get agents path: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "delete",
                  cause: error,
                })
            )
          );

          const filePath = `${agentsPath}/${id}.json`;

          const exists = yield* fs.exists(filePath).pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to check if agent exists: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "delete",
                  cause: error,
                })
            )
          );

          if (!exists) {
            return yield* Effect.fail(
              new AgentNotFoundError({
                agentId: id,
              })
            );
          }

          yield* fs.remove(filePath).pipe(
            Effect.mapError(
              (error) =>
                new AgentPersistenceError({
                  message: `Failed to delete agent config: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  operation: "delete",
                  cause: error,
                })
            )
          );
        });

      return {
        getAll,
        getById,
        create,
        update,
        delete: deleteAgent,
      } satisfies AgentServiceApi;
    }),
  }
) {}

// Helper function to parse and validate agent config
const parseConfig = (
  json: AgentConfig,
  operation: "load" | "save" | "delete" = "load"
): Effect.Effect<AgentConfig, AgentServiceError> =>
  Effect.try({
    try: () => Schema.decodeSync(AgentConfigSchema)(json),
    catch: (error): AgentServiceError =>
      new AgentConfigValidationError({
        message: `Invalid agent config: ${
          error instanceof Error ? error.message : String(error)
        }`,
        operation,
        cause: error,
      }),
  });

// Helper function to read and parse a JSON file
const readJsonFile = (
  fs: FileSystem.FileSystem,
  filePath: string
): Effect.Effect<AgentConfig, AgentServiceError> =>
  fs.readFileString(filePath).pipe(
    Effect.mapError(
      (error): AgentServiceError =>
        new AgentPersistenceError({
          message: `Failed to read agent config: ${
            error instanceof Error ? error.message : String(error)
          }`,
          operation: "load",
          cause: error,
        })
    ),
    Effect.flatMap((content) =>
      Effect.try({
        try: () => {
          const parsed = JSON.parse(content);
          if (!parsed || typeof parsed !== "object") {
            throw new Error("Invalid JSON: not an object");
          }
          return parsed;
        },
        catch: (error): AgentServiceError =>
          new AgentConfigValidationError({
            message: `Invalid JSON: ${
              error instanceof Error ? error.message : String(error)
            }`,
            operation: "load",
            cause: error,
          }),
      }).pipe(Effect.flatMap((json) => parseConfig(json, "load")))
    )
  );

// Helper function to write a JSON file
const writeJsonFile = (
  fs: FileSystem.FileSystem,
  filePath: string,
  data: AgentConfig
): Effect.Effect<void, AgentServiceError> =>
  Effect.try({
    try: () => JSON.stringify(data, null, 2),
    catch: (error): AgentServiceError =>
      new AgentPersistenceError({
        message: `Failed to stringify agent config: ${
          error instanceof Error ? error.message : String(error)
        }`,
        operation: "save",
        cause: error,
      }),
  }).pipe(
    Effect.flatMap((content) =>
      fs.writeFileString(filePath, content).pipe(
        Effect.mapError(
          (error): AgentServiceError =>
            new AgentPersistenceError({
              message: `Failed to write agent config: ${
                error instanceof Error ? error.message : String(error)
              }`,
              operation: "save",
              cause: error,
            })
        )
      )
    )
  );
