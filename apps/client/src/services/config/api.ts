import {
  ConfigLoadError,
  ConfigSaveError,
  ConfigValidationError,
} from "@/components/app/errors";
import type { AppDomainModel } from "@domain/index";
import { Effect, Ref } from "effect";
import type {
  AppConfigValidationResult,
  ConfigLoadOptions,
  ConfigMergeOptions,
  ConfigSaveOptions,
  ConfigValidationOptions,
} from "./types";

export interface ConfigServiceApi {
  readonly getConfig: () => Effect.Effect<AppDomainModel, ConfigLoadError>;
  readonly saveConfig: (
    config: AppDomainModel
  ) => Effect.Effect<void, ConfigSaveError>;
  readonly state: Ref.Ref<{
    readonly currentConfig: AppDomainModel | null;
    readonly isLoaded: boolean;
    readonly lastModified: Date | null;
  }>;
  readonly validateConfig: (
    config: unknown,
    options?: ConfigValidationOptions
  ) => Effect.Effect<AppConfigValidationResult, ConfigValidationError>;

  // Additional methods expected by tests
  readonly loadConfig: (
    path: string,
    options?: ConfigLoadOptions
  ) => Effect.Effect<AppDomainModel, ConfigLoadError>;

  readonly createDefaultConfig: (
    overrides?: Partial<AppDomainModel>
  ) => Effect.Effect<AppDomainModel, never>;

  readonly mergeConfigs: (
    config1: AppDomainModel,
    config2: AppDomainModel,
    options?: ConfigMergeOptions
  ) => Effect.Effect<AppDomainModel, ConfigValidationError>;

  readonly setConfigPath: (path: string) => Effect.Effect<void, never>;
  readonly getConfigPath: () => Effect.Effect<string, never>;

  readonly reloadConfig: () => Effect.Effect<AppDomainModel, ConfigLoadError>;

  readonly checkConfigHealth: (
    config: AppDomainModel
  ) => Effect.Effect<{ isHealthy: boolean; issues: string[] }, never>;

  readonly repairConfig: (
    config: AppDomainModel
  ) => Effect.Effect<AppDomainModel, ConfigValidationError>;

  readonly exportConfig: (
    config: AppDomainModel,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<string, ConfigSaveError>;

  readonly importConfig: (
    content: string,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<AppDomainModel, ConfigLoadError>;

  readonly resetToDefaults: () => Effect.Effect<AppDomainModel, never>;

  readonly getConfigMetadata: (
    config: AppDomainModel
  ) => Effect.Effect<
    { version: string; size: number; lastModified: Date },
    never
  >;

  readonly detectConfigVersion: (
    config: unknown
  ) => Effect.Effect<string, never>;

  readonly migrateConfig: (
    config: unknown,
    targetVersion: string
  ) => Effect.Effect<AppDomainModel, ConfigValidationError>;
}
