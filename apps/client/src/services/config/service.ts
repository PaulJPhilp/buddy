import {
  ConfigLoadError,
  ConfigParseError,
  ConfigSaveError,
  ConfigValidationError,
} from "@/components/app/errors";
import { Workspace } from "@/managers/workspace";
import type { AppDomainModel } from "@domain/index";
import { Effect, Layer, Ref, Schema } from "effect";
import type { ConfigServiceApi } from "./api";
import { createDefaultAppConfig } from "./types";

const CONFIG_KEY = "buddy-app-config";

// --- Schema ---
const AppConfigSchema = Schema.Struct({
  version: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  app: Schema.Struct({
    name: Schema.String,
    version: Schema.String,
    description: Schema.String.pipe(Schema.optional),
    author: Schema.String.pipe(Schema.optional),
    license: Schema.String.pipe(Schema.optional),
    homepage: Schema.String.pipe(Schema.optional),
    repository: Schema.String.pipe(Schema.optional),
    environment: Schema.Literal("development", "production", "test").pipe(
      Schema.optional
    ),
    locale: Schema.String.pipe(Schema.optional),
    timezone: Schema.String.pipe(Schema.optional),
  }),
  workspaces: Schema.mutable(Schema.Array(Workspace)),
  chatapps: Schema.mutable(Schema.Array(Schema.Unknown)),
  agents: Schema.mutable(Schema.Array(Schema.Unknown)),
  settings: Schema.mutable(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// --- State ---
interface ConfigState {
  readonly currentConfig: AppDomainModel | null;
  readonly isLoaded: boolean;
  readonly lastModified: Date | null;
}

function createDefaultState(): ConfigState {
  return {
    currentConfig: null,
    isLoaded: false,
    lastModified: null,
  };
}

// --- Service ---
export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    scoped: Effect.gen(function* () {
      const stateRef = yield* Ref.make(createDefaultState());

      const getConfig = () =>
        Effect.gen(function* () {
          const configJson = yield* Effect.try({
            try: () => {
              if (typeof window === "undefined") return null;
              return localStorage.getItem(CONFIG_KEY);
            },
            catch: (error) =>
              new ConfigLoadError({
                message: "Failed to load config from localStorage",
                cause: error as Error,
              }),
          });

          if (!configJson) {
            const defaultConfig = createDefaultAppConfig();
            yield* saveConfig(defaultConfig).pipe(
              Effect.catchAll(() => Effect.void)
            );
            return defaultConfig;
          }

          const parsedConfig = yield* Effect.try({
            try: () => JSON.parse(configJson),
            catch: (error) =>
              new ConfigParseError({
                message: "Failed to parse config JSON",
                cause: error as Error,
              }),
          });

          const validatedConfig = yield* Schema.decodeUnknown(AppConfigSchema)(
            parsedConfig
          ).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Failed to validate config schema",
                  cause: error,
                })
            )
          );

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            currentConfig: validatedConfig as AppDomainModel,
            isLoaded: true,
            lastModified: new Date(),
          }));

          return validatedConfig as AppDomainModel;
        }).pipe(
          Effect.mapError(
            (error) =>
              new ConfigLoadError({
                message: "Failed to get config",
                cause: error,
              })
          )
        );

      const saveConfig = (config: AppDomainModel) =>
        Effect.gen(function* () {
          yield* Effect.try({
            try: () => {
              if (typeof window === "undefined") return;
              localStorage.setItem(CONFIG_KEY, JSON.stringify(config, null, 2));
            },
            catch: (error) =>
              new ConfigSaveError({
                message: "Failed to save config to localStorage",
                cause: error as Error,
              }),
          });

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            currentConfig: config,
            lastModified: new Date(),
          }));
        });

      const validateConfig = (config: unknown) =>
        Schema.decodeUnknown(AppConfigSchema)(config).pipe(
          Effect.mapError(
            (error) =>
              new ConfigValidationError({
                message: "Config validation failed",
                cause: error,
              })
          ),
          Effect.map((config) => config as AppDomainModel)
        );

      return {
        getConfig,
        saveConfig,
        validateConfig,
        state: stateRef,
      };
    }),
    dependencies: [],
  }
) {}
