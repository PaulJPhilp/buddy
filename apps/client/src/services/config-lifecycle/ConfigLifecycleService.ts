import { ChatAppConfig } from "@/types/global";
import { createStore } from "@xstate/store";
import { Effect, Ref, Schema } from "effect";

// State machine context with save status tracking
interface ConfigLifecycleContext {
  readonly configs: ChatAppConfig[];
  readonly activeConfigId: string | null;
  readonly displayMode: "expanded" | "compact";
  readonly openConfigs: Set<string>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastModified: number;

  // New: Save status tracking
  readonly saveStatus: Record<string, "saved" | "saving" | "dirty" | "error">;
  readonly pendingSaves: Record<string, ChatAppConfig>;
  readonly autoSaveEnabled: boolean;
  readonly lastSaved: Record<string, number>;
}

// Events
type ConfigLifecycleEvent =
  | { type: "LOAD_CONFIGS" }
  | { type: "CONFIGS_LOADED"; configs: ChatAppConfig[]; lastModified: number }
  | { type: "ADD_CONFIG"; config: ChatAppConfig }
  | { type: "UPDATE_CONFIG"; configId: string; updates: Partial<ChatAppConfig> }
  | {
      type: "UPDATE_CONFIG_IMMEDIATE";
      configId: string;
      updates: Partial<ChatAppConfig>;
    }
  | { type: "DELETE_CONFIG"; configId: string }
  | { type: "SET_ACTIVE"; configId: string | null }
  | { type: "TOGGLE_OPEN"; configId: string }
  | { type: "SET_DISPLAY_MODE"; mode: "expanded" | "compact" }
  | { type: "SAVE_SUCCESS"; configId: string }
  | { type: "SAVE_START"; configId: string }
  | { type: "SAVE_ERROR"; configId: string; error: string }
  | { type: "SET_DIRTY"; configId: string }
  | { type: "TOGGLE_AUTO_SAVE" }
  | { type: "ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "FILE_CHANGED"; lastModified: number }
  | { type: "REVERT_CONFIG"; configId: string };

// Error types (reusing from original service)
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
  // Original methods
  readonly loadConfigs: () => Effect.Effect<ChatAppConfig[], ConfigLoadError>;
  readonly addConfig: (
    config: ChatAppConfig,
  ) => Effect.Effect<void, ConfigSaveError | ConfigValidationError>;
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

  // Enhanced methods for real-time editing
  readonly updateConfigImmediate: (
    configId: string,
    updates: Partial<ChatAppConfig>,
  ) => Effect.Effect<
    void,
    ConfigSaveError | ConfigValidationError | ConcurrentModificationError
  >;
  readonly updateConfigWithSave: (
    configId: string,
    updates: Partial<ChatAppConfig>,
  ) => Effect.Effect<
    void,
    ConfigSaveError | ConfigValidationError | ConcurrentModificationError
  >;
  readonly saveConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigSaveError>;
  readonly revertConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigLoadError>;
  readonly toggleAutoSave: () => Effect.Effect<void>;
  readonly getSaveStatus: (
    configId: string,
  ) => Effect.Effect<"saved" | "saving" | "dirty" | "error">;
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
    saveStatus: {},
    pendingSaves: {},
    autoSaveEnabled: true,
    lastSaved: {},
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
      ) => {
        // Reset save status for loaded configs
        const newSaveStatus: Record<
          string,
          "saved" | "saving" | "dirty" | "error"
        > = {};
        const newLastSaved: Record<string, number> = {};

        for (const config of event.configs) {
          newSaveStatus[config.id] = "saved";
          newLastSaved[config.id] = event.lastModified;
        }

        return {
          ...context,
          configs: event.configs,
          lastModified: event.lastModified,
          loading: false,
          error: null,
          saveStatus: newSaveStatus,
          lastSaved: newLastSaved,
          pendingSaves: {}, // Clear pending saves on reload
        };
      },
      ADD_CONFIG: (context, event: { config: ChatAppConfig }) => ({
        ...context,
        configs: [...context.configs, event.config],
        saveStatus: {
          ...context.saveStatus,
          [event.config.id]: "dirty",
        },
        loading: true,
      }),
      UPDATE_CONFIG: (
        context,
        event: { configId: string; updates: Partial<ChatAppConfig> },
      ) => {
        const updatedConfigs = context.configs.map((config) =>
          config.id === event.configId
            ? { ...config, ...event.updates }
            : config,
        );

        return {
          ...context,
          configs: updatedConfigs,
          saveStatus: {
            ...context.saveStatus,
            [event.configId]: "dirty",
          },
          pendingSaves: {
            ...context.pendingSaves,
            [event.configId]:
              updatedConfigs.find((c) => c.id === event.configId) ??
              updatedConfigs[0],
          },
        };
      },
      UPDATE_CONFIG_IMMEDIATE: (
        context,
        event: { configId: string; updates: Partial<ChatAppConfig> },
      ) => {
        const updatedConfigs = context.configs.map((config) =>
          config.id === event.configId
            ? { ...config, ...event.updates }
            : config,
        );

        return {
          ...context,
          configs: updatedConfigs,
          saveStatus: {
            ...context.saveStatus,
            [event.configId]: "saving",
          },
          loading: true,
        };
      },
      DELETE_CONFIG: (context, event: { configId: string }) => {
        const newOpenConfigs = new Set(context.openConfigs);
        newOpenConfigs.delete(event.configId);

        const newSaveStatus = { ...context.saveStatus };
        delete newSaveStatus[event.configId];

        const newPendingSaves = { ...context.pendingSaves };
        delete newPendingSaves[event.configId];

        const newLastSaved = { ...context.lastSaved };
        delete newLastSaved[event.configId];

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
          saveStatus: newSaveStatus,
          pendingSaves: newPendingSaves,
          lastSaved: newLastSaved,
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
      SAVE_START: (context, event: { configId: string }) => ({
        ...context,
        saveStatus: {
          ...context.saveStatus,
          [event.configId]: "saving",
        },
        loading: false,
      }),
      SAVE_SUCCESS: (context, event: { configId: string }) => {
        const newPendingSaves = { ...context.pendingSaves };
        delete newPendingSaves[event.configId];

        return {
          ...context,
          saveStatus: {
            ...context.saveStatus,
            [event.configId]: "saved",
          },
          pendingSaves: newPendingSaves,
          lastSaved: {
            ...context.lastSaved,
            [event.configId]: Date.now(),
          },
          loading: false,
          error: null,
        };
      },
      SAVE_ERROR: (context, event: { configId: string; error: string }) => ({
        ...context,
        saveStatus: {
          ...context.saveStatus,
          [event.configId]: "error",
        },
        error: event.error,
        loading: false,
      }),
      SET_DIRTY: (context, event: { configId: string }) => ({
        ...context,
        saveStatus: {
          ...context.saveStatus,
          [event.configId]: "dirty",
        },
      }),
      TOGGLE_AUTO_SAVE: (context) => ({
        ...context,
        autoSaveEnabled: !context.autoSaveEnabled,
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
      REVERT_CONFIG: (context, event: { configId: string }) => {
        const newPendingSaves = { ...context.pendingSaves };
        delete newPendingSaves[event.configId];

        return {
          ...context,
          saveStatus: {
            ...context.saveStatus,
            [event.configId]: "saved",
          },
          pendingSaves: newPendingSaves,
        };
      },
    },
  });
};

