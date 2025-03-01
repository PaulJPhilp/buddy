import { Prompt, ServerApi } from "@api/core";
import { HttpApiBuilder } from "@effect/platform";
import { SqlResolver } from "@effect/sql";
import { SqlClient } from "@effect/sql/SqlClient";
import { Effect, Layer, Schema } from "effect";
import { DatabaseLive } from "./database";
import { NotFoundError, formatErrorResponse, handleError } from "./errors";
import { ConsoleLoggerLive, LoggerService, log, logEffect } from "./logging";

export const PromptGroupLive = HttpApiBuilder.group(
  ServerApi,
  "prompt",
  (handlers) =>
    handlers
      .handle("createPrompt", ({ payload }) =>
        Effect.gen(function* () {
          const prompt = payload as Prompt;
          yield* log.info("Creating new prompt", {
            name: prompt.name,
            type: prompt.type,
          });

          const sql = yield* SqlClient;

          const InsertPrompt = yield* SqlResolver.ordered("InsertPrompt", {
            Request: Prompt.pipe(Schema.omit("id", "created_at")),
            Result: Prompt,
            execute: () =>
              sql<Prompt>`
							INSERT INTO prompts (name, type, prompt, tags, updated_at) 
							VALUES (
								${prompt.name}, 
								${prompt.type}, 
								${prompt.prompt}, 
								${JSON.stringify(prompt.tags)},
								${prompt.updated_at}
							)
							RETURNING id, name, type, prompt, tags, created_at, updated_at
							`,
          });

          const result = yield* logEffect.after(
            InsertPrompt.execute({
              name: prompt.name,
              type: prompt.type,
              prompt: prompt.prompt,
              tags: prompt.tags,
              updated_at: prompt.updated_at,
            }),
            "Prompt created successfully",
            true,
          );

          return result;
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "Prompt", "creation"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to create prompt", error);
            return formatErrorResponse(error);
          }),
        ),
      )

      // Add the getPrompt handler
      .handle("getPrompt", ({ payload }) =>
        Effect.gen(function* () {
          const prompt = payload as Prompt;
          yield* log.info("Retrieving prompt", { id: prompt.id });

          const sql = yield* SqlClient;

          // Execute the select query directly with the SQL client
          const result = yield* logEffect.after(
            sql<Prompt>`SELECT id, name, type, prompt, tags, created_at, updated_at FROM prompts WHERE id=${prompt.id}`,
            "Retrieved prompt data from database",
          );

          if (result.length === 0) {
            yield* log.warn(`Prompt not found`, { id: prompt.id });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "Prompt",
                entityId: String(prompt.id),
                message: `Prompt with ID ${prompt.id} not found`,
              }),
            );
          }

          const row = result[0];
          if (row === undefined) {
            yield* log.warn(`Prompt result undefined`, { id: prompt.id });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "Prompt",
                entityId: String(prompt.id),
                message: `Prompt with ID ${prompt.id} not found`,
              }),
            );
          }

          // Return the found Prompt
          yield* log.info("Prompt found successfully", { id: prompt.id });
          return Schema.decodeSync(Prompt)({
            id: row.id,
            name: row.name,
            type: row.type,
            prompt: row.prompt,
            tags: row.tags,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "Prompt", "retrieval"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to retrieve prompt", error);
            return formatErrorResponse(error);
          }),
        ),
      ),
).pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(Layer.succeed(LoggerService, ConsoleLoggerLive)),
);
