import { Effect } from "effect";
import type {
  ConfigLifecycleContext,
  ConfigLifecycleServiceError,
} from "./errors";
import type { ChatAppConfig } from "./types";

export interface ConfigLifecycleServiceApi {
  // Core config management
  readonly loadConfigs: () => Effect.Effect<
    ChatAppConfig[],
    ConfigLifecycleServiceError
  >;
  readonly addConfig: (
    config: ChatAppConfig,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;
  readonly deleteConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;

  // State management
  readonly setActive: (configId: string | null) => Effect.Effect<void>;
  readonly toggleOpen: (configId: string) => Effect.Effect<void>;
  readonly setDisplayMode: (
    mode: "expanded" | "compact",
  ) => Effect.Effect<void>;
  readonly getState: () => Effect.Effect<ConfigLifecycleContext>;
  readonly subscribe: (
    callback: (state: ConfigLifecycleContext) => void,
  ) => Effect.Effect<{ unsubscribe: () => void }>;

  // File watching
  readonly startFileWatcher: () => Effect.Effect<void>;
  readonly stopFileWatcher: () => Effect.Effect<void>;

  // Enhanced editing features
  readonly updateConfigImmediate: (
    configId: string,
    updates: Partial<ChatAppConfig>,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;
  readonly updateConfigWithSave: (
    configId: string,
    updates: Partial<ChatAppConfig>,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;
  readonly saveConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;
  readonly revertConfig: (
    configId: string,
  ) => Effect.Effect<void, ConfigLifecycleServiceError>;
  readonly toggleAutoSave: () => Effect.Effect<void>;
  readonly getSaveStatus: (
    configId: string,
  ) => Effect.Effect<"saved" | "saving" | "dirty" | "error">;
}