// File operations (reusing from original service)
const loadConfigsFromFiles = Effect.gen(function* () {
  const response = yield* Effect.tryPromise({
    try: () => fetch("/api/configs"),
    catch: (error) =>
      new ConfigLoadError({
        message: "Failed to fetch config list",
        cause: error,
      }),
  });

  if (!response.ok) {
    return yield* Effect.fail(
      new ConfigLoadError({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }),
    );
  }

  const filesData = yield* Effect.tryPromise({
    try: () =>
      response.json() as Promise<
        Array<{ name: string; lastModified: number; size: number }>
      >,
    catch: (error) =>
      new ConfigLoadError({
        message: "Failed to parse config list",
        cause: error,
      }),
  });

  // Extract just the filenames from the file objects
  const files = filesData.map((f) => f.name);

  const configs: ChatAppConfig[] = [];
  let lastModified = 0;

  for (const file of files) {
    if (file === "index.json") continue;

    const configResponse = yield* Effect.tryPromise({
      try: () => fetch(`/api/configs?file=${encodeURIComponent(file)}`),
      catch: (error) =>
        new ConfigLoadError({
          message: `Failed to fetch config file: ${file}`,
          cause: error,
        }),
    });

    if (!configResponse.ok) continue;

    const configText = yield* Effect.tryPromise({
      try: () => configResponse.text(),
      catch: (error) =>
        new ConfigLoadError({
          message: `Failed to read config file: ${file}`,
          cause: error,
        }),
    });

    try {
      const configData = JSON.parse(configText);

      // Handle new direct format only
      const validatedConfig = yield* ChatAppConfig.parse(configData).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );

      if (validatedConfig) {
        // Theme is already embedded in the config in the new format
        configs.push(validatedConfig);
      }

      const fileModified = configResponse.headers.get("last-modified");
      if (fileModified) {
        const modifiedTime = new Date(fileModified).getTime();
        if (modifiedTime > lastModified) {
          lastModified = modifiedTime;
        }
      }
    } catch {}
  }

  return { configs, lastModified: lastModified || Date.now() };
});

