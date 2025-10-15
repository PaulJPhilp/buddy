import {
  ConfigLoadError,
  ConfigParseError,
  ConfigSaveError,
  ConfigValidationError,
} from "@/features/application/manager/errors";
import type { AppConfig } from "@/features/application/types/AppConfig"; // Updated path
import type {
  ConfigLoadOptions,
  ConfigMergeOptions,
  ConfigSaveOptions,
  ConfigValidationOptions,
} from "@/features/application/types/config/config-options"; // Updated path
import type { AppConfigValidationResult } from "@/features/application/types/validation/app-config-validation"; // Updated path
import { Effect, Ref } from "effect";

export interface ConfigServiceApi {
  readonly getConfig: () => Effect.Effect<AppConfig, ConfigLoadError>;
  readonly saveConfig: (
    config: AppConfig
  ) => Effect.Effect<void, ConfigSaveError>;
  readonly state: Ref.Ref<{
    readonly currentConfig: AppConfig | null;
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
  ) => Effect.Effect<AppConfig, ConfigLoadError>;

  readonly createDefaultConfig: (
    overrides?: Partial<AppConfig>
  ) => Effect.Effect<AppConfig, never>;

  readonly mergeConfigs: (
    config1: AppConfig,
    config2: AppConfig,
    options?: ConfigMergeOptions
  ) => Effect.Effect<AppConfig, ConfigValidationError>;

  readonly setConfigPath: (path: string) => Effect.Effect<void, never>;
  readonly getConfigPath: () => Effect.Effect<string, never>;

  readonly reloadConfig: () => Effect.Effect<AppConfig, ConfigLoadError>;

  readonly checkConfigHealth: (
    config: AppConfig
  ) => Effect.Effect<{ isHealthy: boolean; issues: string[] }, never>;

  readonly repairConfig: (
    config: AppConfig
  ) => Effect.Effect<AppConfig, ConfigValidationError>;

  readonly exportConfig: (
    config: AppConfig,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<string, ConfigSaveError>;

  readonly importConfig: (
    content: string,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<AppConfig, ConfigLoadError>;

  readonly resetToDefaults: () => Effect.Effect<AppConfig, never>;

  readonly getConfigMetadata: (
    config: AppConfig
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
  ) => Effect.Effect<AppConfig, ConfigValidationError>;
}
