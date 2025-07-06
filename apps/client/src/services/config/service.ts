import { Effect, Ref, Schema } from "effect";
import type { ConfigServiceApi } from "./api";
import {
  ConfigBackupError,
  ConfigExportError,
  ConfigFileSystemError,
  ConfigHealthError,
  ConfigImportError,
  ConfigLoadError,
  ConfigMergeError,
  ConfigMigrationError,
  ConfigNetworkError,
  ConfigParseError,
  ConfigRepairError,
  ConfigResetError,
  ConfigRestoreError,
  ConfigSaveError,
  ConfigTemplateError,
  ConfigTimeoutError,
  ConfigValidationError,
  ConfigWatchError,
} from "./errors";
import type {
  AppConfigValidationResult,
  AppDomainModel,
  ConfigLoadOptions,
  ConfigMergeOptions,
  ConfigSaveOptions,
  ConfigTemplate,
  ConfigValidationOptions,
  ConfigValidationSuggestion,
  ConfigValidationWarning,
  ConfigWatchOptions,
  ConfigValidationIssue as ValidationError,
} from "./types";
import {
  CONFIG_CONSTANTS,
  createDefaultAppConfig,
  getCurrentTimestamp,
  isValidAgentId,
  isValidChatAppId,
  isValidColor,
  isValidConfigPath,
  isValidEmail,
  isValidTimestamp,
  isValidUrl,
  isValidVersion,
  isValidWorkspaceId,
} from "./types";

// Configuration state
interface ConfigState {
  readonly currentConfig: AppDomainModel | null;
  readonly configPath: string | null;
  readonly isLoaded: boolean;
  readonly lastModified: Date | null;
  readonly watchers: Map<string, AbortController>;
  readonly backups: Map<string, string[]>;
  readonly templates: ConfigTemplate[];
  readonly validationCache: Map<string, AppConfigValidationResult>;
}

// Create default state
function createDefaultState(): ConfigState {
  return {
    currentConfig: null,
    configPath: null,
    isLoaded: false,
    lastModified: null,
    watchers: new Map(),
    backups: new Map(),
    templates: [],
    validationCache: new Map(),
  };
}

