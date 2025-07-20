import { ConfigError } from "@buddy/config/errors";
import { AppConfigServiceApi } from "@buddy/config/services/app-config";
import { AppConfig } from "@buddy/config/types";
import { Effect } from "effect";

export class AppConfigClientService extends Effect.Service<AppConfigServiceApi>()(
  "AppConfigClientService",
  {
    effect: Effect.succeed({
      getAppConfig: () =>
        Effect.tryPromise({
          try: () => fetch("/api/app-config").then((res) => res.json()),
          catch: (e) =>
            new ConfigError({
              message: "Failed to fetch app config",
              cause: e as Error,
            }),
        }),
      updateAppConfig: (updates: Partial<AppConfig>) =>
        Effect.tryPromise({
          try: () =>
            fetch("/api/app-config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            }).then((res) => res.json()),
          catch: (e) =>
            new ConfigError({
              message: "Failed to update app config",
              cause: e as Error,
            }),
        }),
    } satisfies AppConfigServiceApi),
    dependencies: [],
  }
) {}
