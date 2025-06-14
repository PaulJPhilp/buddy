import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import { ChatAppConfigSchema } from "@/schemas/ChatAppConfigSchema";
import { createStore } from "@xstate/store";
import { Effect, Ref, Schema } from "effect";

// State machine context
interface ConfigLifecycleContext {
  readonly configs: ChatAppConfig[];
  readonly activeConfigId: string | null;
  readonly displayMode: "expanded" | "compact";
  readonly openConfigs: Set<string>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastModified: number;
}

// Events
type ConfigLifecycleEvent =
  | { type: "LOAD_CONFIGS" }
  | { type: "CONFIGS_LOADED"; configs: ChatAppConfig[]; lastModified: number }
  | { type: "ADD_CONFIG"; config: ChatAppConfig }
  | { type: "UPDATE_CONFIG"; configId: string; updates: Partial<ChatAppConfig> }
  | { type: "DELETE_CONFIG"; configId: string }
  | { type: "SET_ACTIVE"; configId: string | null }
  | { type: "TOGGLE_OPEN"; configId: string }
  | { type: "SET_DISPLAY_MODE"; mode: "expanded" | "compact" }
  | { type: "SAVE_SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "FILE_CHANGED"; lastModified: number };

// Error types
export class ConfigLoadError extends Schema.TaggedError<ConfigLoadError>()(
  "ConfigLoadError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConfigSaveError extends Schema.TaggedError<ConfigSaveError>()(
  "ConfigSaveError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConfigValidationError extends Schema.TaggedError<ConfigValidationError>()(
  "ConfigValidationError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConcurrentModificationError extends Schema.TaggedError<ConcurrentModificationError>()(
  "ConcurrentModificationError",
  {
    message: Schema.String,
    expectedVersion: Schema.Number,
    actualVersion: Schema.Number,
  },
) {}

// Service API
export interface ConfigLifecycleServiceApi {
  readonly loadConfigs: () => Effect.Effect<ChatAppConfig[], ConfigLoadError>;
  readonly addConfig: (
    config: ChatAppConfig,
  ) => Effect.Effect<void, ConfigSaveError | ConfigValidationError>;
  readonly updateConfig: (
    configId: string,
    updates: Partial<ChatAppConfig>,
  ) => Effect.Effect<
    void,
    ConfigSaveError | ConfigValidationError | ConcurrentModificationError
  >;
  readonly deleteConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigSaveError>;
  readonly setActive: (configId: string | null) => Effect.Effect<void>;
  readonly toggleOpen: (configId: string) => Effect.Effect<void>;
  readonly setDisplayMode: (
    mode: "expanded" | "compact",
  ) => Effect.Effect<void>;
  readonly getState: () => Effect.Effect<ConfigLifecycleContext>;
  readonly subscribe: (
    callback: (state: ConfigLifecycleContext) => void,
  ) => Effect.Effect<{ unsubscribe: () => void }>;
  readonly startFileWatcher: () => Effect.Effect<void>;
  readonly stopFileWatcher: () => Effect.Effect<void>;
}

// XState store configuration
const createConfigStore = () => {
  const initialContext: ConfigLifecycleContext = {
    configs: [],
    activeConfigId: null,
    displayMode: "expanded",
    openConfigs: new Set(),
    loading: false,
    error: null,
    lastModified: 0,
  };

  return createStore({
    context: initialContext,
    on: {
      LOAD_CONFIGS: (context) => ({
        ...context,
        loading: true,
        error: null,
      }),
      CONFIGS_LOADED: (
        context,
        event: { configs: ChatAppConfig[]; lastModified: number },
      ) => ({
        ...context,
        configs: event.configs,
        lastModified: event.lastModified,
        loading: false,
        error: null,
      }),
      ADD_CONFIG: (context, event: { config: ChatAppConfig }) => ({
        ...context,
        configs: [...context.configs, event.config],
        loading: true,
      }),
      UPDATE_CONFIG: (
        context,
        event: { configId: string; updates: Partial<ChatAppConfig> },
      ) => ({
        ...context,
        configs: context.configs.map((config) =>
          config.id === event.configId
            ? { ...config, ...event.updates }
            : config,
        ),
        loading: true,
      }),
      DELETE_CONFIG: (context, event: { configId: string }) => {
        const newOpenConfigs = new Set(context.openConfigs);
        newOpenConfigs.delete(event.configId);
        return {
          ...context,
          configs: context.configs.filter(
            (config) => config.id !== event.configId,
          ),
          activeConfigId:
            context.activeConfigId === event.configId
              ? null
              : context.activeConfigId,
          openConfigs: newOpenConfigs,
          loading: true,
        };
      },
      SET_ACTIVE: (context, event: { configId: string | null }) => ({
        ...context,
        activeConfigId: event.configId,
      }),
      TOGGLE_OPEN: (context, event: { configId: string }) => {
        const newSet = new Set(context.openConfigs);
        if (newSet.has(event.configId)) {
          newSet.delete(event.configId);
        } else {
          newSet.add(event.configId);
        }
        return {
          ...context,
          openConfigs: newSet,
        };
      },
      SET_DISPLAY_MODE: (context, event: { mode: "expanded" | "compact" }) => ({
        ...context,
        displayMode: event.mode,
      }),
      SAVE_SUCCESS: (context) => ({
        ...context,
        loading: false,
        error: null,
      }),
      ERROR: (context, event: { error: string }) => ({
        ...context,
        error: event.error,
        loading: false,
      }),
      CLEAR_ERROR: (context) => ({
        ...context,
        error: null,
      }),
      FILE_CHANGED: (context, event: { lastModified: number }) => ({
        ...context,
        lastModified: event.lastModified,
      }),
    },
  });
};

// File operations
const loadConfigsFromFiles = Effect.gen(function* () {
  try {
    // Get list of config files
    const filesResponse = yield* Effect.tryPromise({
      try: () => fetch("/api/configs"),
      catch: (error) =>
        new ConfigLoadError({
          message: "Failed to fetch config file list",
          cause: error,
        }),
    });

    if (!filesResponse.ok) {
      return yield* Effect.fail(
        new ConfigLoadError({
          message: `HTTP ${filesResponse.status}: ${filesResponse.statusText}`,
        }),
      );
    }

    const filesData = yield* Effect.tryPromise({
      try: () =>
        filesResponse.json() as Promise<
          Array<{ name: string; lastModified: number; size: number }>
        >,
      catch: (error) =>
        new ConfigLoadError({
          message: "Failed to parse config file list",
          cause: error,
        }),
    });

    const files = filesData.map((f) => f.name);

    // Load each config file
    const allConfigs: ChatAppConfig[] = [];
    let lastModified = 0;

    for (const filename of files) {
      if (filename === "index.json") continue;

      const configResponse = yield* Effect.tryPromise({
        try: () => fetch(`/api/configs?file=${encodeURIComponent(filename)}`),
        catch: (error) =>
          new ConfigLoadError({
            message: `Failed to fetch config file: ${filename}`,
            cause: error,
          }),
      });

      if (!configResponse.ok) continue;

      const configText = yield* Effect.tryPromise({
        try: () => configResponse.text(),
        catch: (error) =>
          new ConfigLoadError({
            message: `Failed to read config file: ${filename}`,
            cause: error,
          }),
      });

      const configData = yield* Effect.try({
        try: () => JSON.parse(configText),
        catch: (error) =>
          new ConfigLoadError({
            message: `Invalid JSON in config file: ${filename}`,
            cause: error,
          }),
      });

      // Extract chat apps and enrich with themes
      if (configData.chatApps && Array.isArray(configData.chatApps)) {
        for (const chatApp of configData.chatApps) {
          // Validate config structure
          const validatedConfig = yield* Schema.decodeUnknown(
            ChatAppConfigSchema,
          )(chatApp).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: `Invalid config structure in ${filename}`,
                  cause: error,
                }),
            ),
          );

          // Enrich with theme if available
          if (
            validatedConfig.themeId &&
            configData.themes &&
            configData.themes[validatedConfig.themeId]
          ) {
            allConfigs.push({
              ...validatedConfig,
              theme: configData.themes[validatedConfig.themeId],
            });
          } else {
            allConfigs.push(validatedConfig);
          }
        }
      }

      // Track last modified time (simplified - in real implementation, get from file stats)
      lastModified = Math.max(lastModified, Date.now());
    }

    return { configs: allConfigs, lastModified };
  } catch (error) {
    return yield* Effect.fail(
      new ConfigLoadError({
        message: "Unexpected error loading configs",
        cause: error,
      }),
    );
  }
});

