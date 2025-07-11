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
import {
  type AppConfigValidationResult,
  CONFIG_CONSTANTS,
  type ConfigLoadOptions,
  type ConfigMergeOptions,
  type ConfigSaveOptions,
  type ConfigValidationOptions,
  createDefaultAppConfig,
  getCurrentTimestamp,
  isValidAgentId,
  isValidChatAppId,
  isValidWorkspaceId,
} from "./types";

const CONFIG_KEY = "buddy-app-config";

// --- Proper Schemas ---

// ChatApp Schema based on ChatAppModel domain
const ChatAppSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  version: Schema.String,
  agentId: Schema.String,
  workspaceId: Schema.String.pipe(Schema.optional),
  permissions: Schema.Struct({
    canSendMessages: Schema.Boolean,
    canReceiveMessages: Schema.Boolean,
    canViewHistory: Schema.Boolean,
    canDeleteMessages: Schema.Boolean,
    canModifySettings: Schema.Boolean,
    canShareConversations: Schema.Boolean,
  }),
  isDefault: Schema.Boolean.pipe(Schema.optional),
  isShared: Schema.Boolean.pipe(Schema.optional),
  isArchived: Schema.Boolean.pipe(Schema.optional),
  plugins: Schema.mutable(Schema.Array(Schema.String)).pipe(Schema.optional),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Agent Schema based on AgentModel domain
const AgentSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  version: Schema.String,
  provider: Schema.String,
  model: Schema.String,
  prompt: Schema.String.pipe(Schema.optional),
  capabilities: Schema.mutable(Schema.Array(Schema.String)),
  parameters: Schema.Struct({
    temperature: Schema.Number.pipe(Schema.optional),
    maxTokens: Schema.Number.pipe(Schema.optional),
    topP: Schema.Number.pipe(Schema.optional),
    frequencyPenalty: Schema.Number.pipe(Schema.optional),
    presencePenalty: Schema.Number.pipe(Schema.optional),
    stopSequences: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
    customParameters: Schema.optional(
      Schema.Record({ key: Schema.String, value: Schema.Unknown })
    ),
  }),
  permissions: Schema.Struct({
    canAccessInternet: Schema.Boolean,
    canExecuteCode: Schema.Boolean,
    canAccessFiles: Schema.Boolean,
    canModifyFiles: Schema.Boolean,
    canAccessDatabase: Schema.Boolean,
    canSendEmails: Schema.Boolean,
    allowedDomains: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
    blockedDomains: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
  }),
  isDefault: Schema.Boolean.pipe(Schema.optional),
  isShared: Schema.Boolean.pipe(Schema.optional),
  isArchived: Schema.Boolean.pipe(Schema.optional),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Settings Schema with proper typing for common settings
const SettingsSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Union(
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    Schema.Array(Schema.String),
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Main App Config Schema with proper types
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
  chatapps: Schema.mutable(Schema.Array(ChatAppSchema)),
  agents: Schema.mutable(Schema.Array(AgentSchema)),
  settings: Schema.mutable(SettingsSchema),
});

// --- State ---
interface ConfigState {
  readonly currentConfig: AppDomainModel | null;
  readonly isLoaded: boolean;
  readonly lastModified: Date | null;
  readonly configPath: string;
}