const saveConfigToFile = (config: ChatAppConfig, filename?: string) =>
  Effect.gen(function* () {
    const configFilename = filename || `${config.id}.json`;

    // Use new flattened format: file is the config directly
    const configData = {
      ...config,
      // Add metadata
      version: config.version || "1.0.0",
      updatedAt: new Date().toISOString(),
    };

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/configs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: configFilename,
            data: configData,
          }),
        }),
      catch: (error) =>
        new ConfigSaveError({
          message: "Failed to save config",
          cause: error,
        }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new ConfigSaveError({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }),
      );
    }

    return config;
  });

// Debounce utility
const createDebouncer = (delayMs: number) => {
  const timeouts = new Map<string, NodeJS.Timeout>();

  return {
    debounce: <T extends unknown[]>(
      key: string,
      fn: (...args: T) => Effect.Effect<void, any>,
      ...args: T
    ) =>
      Effect.gen(function* () {
        // Clear existing timeout
        const existingTimeout = timeouts.get(key);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout
        yield* Effect.async<void>((resume) => {
          const timeout = setTimeout(() => {
            timeouts.delete(key);
            Effect.runPromise(fn(...args)).then(
              () => resume(Effect.succeed(undefined)),
              (error) => resume(Effect.fail(error)),
            );
          }, delayMs);

          timeouts.set(key, timeout);
        });
      }),

    cancel: (key: string) =>
      Effect.sync(() => {
        const timeout = timeouts.get(key);
        if (timeout) {
          clearTimeout(timeout);
          timeouts.delete(key);
        }
      }),

    cancelAll: () =>
      Effect.sync(() => {
        for (const timeout of timeouts.values()) {
          clearTimeout(timeout);
        }
        timeouts.clear();
      }),
  };
};