const saveConfigToFile = (config: ChatAppConfig, filename?: string) =>
  Effect.gen(function* () {
    const configFilename = filename || `${config.id}.json`;

    // Create a complete config file structure
    const configFile = {
      chatApps: [config],
      themes: config.theme ? { [config.themeId]: config.theme } : {},
    };

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: configFilename,
            config: configFile,
          }),
        }),
      catch: (error) =>
        new ConfigSaveError({
          message: "Failed to save config to file",
          cause: error,
        }),
    });

    if (!response.ok) {
      const errorData = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => ({ error: "Unknown error" }),
      });
      return yield* Effect.fail(
        new ConfigSaveError({
          message: `HTTP ${response.status}: ${errorData.error || response.statusText}`,
        }),
      );
    }
  });

const updateConfigInFile = (
  config: ChatAppConfig,
  filename: string,
  lastModified: number,
) =>
  Effect.gen(function* () {
    // First, load the existing config file to preserve other chatApps and themes
    const existingResponse = yield* Effect.tryPromise({
      try: () => fetch(`/api/configs?file=${encodeURIComponent(filename)}`),
      catch: (error) =>
        new ConfigSaveError({
          message: "Failed to load existing config file",
          cause: error,
        }),
    });

    if (!existingResponse.ok) {
      return yield* Effect.fail(
        new ConfigSaveError({
          message: `Failed to load existing config: HTTP ${existingResponse.status}`,
        }),
      );
    }

    const existingConfigText = yield* Effect.tryPromise({
      try: () => existingResponse.text(),
      catch: (error) =>
        new ConfigSaveError({
          message: "Failed to read existing config file",
          cause: error,
        }),
    });

    const existingConfig = yield* Effect.try({
      try: () => JSON.parse(existingConfigText),
      catch: (error) =>
        new ConfigSaveError({
          message: "Invalid JSON in existing config file",
          cause: error,
        }),
    });

    // Update the specific chatApp in the existing config
    const updatedConfig = {
      ...existingConfig,
      chatApps: existingConfig.chatApps?.map((app: any) =>
        app.id === config.id ? config : app,
      ) || [config],
      themes: {
        ...existingConfig.themes,
        ...(config.theme ? { [config.themeId]: config.theme } : {}),
      },
    };

    // Save the updated config with concurrency control
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`/api/configs?file=${encodeURIComponent(filename)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Unmodified-Since": new Date(lastModified).toUTCString(),
          },
          body: JSON.stringify(updatedConfig),
        }),
      catch: (error) =>
        new ConfigSaveError({
          message: "Failed to update config file",
          cause: error,
        }),
    });

    if (!response.ok) {
      const errorData = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => ({ error: "Unknown error" }),
      });

      if (response.status === 409) {
        return yield* Effect.fail(
          new ConcurrentModificationError({
            message: "Config file was modified by another process",
            expectedVersion: lastModified,
            actualVersion: errorData.serverLastModified || 0,
          }),
        );
      }

      return yield* Effect.fail(
        new ConfigSaveError({
          message: `HTTP ${response.status}: ${errorData.error || response.statusText}`,
        }),
      );
    }
  });

// Service implementation
export class ConfigLifecycleService extends Effect.Service<ConfigLifecycleServiceApi>()(
  "ConfigLifecycleService",
  {
    scoped: Effect.gen(function* () {
      const store = createConfigStore();
      const fileWatcherRef = yield* Ref.make<AbortController | null>(null);

      const loadConfigs = () =>
        Effect.gen(function* () {
          store.send({ type: "LOAD_CONFIGS" });

          const result = yield* loadConfigsFromFiles;

          store.send({
            type: "CONFIGS_LOADED",
            configs: result.configs,
            lastModified: result.lastModified,
          });

          return result.configs;
        });

      const addConfig = (config: ChatAppConfig) =>
        Effect.gen(function* () {
          // Validate config
          yield* Schema.decodeUnknown(ChatAppConfigSchema)(config).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Invalid config structure",
                  cause: error,
                }),
            ),
          );

          // Add to store
          store.send({ type: "ADD_CONFIG", config });

          // Save to file
          yield* saveConfigToFile(config).pipe(
            Effect.tap(() =>
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS" })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({ type: "ERROR", error: error.message });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const updateConfig = (
        configId: string,
        updates: Partial<ChatAppConfig>,
      ) =>
        Effect.gen(function* () {
          const currentState = store.getSnapshot();
          const existingConfig = currentState.context.configs.find(
            (c) => c.id === configId,
          );

          if (!existingConfig) {
            return yield* Effect.fail(
              new ConfigSaveError({
                message: `Config not found: ${configId}`,
              }),
            );
          }

          const updatedConfig = { ...existingConfig, ...updates };

          // Validate updated config
          yield* Schema.decodeUnknown(ChatAppConfigSchema)(updatedConfig).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Invalid config after update",
                  cause: error,
                }),
            ),
          );

          // Update in store
          store.send({ type: "UPDATE_CONFIG", configId, updates });

          // Save to file
          yield* saveConfigToFile(updatedConfig).pipe(
            Effect.tap(() =>
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS" })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({ type: "ERROR", error: error.message });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const deleteConfig = (configId: string) =>
        Effect.gen(function* () {
          store.send({ type: "DELETE_CONFIG", configId });

          // TODO: Implement file deletion via API
          yield* Effect.tryPromise({
            try: () => fetch(`/api/configs/${configId}`, { method: "DELETE" }),
            catch: (error) =>
              new ConfigSaveError({
                message: "Failed to delete config file",
                cause: error,
              }),
          }).pipe(
            Effect.tap(() =>
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS" })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({ type: "ERROR", error: error.message });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const setActive = (configId: string | null) =>
        Effect.sync(() => {
          store.send({ type: "SET_ACTIVE", configId });
        });

      const toggleOpen = (configId: string) =>
        Effect.sync(() => {
          store.send({ type: "TOGGLE_OPEN", configId });
        });

      const setDisplayMode = (mode: "expanded" | "compact") =>
        Effect.sync(() => {
          store.send({ type: "SET_DISPLAY_MODE", mode });
        });

      const getState = () => Effect.sync(() => store.getSnapshot().context);

      const subscribe = (callback: (state: ConfigLifecycleContext) => void) =>
        Effect.sync(() => {
          return store.subscribe((snapshot) => {
            callback(snapshot.context);
          });
        });

      const startFileWatcher = () =>
        Effect.gen(function* () {
          const controller = new AbortController();
          yield* Ref.set(fileWatcherRef, controller);

          // Simple polling-based file watcher (in production, use proper file system events)
          const watchFiles = Effect.gen(function* () {
            while (!controller.signal.aborted) {
              yield* Effect.sleep(5000); // Check every 5 seconds

              const result = yield* loadConfigsFromFiles.pipe(
                Effect.catchAll(() =>
                  Effect.succeed({ configs: [], lastModified: 0 }),
                ),
              );

              const currentState = store.getSnapshot();
              if (result.lastModified > currentState.context.lastModified) {
                store.send({
                  type: "CONFIGS_LOADED",
                  configs: result.configs,
                  lastModified: result.lastModified,
                });
              }
            }
          });

          yield* Effect.fork(watchFiles);
        });

      const stopFileWatcher = () =>
        Effect.gen(function* () {
          const controller = yield* Ref.get(fileWatcherRef);
          if (controller) {
            controller.abort();
            yield* Ref.set(fileWatcherRef, null);
          }
        });

      // Cleanup on service disposal
      yield* Effect.addFinalizer(() => stopFileWatcher());

      return {
        loadConfigs,
        addConfig,
        updateConfig,
        deleteConfig,
        setActive,
        toggleOpen,
        setDisplayMode,
        getState,
        subscribe,
        startFileWatcher,
        stopFileWatcher,
      };
    }),
    dependencies: [],
  },
) {}
