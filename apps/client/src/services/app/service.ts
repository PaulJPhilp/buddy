import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { AppServiceApi, AppServiceError } from "./api";
import { AppConfigLoadError } from "./errors";

/**
 * A helper function to fetch and parse a single config file.
 */
function fetchConfig(
  filename: string,
): Effect.Effect<ChatAppConfig, AppServiceError> {
  return Effect.tryPromise({
    try: () => fetch(`/configs/${filename}`),
    catch: (error) =>
      new AppConfigLoadError({
        message: `Network error fetching ${filename}`,
        cause: error,
      }),
  }).pipe(
    Effect.flatMap((response) => {
      if (!response.ok) {
        return Effect.fail(
          new AppConfigLoadError({
            message: `Failed to fetch ${filename}: ${response.statusText}`,
          }),
        );
      }
      return Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new AppConfigLoadError({
            message: `Error parsing JSON for ${filename}`,
            cause: error,
          }),
      });
    }),
    Effect.map(
      (configData: any): ChatAppConfig => ({
        id: configData.id,
        name: configData.name,
        agentId: configData.agentId,
        description: configData.description || "",
        theme: configData.style || {},
        version: configData.version || "1.0.0",
        icon: configData.icon || "🤖",
      }),
    ),
    Effect.tap((config) => Effect.logDebug(`✅ Loaded config: ${config.name}`)),
    Effect.catchTag("AppConfigLoadError", (error) => {
      console.warn(`⚠️ Could not load config file: ${filename}`, error.message);
      return Effect.succeed(null);
    }),
  );
}

/**
 * AppService that loads ChatApp configurations from public/configs directory
 */
export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  effect: Effect.succeed({
    getAll: () => {
      const configFiles = [
        "simple-chat.json",
        "pink-buddy.json",
        "slate-buddy.json",
        "teal-buddy.json",
      ];

      return Effect.all(configFiles.map(fetchConfig)).pipe(
        Effect.map((configs) =>
          configs.filter((c): c is ChatAppConfig => c !== null),
        ),
        Effect.tap((configs) =>
          Effect.logInfo(
            `🔧 AppService: Loaded ${configs.length} configurations`,
          ),
        ),
        Effect.catchAll((error) => {
          console.error(
            "🔧 AppService: A critical error occurred in getAll():",
            error,
          );
          return Effect.succeed([]);
        }),
      );
    },

    getById: (id: string) =>
      Effect.serviceFunctionEffect(AppService, (self) => self.getAll())().pipe(
        Effect.map((configs) => configs.find((c) => c.id === id)),
      ),

    create: (app: ChatAppConfig) => Effect.succeed(undefined),

    update: (id: string, patch: Partial<ChatAppConfig>) =>
      Effect.succeed(undefined),

    delete: (id: string) => Effect.succeed(undefined),
  }),
  dependencies: [],
}) {}
