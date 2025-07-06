import { Effect } from "effect";
import type { ConfigServiceError } from "./errors";
import type {
  AppConfigValidationResult,
  AppDomainModel,
  ConfigLoadOptions,
  ConfigMergeOptions,
  ConfigSaveOptions,
  ConfigTemplate,
  ConfigValidationOptions,
  ConfigWatchOptions,
} from "./types";

export interface ConfigServiceApi {
  // Core configuration loading
  readonly loadConfig: (
    configPath?: string,
    options?: ConfigLoadOptions
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  readonly saveConfig: (
    config: AppDomainModel,
    configPath?: string,
    options?: ConfigSaveOptions
  ) => Effect.Effect<void, ConfigServiceError>;

  readonly reloadConfig: () => Effect.Effect<
    AppDomainModel,
    ConfigServiceError
  >;

  // Configuration validation
  readonly validateConfig: (
    config: unknown,
    options?: ConfigValidationOptions
  ) => Effect.Effect<AppConfigValidationResult, ConfigServiceError>;

  readonly validateConfigFile: (
    configPath: string
  ) => Effect.Effect<AppConfigValidationResult, ConfigServiceError>;

  // Configuration watching
  readonly watchConfig: (
    configPath: string,
    options?: ConfigWatchOptions
  ) => Effect.Effect<void, ConfigServiceError>;

  readonly stopWatching: (
    configPath: string
  ) => Effect.Effect<void, ConfigServiceError>;

  // Configuration templates
  readonly createDefaultConfig: (
    options?: Partial<AppDomainModel>
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  readonly createConfigFromTemplate: (
    template: ConfigTemplate,
    options?: ConfigMergeOptions
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  readonly getAvailableTemplates: () => Effect.Effect<
    ConfigTemplate[],
    ConfigServiceError
  >;

  // Configuration merging
  readonly mergeConfigs: (
    baseConfig: AppDomainModel,
    overrideConfig: Partial<AppDomainModel>,
    options?: ConfigMergeOptions
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  readonly mergeConfigFiles: (
    configPaths: string[],
    options?: ConfigMergeOptions
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  // Configuration utilities
  readonly getConfigPath: () => Effect.Effect<
    string | null,
    ConfigServiceError
  >;

  readonly setConfigPath: (
    configPath: string
  ) => Effect.Effect<void, ConfigServiceError>;

  readonly getConfigMetadata: (configPath?: string) => Effect.Effect<
    {
      path: string;
      lastModified: Date;
      size: number;
      isValid: boolean;
    },
    ConfigServiceError
  >;

  // Configuration backup and restore
  readonly backupConfig: (
    configPath?: string,
    backupPath?: string
  ) => Effect.Effect<string, ConfigServiceError>;

  readonly restoreConfig: (
    backupPath: string,
    configPath?: string
  ) => Effect.Effect<void, ConfigServiceError>;

  readonly listBackups: (
    configPath?: string
  ) => Effect.Effect<string[], ConfigServiceError>;

  // Configuration migration
  readonly migrateConfig: (
    config: unknown,
    fromVersion: string,
    toVersion: string
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  readonly detectConfigVersion: (
    config: unknown
  ) => Effect.Effect<string, ConfigServiceError>;

  // Configuration export/import
  readonly exportConfig: (
    config: AppDomainModel,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<string, ConfigServiceError>;

  readonly importConfig: (
    content: string,
    format: "json" | "yaml" | "toml"
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  // Configuration health
  readonly checkConfigHealth: (configPath?: string) => Effect.Effect<
    {
      isHealthy: boolean;
      issues: string[];
      recommendations: string[];
    },
    ConfigServiceError
  >;

  readonly repairConfig: (
    configPath?: string
  ) => Effect.Effect<AppDomainModel, ConfigServiceError>;

  // Configuration reset
  readonly resetConfig: (
    configPath?: string
  ) => Effect.Effect<void, ConfigServiceError>;

  readonly resetToDefaults: () => Effect.Effect<
    AppDomainModel,
    ConfigServiceError
  >;
}
