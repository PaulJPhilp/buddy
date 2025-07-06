import { Effect, Schema } from "effect";
import { UrlService } from "../url";
import type { AppServiceApi } from "./api";
import { ChatAppConfig, ChatAppConfigSchema } from "./types";

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    const config = yield* UrlService;

    const getById = (id: string) =>
      Effect.withSpan("AppService/getById")(
        Effect.gen(function* () {
          const path = `/static/urls/chatapps/${id}.json`;
          const response = yield* Effect.tryPromise(() => fetch(path));

          if (!response.ok) {
            return yield* Effect.fail(new Error(`Failed to fetch ${path}`));
          }

          const data = yield* Effect.tryPromise(() => response.json());
          return yield* Schema.decode(ChatAppConfigSchema)(data);
        })
      );

    const getAll = () =>
      Effect.withSpan("AppService/getAll")(
        Effect.gen(function* () {
          const chatAppFiles = [
            "literature.json",
            "science.json",
            "science-fiction.json",
            "building-ai.json",
            "learning-ai.json",
            "social-media.json",
            "tasks.json",
            "email.json",
          ];

          const loadConfig = (filename: string) =>
            Effect.gen(function* () {
              const path = `/static/urls/chatapps/${filename}`;
              const response = yield* Effect.tryPromise(() => fetch(path));

              if (!response.ok) {
                return null;
              }

              const data = yield* Effect.tryPromise(() => response.json());
              const config = yield* Schema.decode(ChatAppConfigSchema)(data);
              return config;
            }).pipe(Effect.catchAll(() => Effect.succeed(null)));

          const results = yield* Effect.all(chatAppFiles.map(loadConfig), {
            concurrency: "unbounded",
          });

          return results.filter(
            (config): config is ChatAppConfig => config !== null
          );
        })
      );

    const create = (app: ChatAppConfig) => Effect.succeed(undefined);

    const update = (id: string, patch: Partial<ChatAppConfig>) =>
      Effect.succeed(undefined);

    const deleteConfig = (id: string) => Effect.succeed(undefined);

    return {
      getAll,
      getById,
      create,
      update,
      delete: deleteConfig,
    } satisfies AppServiceApi;
  }),
  dependencies: [UrlService.Default],
}) {}