// Enhanced ConfigLifecycleService
export class ConfigLifecycleService extends Effect.Service<ConfigLifecycleServiceApi>()(
  "ConfigLifecycleService",
  {
    scoped: Effect.gen(function* () {
      const store = createConfigStore();
      const fileWatcherRef = yield* Ref.make<AbortController | null>(null);
      const debouncer = createDebouncer(2000); // 2 second debounce

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
          yield* ChatAppConfig.parse(config).pipe(
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

          // Save to file immediately for new configs
          yield* saveConfigToFile(config).pipe(
            Effect.tap(() =>
              Effect.sync(() =>
                store.send({ type: "SAVE_SUCCESS", configId: config.id }),
              ),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({
                  type: "SAVE_ERROR",
                  configId: config.id,
                  error: error.message,
                });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const updateConfigImmediate = (
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
          yield* ChatAppConfig.parse(updatedConfig).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Invalid config after update",
                  cause: error,
                }),
            ),
          );

          // Update in store (marks as dirty)
          store.send({ type: "UPDATE_CONFIG", configId, updates });

          // Schedule debounced save if auto-save is enabled
          const state = store.getSnapshot();
          if (state.context.autoSaveEnabled) {
            yield* debouncer.debounce(
              `save-${configId}`,
              (id: string) =>
                Effect.gen(function* () {
                  store.send({ type: "SAVE_START", configId: id });

                  const currentState = store.getSnapshot();
                  const configToSave = currentState.context.configs.find(
                    (c) => c.id === id,
                  );

                  if (configToSave) {
                    yield* saveConfigToFile(configToSave).pipe(
                      Effect.tap(() =>
                        Effect.sync(() =>
                          store.send({ type: "SAVE_SUCCESS", configId: id }),
                        ),
                      ),
                      Effect.catchAll((error) =>
                        Effect.sync(() => {
                          store.send({
                            type: "SAVE_ERROR",
                            configId: id,
                            error: error.message,
                          });
                          return Effect.fail(error);
                        }),
                      ),
                    );
                  }
                }),
              configId,
            );
          }
        });

      const updateConfigWithSave = (
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
          yield* ChatAppConfig.parse(updatedConfig).pipe(
            Effect.mapError(
              (error) =>
                new ConfigValidationError({
                  message: "Invalid config after update",
                  cause: error,
                }),
            ),
          );

          // Update in store and save immediately
          store.send({ type: "UPDATE_CONFIG_IMMEDIATE", configId, updates });

          // Cancel any pending debounced save
          yield* debouncer.cancel(`save-${configId}`);

          // Save immediately
          yield* saveConfigToFile(updatedConfig).pipe(
            Effect.tap(() =>
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS", configId })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({
                  type: "SAVE_ERROR",
                  configId,
                  error: error.message,
                });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const saveConfig = (configId: string) =>
        Effect.gen(function* () {
          const currentState = store.getSnapshot();
          const config = currentState.context.configs.find(
            (c) => c.id === configId,
          );

          if (!config) {
            return yield* Effect.fail(
              new ConfigSaveError({
                message: `Config not found: ${configId}`,
              }),
            );
          }

          // Cancel any pending debounced save
          yield* debouncer.cancel(`save-${configId}`);

          store.send({ type: "SAVE_START", configId });

          yield* saveConfigToFile(config).pipe(
            Effect.tap(() =>
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS", configId })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({
                  type: "SAVE_ERROR",
                  configId,
                  error: error.message,
                });
                return Effect.fail(error);
              }),
            ),
          );
        });

      const revertConfig = (configId: string) =>
        Effect.gen(function* () {
          // Cancel any pending saves
          yield* debouncer.cancel(`save-${configId}`);

          // Reload configs from files
          const result = yield* loadConfigsFromFiles;
          const originalConfig = result.configs.find((c) => c.id === configId);

          if (!originalConfig) {
            return yield* Effect.fail(
              new ConfigLoadError({
                message: `Original config not found: ${configId}`,
              }),
            );
          }

          // Update store with original config
          store.send({
            type: "UPDATE_CONFIG_IMMEDIATE",
            configId,
            updates: originalConfig,
          });

          store.send({ type: "REVERT_CONFIG", configId });
        });

      const deleteConfig = (configId: string) =>
        Effect.gen(function* () {
          // Cancel any pending saves
          yield* debouncer.cancel(`save-${configId}`);

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
              Effect.sync(() => store.send({ type: "SAVE_SUCCESS", configId })),
            ),
            Effect.catchAll((error) =>
              Effect.sync(() => {
                store.send({
                  type: "SAVE_ERROR",
                  configId,
                  error: error.message,
                });
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

      const toggleAutoSave = () =>
        Effect.sync(() => {
          store.send({ type: "TOGGLE_AUTO_SAVE" });
        });

      const getSaveStatus = (configId: string) =>
        Effect.sync(() => {
          const state = store.getSnapshot();
          return state.context.saveStatus[configId] || "saved";
        });

      const getState = () => Effect.sync(() => store.getSnapshot().context);

      const subscribe = (
        callback: (state: EnhancedConfigLifecycleContext) => void,
      ) =>
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
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* stopFileWatcher();
          yield* debouncer.cancelAll();
        }),
      );

      return {
        loadConfigs,
        addConfig,
        updateConfigImmediate,
        updateConfigWithSave,
        saveConfig,
        revertConfig,
        deleteConfig,
        setActive,
        toggleOpen,
        setDisplayMode,
        toggleAutoSave,
        getSaveStatus,
        getState,
        subscribe,
        startFileWatcher,
        stopFileWatcher,
      };
    }),
    dependencies: [],
  },
) {}

// Export the Live layer for convenience
export const ConfigLifecycleServiceLive = ConfigLifecycleService.Default;