function createDefaultState(): ConfigState {
  return {
    currentConfig: null,
    isLoaded: false,
    lastModified: null,
    configPath: CONFIG_CONSTANTS.DEFAULT_CONFIG_PATH,
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

      const validateConfig = (
        config: unknown,
        options?: ConfigValidationOptions
      ) =>
        Effect.gen(function* () {
          const errors: AppConfigValidationResult["errors"] = [];
          const warnings: AppConfigValidationResult["warnings"] = [];
          const suggestions: AppConfigValidationResult["suggestions"] = [];

          // Basic schema validation
          const schemaResult = yield* Schema.decodeUnknown(AppConfigSchema)(
            config
          ).pipe(Effect.either);

          if (schemaResult._tag === "Left") {
            errors.push({
              field: "schema",
              message: "Configuration does not match expected schema",
              value: config,
              severity: "error" as const,
            });
          }

          const validConfig =
            schemaResult._tag === "Right"
              ? (schemaResult.right as AppDomainModel)
              : null;

          if (validConfig && options) {
            // Check duplicates if requested
            if (options.checkDuplicates) {
              const workspaceIds = validConfig.workspaces.map((w) => w.id);
              const duplicateWorkspaces = workspaceIds.filter(
                (id, index) => workspaceIds.indexOf(id) !== index
              );
              if (duplicateWorkspaces.length > 0) {
                errors.push({
                  field: "workspaces",
                  message: `Duplicate workspace ID: ${duplicateWorkspaces[0]}`,
                  severity: "error" as const,
                });
              }
            }

            // Validate references if requested
            if (options.validateReferences) {
              for (const chatapp of validConfig.chatapps) {
                // Now chatapp is properly typed, no need for 'as any'
                if (
                  chatapp.agentId &&
                  !validConfig.agents.some(
                    (agent) => agent.id === chatapp.agentId
                  )
                ) {
                  errors.push({
                    field: `chatapps.agentId`,
                    message: `Referenced agent ${chatapp.agentId} not found`,
                    severity: "error" as const,
                  });
                }
              }
            }
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
          } as AppConfigValidationResult;
        }).pipe(
          Effect.mapError(
            (error) =>
              new ConfigValidationError({
                message: "Config validation failed",
                cause: error,
              })
          )
        );

      // New methods implementation
      const loadConfig = (path: string, options?: ConfigLoadOptions) =>
        Effect.gen(function* () {
          if (
            typeof window !== "undefined" &&
            typeof window.fetch === "function"
          ) {
            // Browser environment - use fetch
            const response = yield* Effect.tryPromise({
              try: () => fetch(path),
              catch: (error) =>
                new ConfigLoadError({
                  message: `Failed to fetch config from ${path}`,
                  cause: error as Error,
                }),
            });

            if (!response.ok) {
              yield* Effect.fail(
                new ConfigLoadError({
                  message: `HTTP ${response.status} when loading config from ${path}`,
                })
              );
            }

            const content = yield* Effect.tryPromise({
              try: () => response.text(),
              catch: (error) =>
                new ConfigParseError({
                  message: "Failed to read response text",
                  cause: error as Error,
                }),
            });

            const parsed = yield* Effect.try({
              try: () => JSON.parse(content),
              catch: (error) =>
                new ConfigParseError({
                  message: "Failed to parse JSON",
                  cause: error as Error,
                }),
            });

            const validated = yield* Schema.decodeUnknown(AppConfigSchema)(
              parsed
            ).pipe(
              Effect.mapError(
                (error) =>
                  new ConfigValidationError({
                    message: "Config validation failed",
                    cause: error,
                  })
              )
            );

            return validated as AppDomainModel;
          }
          // Fallback to getConfig for non-browser environments
          return yield* getConfig();
        });

      /**
       * Creates a default config, optionally overriding fields.
       */
      const createDefaultConfig = (overrides?: Partial<AppDomainModel>) =>
        Effect.succeed(
          overrides
            ? { ...createDefaultAppConfig(), ...overrides }
            : createDefaultAppConfig()
        );

      const mergeConfigs = (
        config1: AppDomainModel,
        config2: AppDomainModel,
        options?: ConfigMergeOptions
      ) =>
        Effect.gen(function* () {
          const strategy = options?.strategy ?? "merge";

          let merged: AppDomainModel;

          switch (strategy) {
            case "replace":
              merged = config2;
              break;
            case "append":
              merged = {
                ...config1,
                workspaces: [...config1.workspaces, ...config2.workspaces],
                chatapps: [...config1.chatapps, ...config2.chatapps],
                agents: [...config1.agents, ...config2.agents],
              };
              break;
            default:
              merged = {
                ...config1,
                ...config2,
                app: { ...config1.app, ...config2.app },
                workspaces: [...config1.workspaces, ...config2.workspaces],
                chatapps: [...config1.chatapps, ...config2.chatapps],
                agents: [...config1.agents, ...config2.agents],
                settings: { ...config1.settings, ...config2.settings },
              };
              break;
          }

          if (options?.validateResult) {
            yield* validateConfig(merged);
          }

          return merged;
        });

      const setConfigPath = (path: string) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => ({
            ...state,
            configPath: path,
          }));
        });

      const getConfigPath = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.configPath;
        });

      const reloadConfig = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return yield* loadConfig(state.configPath);
        });

      const checkConfigHealth = (config: AppDomainModel) =>
        Effect.succeed({
          isHealthy: !!config.app.name && !!config.app.version,
          issues: [
            ...(!config.app.name ? ["Missing app name"] : []),
            ...(!config.app.version ? ["Missing app version"] : []),
          ],
        });

      const repairConfig = (config: AppDomainModel) =>
        Effect.succeed({
          ...config,
          app: {
            ...config.app,
            name: config.app.name || "Buddy",
            version: config.app.version || "1.0.0",
          },
          version: config.version || CONFIG_CONSTANTS.CURRENT_VERSION,
        });

      const exportConfig = (
        config: AppDomainModel,
        format: "json" | "yaml" | "toml"
      ) => Effect.succeed(JSON.stringify(config, null, 2));

      const importConfig = (
        content: string,
        format: "json" | "yaml" | "toml"
      ) =>
        Effect.gen(function* () {
          let parsed: unknown;

          switch (format) {
            case "json":
              parsed = yield* Effect.try({
                try: () => JSON.parse(content),
                catch: (error) =>
                  new ConfigParseError({
                    message: "Failed to parse JSON",
                    cause: error as Error,
                  }),
              });
              break;
            case "yaml":
            case "toml":
              // For now, fallback to JSON parsing
              parsed = yield* Effect.try({
                try: () => JSON.parse(content),
                catch: (error) =>
                  new ConfigParseError({
                    message: "Failed to parse content",
                    cause: error as Error,
                  }),
              });
              break;
            default:
              yield* Effect.fail(
                new ConfigLoadError({
                  message: `Unsupported format: ${format}`,
                })
              );
          }

          const validated = yield* Schema.decodeUnknown(AppConfigSchema)(
            parsed
          ).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Imported config validation failed",
                  cause: error,
                })
            )
          );

          return validated as AppDomainModel;
        });

      const resetToDefaults = () =>
        Effect.gen(function* () {
          const defaultConfig = createDefaultAppConfig();
          yield* saveConfig(defaultConfig);
          return defaultConfig;
        });

      const getConfigMetadata = (config: AppDomainModel) =>
        Effect.succeed({
          version: config.version,
          size: JSON.stringify(config).length,
          lastModified: new Date(),
        });

      const detectConfigVersion = (config: unknown) =>
        Effect.succeed(
          typeof config === "object" &&
            config !== null &&
            "version" in config &&
            typeof (config as { version: unknown }).version === "string"
            ? (config as { version: string }).version
            : "1.0.0"
        );

      const migrateConfig = (config: unknown, targetVersion: string) =>
        Effect.gen(function* () {
          // For now, just validate and return the config
          const validated = yield* Schema.decodeUnknown(AppConfigSchema)(
            config
          ).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Migration validation failed",
                  cause: error,
                })
            )
          );

          return validated as AppDomainModel;
        });

      return {
        getConfig,
        saveConfig,
        validateConfig,
        loadConfig,
        createDefaultConfig,
        mergeConfigs,
        setConfigPath,
        getConfigPath,
        reloadConfig,
        checkConfigHealth,
        repairConfig,
        exportConfig,
        importConfig,
        resetToDefaults,
        getConfigMetadata,
        detectConfigVersion,
        migrateConfig,
        state: stateRef,
      };
    }),
    dependencies: [],
  }
) {}
