import type { AppConfig } from "@/features/application/types/AppConfig";
import { ConfigService } from "@/services/config/service";
import { Effect, Layer, Ref, Schedule } from "effect";

import {
  ConfigLoadError,
  ConfigParseError,
  ConfigSaveError,
  ConfigValidationError,
} from "./errors";
import { AppConfigSchema } from "@/features/application/types/AppConfig";
import type { ApplicationManagerApi } from "./api";
import type { AppComponentState, AppDomainModel } from "./types";
import { createDefaultAppState } from "./types";

export class ApplicationManager extends Effect.Service<ApplicationManagerApi>()(
  "ApplicationManager",
  {
    effect: Effect.gen(function* () {
      const configService = yield* ConfigService;
      const appState = yield* Ref.make<AppComponentState>(createDefaultAppState());

      const setAppState = (updates: Partial<AppComponentState>) =>
        Ref.update(appState, (state) => ({ ...state, ...updates }));

      const loadConfig = (path?: string): Effect.Effect<AppDomainModel, ConfigLoadError | ConfigParseError | ConfigValidationError | Error> =>
        Effect.gen(function* () {
          yield* setAppState({ isLoading: true, error: null });
          let loadedConfig: AppDomainModel | null = null;

          if (path) {
            // Load from a specific path
            try {
              const configPath = `${path}`;
              const config = yield* configService.loadConfig(configPath);
              loadedConfig = config;
              yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
              return config; // Return the loaded config
            } catch (e) {
              yield* setAppState({ error: `Failed to load config from ${path}`, isLoading: false });
              if (e instanceof ConfigLoadError) {
                return yield* Effect.fail(new ConfigLoadError({ message: `Failed to load config from ${path}`, configPath: path, cause: e.cause }));
              } else if (e instanceof ConfigParseError) {
                return yield* Effect.fail(new ConfigParseError({ message: e.message, cause: e.cause }));
              } else if (e instanceof ConfigValidationError) {
                return yield* Effect.fail(new ConfigValidationError({ message: e.message, cause: e.cause }));
              }
              return yield* Effect.fail(new Error(`Unknown error loading config: ${e}`));
            }
          } else {
            // Attempt to load default persisted config
            try {
              const persistedConfig = yield* configService.loadConfig("appConfig");
              loadedConfig = persistedConfig;
              yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
              return persistedConfig;
            } catch (e) {
              // If no persisted config, try loading the default bootstrap config
              console.warn("No persisted app config found, trying default bootstrap.");
              const defaultBootstrapPath = "/public/static/configs/default-buddy-bootstrap.json";
              try {
                const defaultConfig = yield* configService.loadConfig(defaultBootstrapPath);
                loadedConfig = defaultConfig;
                yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
                return defaultConfig;
              } catch (bootstrapError) {
                yield* setAppState({ error: `Failed to load default bootstrap config: ${bootstrapError}`, isLoading: false });
                return yield* Effect.fail(new ConfigLoadError({ message: `Failed to load default bootstrap config`, configPath: defaultBootstrapPath, cause: bootstrapError instanceof Error ? bootstrapError : new Error(String(bootstrapError)) }));
              }
            }
          }
        }).pipe(Effect.tapError((e) => Effect.logError(`Failed to load application config: ${e}`)), Effect.scoped);

      const getState = (): Effect.Effect<AppComponentState, never> =>
        Ref.get(appState);

      const getAppConfig = (): Effect.Effect<AppDomainModel | null, never> =>
        Effect.map(Ref.get(appState), (state) => state.appConfig);

      const saveAppConfig = (config: AppDomainModel): Effect.Effect<AppDomainModel, ConfigSaveError | Error> =>
        Effect.gen(function* () {
          yield* setAppState({ isLoading: true, error: null });
          try {
            yield* configService.saveConfig(config);
            yield* setAppState({ appConfig: config, isLoading: false, error: null });
            return config;
          } catch (e) {
            yield* setAppState({ error: `Failed to save app config: ${e}`, isLoading: false });
            if (e instanceof ConfigSaveError) {
              return yield* Effect.fail(new ConfigSaveError({ message: e.message, cause: e.cause }));
            }
            return yield* Effect.fail(new Error(`Unknown error saving config: ${e}`));
          }
        }).pipe(Effect.tapError((e) => Effect.logError(`Failed to save application config: ${e}`)));

      return {
        loadConfig,
        getAppConfig,
        getState,
        saveAppConfig,
      } satisfies ApplicationManagerApi;
    }),
    dependencies: [ConfigService.Default],
  }
) { }

export const ApplicationManagerLive = Layer.effect(
  ApplicationManager,
  ApplicationManager.pipe(
    Effect.tap((manager) =>
      manager.loadConfig().pipe(
        Effect.catchAll((error) =>
          Effect.logError(`Initial App config load failed: ${error}`)
        )
      )
    )
  )
);
