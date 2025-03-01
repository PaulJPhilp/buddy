import { Prompt, PromptVoice, ServerApi } from "@api/core";
import { HttpApiBuilder } from "@effect/platform";
import { SqlClient } from "@effect/sql/SqlClient";
import { Effect, Layer, Schema } from "effect";
import { DatabaseLive } from "./database";
import {
  CreationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  formatErrorResponse,
  handleError,
} from "./errors";
import { ConsoleLoggerLive, LoggerService, log } from "./logging";

export const PromptVoiceGroupLive = HttpApiBuilder.group(
  ServerApi,
  "prompt-voice",
  (handlers) =>
    handlers

      // Add createPromptVoice handler
      .handle("createPromptVoice", ({ payload }) =>
        Effect.gen(function* () {
          const promptVoice = payload as PromptVoice;
          yield* log.info("Creating new prompt voice", {
            name: promptVoice.name,
            promptId: promptVoice.prompt.id,
          });

          const sql = yield* SqlClient;

          // First check if the associated prompt exists
          yield* log.info("Checking if associated prompt exists", {
            promptId: promptVoice.prompt.id,
          });
          const promptExists = yield* Effect.tryPromise({
            try: async () => sql<{ exists: boolean }>`
						SELECT EXISTS(SELECT 1 FROM prompts WHERE id = ${promptVoice.prompt.id}) as exists
					`,
            catch: async (error) =>
              new DatabaseError({
                message: "Failed to check if prompt exists",
                operation: "prompt existence check",
                cause: error,
              }),
          });

          if (!(yield* promptExists)[0]?.exists) {
            yield* log.warn("Associated prompt does not exist", {
              promptId: promptVoice.prompt.id,
            });
            return yield* Effect.fail(
              new ValidationError({
                message: `Associated prompt with ID ${promptVoice.prompt.id} does not exist`,
                field: "prompt.id",
                value: promptVoice.prompt.id,
              }),
            );
          }

          yield* log.info("Inserting new prompt voice");
          const result = yield* Effect.tryPromise({
            try: async () => sql<PromptVoice>`
						INSERT INTO prompt_voices (name, type, label, key, prompt_id)
						VALUES (
							${promptVoice.name}, 
							${promptVoice.type}, 
							${promptVoice.label}, 
							${promptVoice.key}, 
							${promptVoice.prompt.id}
						)
						RETURNING 
							id, 
							name, 
							type, 
							label, 
							key, 
							prompt_id,
							description,
							created_at,
							updated_at
					`,
            catch: async (error) =>
              new CreationError({
                entityType: "PromptVoice",
                message: "Failed to create prompt voice",
                cause: error,
              }),
          });

          if ((yield* result).length === 0) {
            yield* log.warn("No rows returned after prompt voice creation");
            return yield* Effect.fail(
              new CreationError({
                entityType: "PromptVoice",
                message: "Failed to create prompt voice - no rows returned",
              }),
            );
          }

          // Get the associated prompt
          yield* log.info("Retrieving associated prompt data", {
            promptId: promptVoice.prompt.id,
          });
          const defaultLocale = yield* Effect.tryPromise({
            try: async () => sql<Prompt>`
						SELECT id, name, type, prompt, tags, created_at, updated_at
						FROM prompts 
						WHERE id = ${promptVoice.prompt.id}
					`,
            catch: async (error) =>
              new DatabaseError({
                message: `Failed to retrieve associated prompt data`,
                operation: "prompt retrieval",
                cause: error,
              }),
          });

          const promptResult = yield* defaultLocale;
          if (promptResult.length === 0 || promptResult[0] === undefined) {
            yield* log.warn("Associated prompt not found after creation", {
              promptId: promptVoice.prompt.id,
            });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "Prompt",
                entityId: String(promptVoice.prompt.id),
                message: `Associated prompt not found`,
              }),
            );
          }

          const row = (yield* result)[0];
          if (row === undefined) {
            yield* log.warn("Prompt voice result row is undefined");
            return yield* Effect.fail(
              new CreationError({
                entityType: "PromptVoice",
                message: "Failed to create prompt voice - undefined result row",
              }),
            );
          }

          yield* log.info("Prompt voice created successfully", { id: row.id });
          return Schema.decodeSync(PromptVoice)({
            id: row.id,
            name: row.name,
            description: row.description || "No description available",
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
            type: row.type,
            label: row.label,
            key: row.key,
            prompt: {
              id: promptResult[0].id,
              name: promptResult[0].name,
              type: promptResult[0].type,
              prompt: promptResult[0].prompt,
              tags: promptResult[0].tags,
              created_at: promptResult[0].created_at,
              updated_at: promptResult[0].updated_at,
            },
          });
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "PromptVoice", "creation"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to create prompt voice", error);
            return formatErrorResponse(error);
          }),
        ),
      )

      // Add getPromptVoice handler
      .handle("getPromptVoice", ({ payload }) =>
        Effect.gen(function* () {
          const promptVoice = payload as PromptVoice;
          yield* log.info("Retrieving prompt voice", { id: promptVoice.id });

          const sql = yield* SqlClient;

          const data = yield* Effect.tryPromise({
            try: async () => sql<any>`
						SELECT 
							pv.id,
							pv.name,
							pv.type,
							pv.label,
							pv.key,
							pv.description,
							pv.created_at,
							pv.updated_at,
							p.id as prompt_id,
							p.name as prompt_name,
							p.type as prompt_type,
							p.prompt as prompt_text,
							p.tags as prompt_tags,
							p.created_at as prompt_created_at,
							p.updated_at as prompt_updated_at
						FROM prompt_voices pv
						JOIN prompts p ON p.id = pv.prompt_id
						WHERE pv.id = ${promptVoice.id}
					`,
            catch: async (error) =>
              new DatabaseError({
                message: "Failed to retrieve prompt voice",
                operation: "prompt voice retrieval",
                cause: error,
              }),
          });

          const result = yield* data;

          if (result.length === 0 || result[0] === undefined) {
            yield* log.warn("Prompt voice not found", { id: promptVoice.id });
            return yield* Effect.fail(
              new NotFoundError({
                entityType: "PromptVoice",
                entityId: String(promptVoice.id),
                message: `PromptVoice with ID ${promptVoice.id} not found`,
              }),
            );
          }

          const row = result[0];
          yield* log.info("Prompt voice found successfully", {
            id: promptVoice.id,
          });
          return Schema.decodeSync(PromptVoice)({
            id: row.id,
            name: row.name,
            description: row.description || "No description available",
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
            type: row.type,
            label: row.label,
            key: row.key,
            prompt: {
              id: row.prompt_id,
              name: row.prompt_name,
              type: row.prompt_type,
              prompt: row.prompt_text,
              tags: row.prompt_tags,
              created_at: row.prompt_created_at,
              updated_at: row.prompt_updated_at,
            },
          });
        }).pipe(
          Effect.mapError((error) =>
            handleError(Effect.fail(error), "PromptVoice", "retrieval"),
          ),
          Effect.mapError((error) => {
            log.error("Failed to retrieve prompt voice", error);
            return formatErrorResponse(error);
          }),
        ),
      ),
).pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(Layer.succeed(LoggerService, ConsoleLoggerLive)),
);
