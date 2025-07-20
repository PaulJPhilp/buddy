import type { AppConfig } from "@/features/application/types/AppConfig";
import { ConfigService } from "@/services/config/service";
import { Effect, Layer, Ref, Schedule } from "effect";
import { Schema as S } from "effect";
import { Tag } from "effect/Context";
import { FileSystem } from "effect/FileSystem";
import { flow, pipe } from "effect/Function";
import {
  ConfigLoadError,
  ConfigParseError,
  ConfigSaveError,
  ConfigValidationError,
} from "./errors";
import {
  AppConfigSchema,
  AppPersistedConfigSchema,
} from "./types";

interface AppState {
  readonly appConfig: AppConfig | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isConfigLoaded: boolean;
}

export class ApplicationManager extends Effect.Service<AppConfig>()(
  "ApplicationManager",
  {
    effect: Effect.gen(function* () {
      const configService = yield* ConfigService; // Assuming ConfigService is available
      const appState = yield* Ref.make<AppState>({
        appConfig: null,
        isLoading: false,
        error: null,
        isConfigLoaded: false,
      });

      const setAppState = (updates: Partial<AppState>) =>
        Ref.update(appState, (state) => ({ ...state, ...updates }));

      const loadConfig = (path?: string) =>
        Effect.gen(function* () {
          yield* setAppState({ isLoading: true, error: null });
          let loadedConfig: AppConfig | null = null;

          if (path) {
            // Load from a specific path
            try {
              const configPath = `${path}`;
              const config = yield* configService.loadConfig<AppConfig>(
                configPath,
                AppConfigSchema
              );
              loadedConfig = config;
              yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
              return config; // Return the loaded config
            } catch (e) {
              yield* setAppState({ error: `Failed to load config from ${path}`, isLoading: false });
              if (e instanceof ConfigLoadError) {
                return yield* Effect.fail(new ConfigLoadError({ path, cause: e.cause }));
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
              const persistedConfig = yield* configService.loadConfig<AppConfig>(
                "appConfig",
                AppConfigSchema
              );
              loadedConfig = persistedConfig;
              yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
              return persistedConfig;
            } catch (e) {
              // If no persisted config, try loading the default bootstrap config
              console.warn("No persisted app config found, trying default bootstrap.");
              const defaultBootstrapPath = "/public/static/configs/default-buddy-bootstrap.json";
              try {
                const defaultConfig = yield* configService.loadConfig<AppConfig>(
                  defaultBootstrapPath,
                  AppConfigSchema
                );
                loadedConfig = defaultConfig;
                yield* setAppState({ appConfig: loadedConfig, isConfigLoaded: true });
                return defaultConfig;
              } catch (bootstrapError) {
                yield* setAppState({ error: `Failed to load default bootstrap config: ${bootstrapError}`, isLoading: false });
                return yield* Effect.fail(new ConfigLoadError({ path: defaultBootstrapPath, cause: bootstrapError instanceof Error ? bootstrapError : new Error(String(bootstrapError)) }));
              }
            }
          }
        }).pipe(Effect.tapError((e) => Effect.logError(`Failed to load application config: ${e}`)), Effect.scoped);

      const getAppState = Ref.get(appState);

      const getAppConfig = Effect.map(getAppState, (state) => state.appConfig);

      const saveAppConfig = (config: AppConfig) =>
        Effect.gen(function* () {
          yield* setAppState({ isLoading: true, error: null });
          try {
            yield* configService.saveConfig("appConfig", config, AppConfigSchema);
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
        getState: getAppState,
        saveAppConfig,
      };
    }),
    dependencies: [ConfigService],
  }
);

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