// Configuration schema for validation
const AppConfigSchema = Schema.Struct({
  app: Schema.Struct({
    name: Schema.String,
    version: Schema.String,
    description: Schema.optional(Schema.String),
    author: Schema.optional(Schema.String),
    license: Schema.optional(Schema.String),
    homepage: Schema.optional(Schema.String),
    repository: Schema.optional(Schema.String),
    theme: Schema.optional(Schema.String),
    debugMode: Schema.optional(Schema.Boolean),
    features: Schema.optional(Schema.Array(Schema.String)),
    environment: Schema.optional(
      Schema.Literal("development", "production", "test")
    ),
    locale: Schema.optional(Schema.String),
    timezone: Schema.optional(Schema.String),
  }),
  workspaces: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      description: Schema.optional(Schema.String),
      icon: Schema.optional(Schema.String),
      color: Schema.optional(Schema.String),
      chatappIds: Schema.Array(Schema.String),
      agentIds: Schema.Array(Schema.String),
      isDefault: Schema.optional(Schema.Boolean),
      isArchived: Schema.optional(Schema.Boolean),
      maxExpandedApps: Schema.optional(Schema.Number),
      createdAt: Schema.String,
      updatedAt: Schema.String,
      metadata: Schema.optional(
        Schema.Record({ key: Schema.String, value: Schema.Unknown })
      ),
    })
  ),
  chatapps: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      description: Schema.optional(Schema.String),
      version: Schema.String,
      agentId: Schema.String,
      toolbarId: Schema.optional(Schema.String),
      themeId: Schema.optional(Schema.String),
      spaceId: Schema.optional(Schema.String),
      workspaceId: Schema.optional(Schema.String),
      isDefault: Schema.optional(Schema.Boolean),
      isShared: Schema.optional(Schema.Boolean),
      isArchived: Schema.optional(Schema.Boolean),
      createdAt: Schema.String,
      updatedAt: Schema.String,
      metadata: Schema.optional(
        Schema.Record({ key: Schema.String, value: Schema.Unknown })
      ),
    })
  ),
  agents: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      description: Schema.optional(Schema.String),
      version: Schema.String,
      provider: Schema.String,
      model: Schema.String,
      prompt: Schema.optional(Schema.String),
      avatar: Schema.optional(Schema.String),
      type: Schema.optional(Schema.String),
      capabilities: Schema.optional(Schema.Array(Schema.String)),
      isDefault: Schema.optional(Schema.Boolean),
      isShared: Schema.optional(Schema.Boolean),
      isArchived: Schema.optional(Schema.Boolean),
      createdAt: Schema.String,
      updatedAt: Schema.String,
      metadata: Schema.optional(
        Schema.Record({ key: Schema.String, value: Schema.Unknown })
      ),
    })
  ),
  themes: Schema.optional(Schema.Array(Schema.Unknown)),
  toolbars: Schema.optional(Schema.Array(Schema.Unknown)),
  plugins: Schema.optional(Schema.Array(Schema.Unknown)),
  version: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    scoped: Effect.gen(function* () {
      // Service state
      const stateRef = yield* Ref.make<ConfigState>(createDefaultState());

      // Helper to update state
      const updateState = (
        updater: (state: ConfigState) => ConfigState
      ): Effect.Effect<void, never> =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, updater);
        });

      // Helper to get current state
      const getState = (): Effect.Effect<ConfigState, never> =>
        Ref.get(stateRef);

      // Helper to validate config structure
      const validateConfigStructure = (
        config: unknown,
        options?: ConfigValidationOptions
      ): Effect.Effect<AppConfigValidationResult, never> =>
        Effect.gen(function* () {
          const errors: ValidationError[] = [];
          const warnings: ConfigValidationWarning[] = [];
          const suggestions: ConfigValidationSuggestion[] = [];

          // Skip schema validation here - we want to do custom validation
          // Schema validation can be done separately if needed

          // Additional validation
          if (config && typeof config === "object") {
            const cfg = config as any;

            // Validate app section
            if (!cfg.app?.name) {
              errors.push({
                field: "app.name",
                message: "App name is required",
                severity: "error",
              });
            }

            if (!cfg.app?.version || !isValidVersion(cfg.app.version)) {
              errors.push({
                field: "app.version",
                message: "Valid app version is required",
                value: cfg.app?.version,
                severity: "error",
              });
            }

            // Validate workspaces
            if (cfg.workspaces && Array.isArray(cfg.workspaces)) {
              cfg.workspaces.forEach((workspace: any, index: number) => {
                if (!workspace.id || !isValidWorkspaceId(workspace.id)) {
                  errors.push({
                    field: `workspaces[${index}].id`,
                    message: "Valid workspace ID is required",
                    value: workspace.id,
                    severity: "error",
                  });
                }

                if (!workspace.name) {
                  errors.push({
                    field: `workspaces[${index}].name`,
                    message: "Workspace name is required",
                    severity: "error",
                  });
                }

                if (
                  !workspace.createdAt ||
                  !isValidTimestamp(workspace.createdAt)
                ) {
                  errors.push({
                    field: `workspaces[${index}].createdAt`,
                    message: "Valid created timestamp is required",
                    value: workspace.createdAt,
                    severity: "error",
                  });
                }

                if (
                  !workspace.updatedAt ||
                  !isValidTimestamp(workspace.updatedAt)
                ) {
                  errors.push({
                    field: `workspaces[${index}].updatedAt`,
                    message: "Valid updated timestamp is required",
                    value: workspace.updatedAt,
                    severity: "error",
                  });
                }
              });
            }

            // Validate chat apps
            if (cfg.chatapps && Array.isArray(cfg.chatapps)) {
              cfg.chatapps.forEach((chatapp: any, index: number) => {
                if (!chatapp.id || !isValidChatAppId(chatapp.id)) {
                  errors.push({
                    field: `chatapps[${index}].id`,
                    message: "Valid chat app ID is required",
                    value: chatapp.id,
                    severity: "error",
                  });
                }

                if (!chatapp.name) {
                  errors.push({
                    field: `chatapps[${index}].name`,
                    message: "Chat app name is required",
                    severity: "error",
                  });
                }

                if (!chatapp.agentId || !isValidAgentId(chatapp.agentId)) {
                  errors.push({
                    field: `chatapps[${index}].agentId`,
                    message: "Valid agent ID is required",
                    value: chatapp.agentId,
                    severity: "error",
                  });
                }

                if (!chatapp.version || !isValidVersion(chatapp.version)) {
                  errors.push({
                    field: `chatapps[${index}].version`,
                    message: "Valid chat app version is required",
                    value: chatapp.version,
                    severity: "error",
                  });
                }
              });
            }

            // Validate agents
            if (cfg.agents && Array.isArray(cfg.agents)) {
              cfg.agents.forEach((agent: any, index: number) => {
                if (!agent.id || !isValidAgentId(agent.id)) {
                  errors.push({
                    field: `agents[${index}].id`,
                    message: "Valid agent ID is required",
                    value: agent.id,
                    severity: "error",
                  });
                }

                if (!agent.name) {
                  errors.push({
                    field: `agents[${index}].name`,
                    message: "Agent name is required",
                    severity: "error",
                  });
                }

                if (!agent.provider) {
                  errors.push({
                    field: `agents[${index}].provider`,
                    message: "Agent provider is required",
                    severity: "error",
                  });
                }

                if (!agent.model) {
                  errors.push({
                    field: `agents[${index}].model`,
                    message: "Agent model is required",
                    severity: "error",
                  });
                }

                if (!agent.version || !isValidVersion(agent.version)) {
                  errors.push({
                    field: `agents[${index}].version`,
                    message: "Valid agent version is required",
                    value: agent.version,
                    severity: "error",
                  });
                }
              });
            }

            // Validate version
            if (!cfg.version || !isValidVersion(cfg.version)) {
              errors.push({
                field: "version",
                message: "Valid configuration version is required",
                value: cfg.version,
                severity: "error",
              });
            }

            // Validate timestamps
            if (!cfg.createdAt || !isValidTimestamp(cfg.createdAt)) {
              errors.push({
                field: "createdAt",
                message: "Valid created timestamp is required",
                value: cfg.createdAt,
                severity: "error",
              });
            }

            if (!cfg.updatedAt || !isValidTimestamp(cfg.updatedAt)) {
              errors.push({
                field: "updatedAt",
                message: "Valid updated timestamp is required",
                value: cfg.updatedAt,
                severity: "error",
              });
            }

            // Check for duplicate IDs
            if (options?.checkDuplicates) {
              const workspaceIds = new Set();
              const chatappIds = new Set();
              const agentIds = new Set();

              cfg.workspaces?.forEach((workspace: any, index: number) => {
                if (workspaceIds.has(workspace.id)) {
                  errors.push({
                    field: `workspaces[${index}].id`,
                    message: "Duplicate workspace ID",
                    value: workspace.id,
                    severity: "error",
                  });
                }
                workspaceIds.add(workspace.id);
              });

              cfg.chatapps?.forEach((chatapp: any, index: number) => {
                if (chatappIds.has(chatapp.id)) {
                  errors.push({
                    field: `chatapps[${index}].id`,
                    message: "Duplicate chat app ID",
                    value: chatapp.id,
                    severity: "error",
                  });
                }
                chatappIds.add(chatapp.id);
              });

              cfg.agents?.forEach((agent: any, index: number) => {
                if (agentIds.has(agent.id)) {
                  errors.push({
                    field: `agents[${index}].id`,
                    message: "Duplicate agent ID",
                    value: agent.id,
                    severity: "error",
                  });
                }
                agentIds.add(agent.id);
              });
            }

            // Validate references
            if (options?.validateReferences) {
              const workspaceIds = new Set(
                cfg.workspaces?.map((w: any) => w.id) || []
              );
              const agentIds = new Set(cfg.agents?.map((a: any) => a.id) || []);

              cfg.chatapps?.forEach((chatapp: any, index: number) => {
                if (chatapp.spaceId && !workspaceIds.has(chatapp.spaceId)) {
                  errors.push({
                    field: `chatapps[${index}].spaceId`,
                    message: "Referenced workspace does not exist",
                    value: chatapp.spaceId,
                    severity: "error",
                  });
                }

                if (!agentIds.has(chatapp.agentId)) {
                  errors.push({
                    field: `chatapps[${index}].agentId`,
                    message: "Referenced agent does not exist",
                    value: chatapp.agentId,
                    severity: "error",
                  });
                }
              });
            }

            // Add suggestions
            if (cfg.workspaces?.length === 0) {
              suggestions.push({
                field: "workspaces",
                message: "Consider adding at least one workspace",
                reason: "Empty workspaces array",
              });
            }

            if (cfg.chatapps?.length === 0) {
              suggestions.push({
                field: "chatapps",
                message: "Consider adding at least one chat app",
                reason: "Empty chat apps array",
              });
            }

            if (cfg.agents?.length === 0) {
              suggestions.push({
                field: "agents",
                message: "Consider adding at least one agent",
                reason: "Empty agents array",
              });
            }

            // Add warnings for missing optional fields
            if (!cfg.app?.description) {
              warnings.push({
                field: "app.description",
                message: "App description is recommended",
                suggestion: "Add a description for better documentation",
              });
            }

            if (!cfg.app?.author) {
              warnings.push({
                field: "app.author",
                message: "App author is recommended",
                suggestion: "Add author information for better documentation",
              });
            }
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
          };
        });

      // Helper to load config from URL/path
      const loadConfigFromPath = (
        configPath: string,
        options?: ConfigLoadOptions
      ): Effect.Effect<AppDomainModel, ConfigLoadError | ConfigParseError> =>
        Effect.gen(function* () {
          try {
            const response = yield* Effect.tryPromise({
              try: () => fetch(configPath),
              catch: (error) =>
                new ConfigLoadError({
                  message: `Failed to fetch config from ${configPath}`,
                  configPath,
                  cause: error,
                }),
            });

            if (!response.ok) {
              yield* Effect.fail(
                new ConfigLoadError({
                  message: `HTTP ${response.status} when loading config`,
                  configPath,
                })
              );
            }

            const content = yield* Effect.tryPromise({
              try: () => response.text(),
              catch: (error) =>
                new ConfigLoadError({
                  message: `Failed to read config content`,
                  configPath,
                  cause: error,
                }),
            });

            const parsed = yield* Effect.try({
              try: () => JSON.parse(content),
              catch: (error) =>
                new ConfigParseError({
                  message: `Failed to parse config JSON`,
                  configPath,
                  format: "json",
                  cause: error,
                }),
            });

            // Validate if requested
            if (options?.validateOnLoad) {
              const validation = yield* validateConfigStructure(parsed, {
                strict: true,
                checkDuplicates: true,
                validateReferences: true,
              });

              if (!validation.isValid) {
                yield* Effect.fail(
                  new ConfigLoadError({
                    message: `Config validation failed: ${validation.errors
                      .map((e) => e.message)
                      .join(", ")}`,
                    configPath,
                  })
                );
              }
            }

            return parsed as AppDomainModel;
          } catch (error) {
            yield* Effect.fail(
              new ConfigLoadError({
                message: `Unexpected error loading config`,
                configPath,
                cause: error,
              })
            );
          }
        });

      // Helper to save config to path
      const saveConfigToPath = (
        config: AppDomainModel,
        configPath: string,
        options?: ConfigSaveOptions
      ): Effect.Effect<void, ConfigSaveError | ConfigBackupError> =>
        Effect.gen(function* () {
          try {
            // Validate if requested
            if (options?.validateOnSave) {
              const validation = yield* validateConfigStructure(config, {
                strict: true,
                checkDuplicates: true,
                validateReferences: true,
              });

              if (!validation.isValid) {
                yield* Effect.fail(
                  new ConfigSaveError({
                    message: `Config validation failed before save: ${validation.errors
                      .map((e) => e.message)
                      .join(", ")}`,
                    configPath,
                  })
                );
              }
            }

            // Create backup if requested
            if (options?.createBackup) {
              yield* backupConfig(configPath);
            }

            // Serialize config
            const content = JSON.stringify(
              config,
              null,
              options?.prettyPrint ? 2 : 0
            );

            // For browser environment, we can't actually save files
            // This would need to be implemented with a server endpoint
            // For now, we'll just simulate success
            yield* Effect.succeed(undefined);
          } catch (error) {
            yield* Effect.fail(
              new ConfigSaveError({
                message: `Failed to save config`,
                configPath,
                cause: error,
              })
            );
          }
        });

      // Core configuration loading
      const loadConfig = (
        configPath?: string,
        options?: ConfigLoadOptions
      ): Effect.Effect<
        AppDomainModel,
        ConfigLoadError | ConfigParseError | ConfigMergeError
      > =>
        Effect.gen(function* () {
          const state = yield* getState();
          const pathToUse =
            configPath ||
            state.configPath ||
            CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH;

          const config = yield* loadConfigFromPath(pathToUse, options);

          // Merge with defaults if requested
          const finalConfig = options?.mergeDefaults
            ? yield* mergeConfigs(createDefaultAppConfig(), config)
            : config;

          // Update state
          yield* updateState((state) => ({
            ...state,
            currentConfig: finalConfig,
            configPath: pathToUse,
            isLoaded: true,
            lastModified: new Date(),
          }));

          return finalConfig;
        });

      const saveConfig = (
        config: AppDomainModel,
        configPath?: string,
        options?: ConfigSaveOptions
      ): Effect.Effect<void, ConfigSaveError | ConfigBackupError> =>
        Effect.gen(function* () {
          const state = yield* getState();
          const pathToUse =
            configPath ||
            state.configPath ||
            CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH;

          // Update config timestamp
          const updatedConfig = {
            ...config,
            updatedAt: getCurrentTimestamp(),
          };

          yield* saveConfigToPath(updatedConfig, pathToUse, options);

          // Update state
          yield* updateState((state) => ({
            ...state,
            currentConfig: updatedConfig,
            configPath: pathToUse,
            lastModified: new Date(),
          }));
        });

      const reloadConfig = (): Effect.Effect<
        AppDomainModel,
        ConfigLoadError | ConfigParseError | ConfigMergeError
      > =>
        Effect.gen(function* () {
          const state = yield* getState();
          if (!state.configPath) {
            yield* Effect.fail(
              new ConfigLoadError({
                message: "No config path available for reload",
                configPath: "unknown",
              })
            );
          }

          return yield* loadConfig(state.configPath);
        });

      // Configuration validation
      const validateConfig = (
        config: unknown,
        options?: ConfigValidationOptions
      ): Effect.Effect<AppConfigValidationResult, never> =>
        validateConfigStructure(config, options);

      const validateConfigFile = (
        configPath: string
      ): Effect.Effect<
        AppConfigValidationResult,
        ConfigLoadError | ConfigParseError
      > =>
        Effect.gen(function* () {
          const config = yield* loadConfigFromPath(configPath);
          return yield* validateConfigStructure(config, {
            strict: true,
            checkDuplicates: true,
            validateReferences: true,
          });
        });

      // Configuration watching (placeholder - would need WebSocket or polling)
      const watchConfig = (
        configPath: string,
        options?: ConfigWatchOptions
      ): Effect.Effect<void, ConfigWatchError> =>
        Effect.gen(function* () {
          // Placeholder implementation
          yield* Effect.succeed(undefined);
        });

      const stopWatching = (
        configPath: string
      ): Effect.Effect<void, ConfigWatchError> =>
        Effect.gen(function* () {
          // Placeholder implementation
          yield* Effect.succeed(undefined);
        });

      // Configuration templates
      const createDefaultConfig = (
        options?: Partial<AppDomainModel>
      ): Effect.Effect<AppDomainModel, never> => {
        const defaultConfig = createDefaultAppConfig();
        return Effect.succeed(
          options ? { ...defaultConfig, ...options } : defaultConfig
        );
      };

      const createConfigFromTemplate = (
        template: ConfigTemplate,
        options?: ConfigMergeOptions
      ): Effect.Effect<
        AppDomainModel,
        ConfigTemplateError | ConfigMergeError
      > =>
        Effect.gen(function* () {
          try {
            const baseConfig = createDefaultAppConfig();
            const templateConfig = template.template as AppDomainModel;
            return yield* mergeConfigs(baseConfig, templateConfig, options);
          } catch (error) {
            yield* Effect.fail(
              new ConfigTemplateError({
                message: `Failed to create config from template`,
                templateName: template.name,
                cause: error,
              })
            );
          }
        });

      const getAvailableTemplates = (): Effect.Effect<
        ConfigTemplate[],
        never
      > =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.templates;
        });

      // Configuration merging
      const mergeConfigs = (
        baseConfig: AppDomainModel,
        overrideConfig: Partial<AppDomainModel>,
        options?: ConfigMergeOptions
      ): Effect.Effect<AppDomainModel, ConfigMergeError> =>
        Effect.gen(function* () {
          try {
            const strategy = options?.strategy || "merge";
            const conflictResolution = options?.conflictResolution || "target";

            if (strategy === "replace") {
              return { ...baseConfig, ...overrideConfig } as AppDomainModel;
            }

            if (strategy === "merge") {
              const merged = { ...baseConfig };

              // Merge app section
              if (overrideConfig.app) {
                merged.app = { ...baseConfig.app, ...overrideConfig.app };
              }

              // Merge arrays
              if (overrideConfig.workspaces) {
                merged.workspaces = [
                  ...baseConfig.workspaces,
                  ...overrideConfig.workspaces,
                ];
              }

              if (overrideConfig.chatapps) {
                merged.chatapps = [
                  ...baseConfig.chatapps,
                  ...overrideConfig.chatapps,
                ];
              }

              if (overrideConfig.agents) {
                merged.agents = [
                  ...baseConfig.agents,
                  ...overrideConfig.agents,
                ];
              }

              // Merge other fields
              if (overrideConfig.version)
                merged.version = overrideConfig.version;
              if (overrideConfig.createdAt)
                merged.createdAt = overrideConfig.createdAt;
              if (overrideConfig.updatedAt)
                merged.updatedAt = overrideConfig.updatedAt;
              if (overrideConfig.metadata) {
                merged.metadata = {
                  ...baseConfig.metadata,
                  ...overrideConfig.metadata,
                };
              }

              return merged;
            }

            if (strategy === "append") {
              // Only append array items, don't merge other fields
              const merged = { ...baseConfig };

              if (overrideConfig.workspaces) {
                merged.workspaces = [
                  ...baseConfig.workspaces,
                  ...overrideConfig.workspaces,
                ];
              }

              if (overrideConfig.chatapps) {
                merged.chatapps = [
                  ...baseConfig.chatapps,
                  ...overrideConfig.chatapps,
                ];
              }

              if (overrideConfig.agents) {
                merged.agents = [
                  ...baseConfig.agents,
                  ...overrideConfig.agents,
                ];
              }

              // Don't merge non-array fields in append mode
              return merged;
            }

            return baseConfig;
          } catch (error) {
            yield* Effect.fail(
              new ConfigMergeError({
                message: `Failed to merge configurations`,
                cause: error,
              })
            );
          }
        });

      const mergeConfigFiles = (
        configPaths: string[],
        options?: ConfigMergeOptions
      ): Effect.Effect<
        AppDomainModel,
        ConfigMergeError | ConfigLoadError | ConfigParseError
      > =>
        Effect.gen(function* () {
          if (configPaths.length === 0) {
            return createDefaultAppConfig();
          }

          let mergedConfig = yield* loadConfigFromPath(configPaths[0]);

          for (let i = 1; i < configPaths.length; i++) {
            const nextConfig = yield* loadConfigFromPath(configPaths[i]);
            mergedConfig = yield* mergeConfigs(
              mergedConfig,
              nextConfig,
              options
            );
          }

          return mergedConfig;
        });

      // Configuration utilities
      const getConfigPath = (): Effect.Effect<string | null, never> =>
        Effect.gen(function* () {
          const state = yield* getState();
          return state.configPath;
        });

      const setConfigPath = (configPath: string): Effect.Effect<void, never> =>
        Effect.gen(function* () {
          yield* updateState((state) => ({
            ...state,
            configPath,
          }));
        });

      const getConfigMetadata = (
        configPath?: string
      ): Effect.Effect<
        {
          path: string;
          lastModified: Date;
          size: number;
          isValid: boolean;
        },
        ConfigLoadError | ConfigParseError
      > =>
        Effect.gen(function* () {
          const state = yield* getState();
          const pathToUse =
            configPath ||
            state.configPath ||
            CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH;

          // For browser environment, we can't get actual file metadata
          // This would need to be implemented with a server endpoint
          const validation = yield* validateConfigFile(pathToUse);

          return {
            path: pathToUse,
            lastModified: state.lastModified || new Date(),
            size: 0, // Would need server endpoint
            isValid: validation.isValid,
          };
        });

      // Configuration backup and restore (placeholder implementations)
      const backupConfig = (
        configPath?: string,
        backupPath?: string
      ): Effect.Effect<string, ConfigBackupError> =>
        Effect.gen(function* () {
          const state = yield* getState();
          const pathToUse =
            configPath ||
            state.configPath ||
            CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH;
          const backupPathToUse =
            backupPath || `${pathToUse}.backup.${Date.now()}.json`;

          // Placeholder implementation
          return backupPathToUse;
        });

      const restoreConfig = (
        backupPath: string,
        configPath?: string
      ): Effect.Effect<void, ConfigRestoreError> =>
        Effect.gen(function* () {
          // Placeholder implementation
          yield* Effect.succeed(undefined);
        });

      const listBackups = (
        configPath?: string
      ): Effect.Effect<string[], never> =>
        Effect.gen(function* () {
          const state = yield* getState();
          const pathToUse =
            configPath ||
            state.configPath ||
            CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH;
          return state.backups.get(pathToUse) || [];
        });

      // Configuration migration (placeholder)
      const migrateConfig = (
        config: unknown,
        fromVersion: string,
        toVersion: string
      ): Effect.Effect<AppDomainModel, ConfigMigrationError> => {
        // Placeholder implementation
        if (typeof config === "object" && config !== null) {
          return Effect.succeed(config as AppDomainModel);
        }
        return Effect.succeed(createDefaultAppConfig());
      };

      const detectConfigVersion = (
        config: unknown
      ): Effect.Effect<string, never> => {
        if (
          typeof config === "object" &&
          config !== null &&
          "version" in config &&
          typeof (config as any).version === "string"
        ) {
          return Effect.succeed((config as any).version);
        }
        return Effect.succeed("unknown");
      };

      // Configuration export/import (placeholder)
      const exportConfig = (
        config: AppDomainModel,
        format: "json" | "yaml" | "toml"
      ): Effect.Effect<string, ConfigExportError> =>
        Effect.gen(function* () {
          if (format === "json") {
            return JSON.stringify(config, null, 2);
          }
          // YAML and TOML would need additional libraries
          yield* Effect.fail(
            new ConfigExportError({
              message: `Export format ${format} not supported`,
              format,
            })
          );
        });

      const importConfig = (
        content: string,
        format: "json" | "yaml" | "toml"
      ): Effect.Effect<AppDomainModel, ConfigImportError> =>
        Effect.gen(function* () {
          if (format === "json") {
            try {
              const parsed = JSON.parse(content);
              return parsed as AppDomainModel;
            } catch (error) {
              yield* Effect.fail(
                new ConfigImportError({
                  message: `Failed to parse JSON`,
                  format,
                  cause: error,
                })
              );
            }
          }
          // YAML and TOML would need additional libraries
          yield* Effect.fail(
            new ConfigImportError({
              message: `Import format ${format} not supported`,
              format,
            })
          );
        });

      // Configuration health
      const checkConfigHealth = (
        configPath?: string
      ): Effect.Effect<
        {
          isHealthy: boolean;
          issues: string[];
          recommendations: string[];
        },
        ConfigHealthError | ConfigLoadError | ConfigParseError
      > =>
        Effect.gen(function* () {
          const validation = yield* validateConfigFile(
            configPath || CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH
          );

          const issues = validation.errors.map((error) => error.message);
          const recommendations = validation.suggestions.map(
            (suggestion) => suggestion.message
          );

          return {
            isHealthy: validation.isValid,
            issues,
            recommendations,
          };
        });

      const repairConfig = (
        configPath?: string
      ): Effect.Effect<
        AppDomainModel,
        ConfigRepairError | ConfigLoadError | ConfigParseError
      > =>
        Effect.gen(function* () {
          try {
            const config = yield* loadConfigFromPath(
              configPath || CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH
            );
            const validation = yield* validateConfigStructure(config);

            if (validation.isValid) {
              return config;
            }

            // Apply basic repairs
            const repairedConfig = { ...config };

            // Ensure required fields
            if (!repairedConfig.app?.name) {
              repairedConfig.app = { ...repairedConfig.app, name: "Buddy" };
            }

            if (!repairedConfig.app?.version) {
              repairedConfig.app = { ...repairedConfig.app, version: "1.0.0" };
            }

            if (
              !repairedConfig.version ||
              !isValidVersion(repairedConfig.version)
            ) {
              repairedConfig.version = CONFIG_CONSTANTS.CURRENT_VERSION;
            }

            const now = getCurrentTimestamp();
            if (!repairedConfig.createdAt) {
              repairedConfig.createdAt = now;
            }

            if (!repairedConfig.updatedAt) {
              repairedConfig.updatedAt = now;
            }

            // Ensure arrays exist
            if (!repairedConfig.workspaces) {
              repairedConfig.workspaces = [];
            }

            if (!repairedConfig.chatapps) {
              repairedConfig.chatapps = [];
            }

            if (!repairedConfig.agents) {
              repairedConfig.agents = [];
            }

            return repairedConfig;
          } catch (error) {
            yield* Effect.fail(
              new ConfigRepairError({
                message: `Failed to repair configuration`,
                configPath,
                cause: error,
              })
            );
          }
        });

      // Configuration reset
      const resetConfig = (
        configPath?: string
      ): Effect.Effect<
        void,
        ConfigResetError | ConfigSaveError | ConfigBackupError
      > =>
        Effect.gen(function* () {
          const defaultConfig = createDefaultAppConfig();
          yield* saveConfig(defaultConfig, configPath);
        });

      const resetToDefaults = (): Effect.Effect<AppDomainModel, never> =>
        Effect.gen(function* () {
          const defaultConfig = createDefaultAppConfig();
          yield* updateState((state) => ({
            ...state,
            currentConfig: defaultConfig,
            isLoaded: true,
            lastModified: new Date(),
          }));
          return defaultConfig;
        });

      return {
        loadConfig,
        saveConfig,
        reloadConfig,
        validateConfig,
        validateConfigFile,
        watchConfig,
        stopWatching,
        createDefaultConfig,
        createConfigFromTemplate,
        getAvailableTemplates,
        mergeConfigs,
        mergeConfigFiles,
        getConfigPath,
        setConfigPath,
        getConfigMetadata,
        backupConfig,
        restoreConfig,
        listBackups,
        migrateConfig,
        detectConfigVersion,
        exportConfig,
        importConfig,
        checkConfigHealth,
        repairConfig,
        resetConfig,
        resetToDefaults,
      } satisfies ConfigServiceApi;
    }),
    dependencies: [],
  }
) {}
