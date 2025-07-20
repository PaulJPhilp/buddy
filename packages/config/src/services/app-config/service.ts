import { Effect } from "effect";
import { ConfigError } from "../../errors";
import { AppConfig, StorageData } from "../../types";
import { validateAppConfig, validateStorage } from "../../validation";
import { StorageService } from "../storage";
import { AppConfigServiceApi } from "./api";

export class AppConfigService extends Effect.Service<AppConfigServiceApi>()(
  "AppConfigService",
  {
    effect: Effect.gen(function* () {
      const storage = yield* StorageService;

      const readAndValidate = (errorMessage: string) =>
        storage.read().pipe(
          Effect.mapError(
            (error) => new ConfigError({ message: errorMessage, cause: error })
          ),
          Effect.flatMap(validateStorage),
          Effect.mapError(
            (error) => new ConfigError({ message: errorMessage, cause: error })
          )
        );

      return {
        getAppConfig: () =>
          readAndValidate("Failed to get app config").pipe(
            Effect.map((data) => data.appConfig)
          ),

        updateAppConfig: (updates: Partial<AppConfig>) =>
          Effect.gen(function* () {
            const data = yield* readAndValidate("Failed to update app config");
            const updatedAppConfig: AppConfig = {
              ...data.appConfig,
              ...updates,
            };
            const validAppConfig = yield* validateAppConfig(
              updatedAppConfig
            ).pipe(
              Effect.mapError(
                (error) =>
                  new ConfigError({
                    message: "Failed to validate app config",
                    cause: error,
                  })
              )
            );
            const updatedData: StorageData = {
              ...data,
              appConfig: validAppConfig,
            };
            const finalValidData = yield* validateStorage(updatedData).pipe(
              Effect.mapError(
                (error) =>
                  new ConfigError({
                    message: "Failed to validate storage",
                    cause: error,
                  })
              )
            );
            yield* storage.write(finalValidData).pipe(
              Effect.mapError(
                (error) =>
                  new ConfigError({
                    message: "Failed to save app config update",
                    cause: error,
                  })
              )
            );
            return validAppConfig;
          }),
      } satisfies AppConfigServiceApi;
    }),
    dependencies: [StorageService.Default],
  }
) {}
