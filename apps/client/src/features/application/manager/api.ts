import type { AppDomainModel } from "./types";
import type { Workspace as WorkspaceModel } from "@buddy/config/types/workspace";
import { Effect } from "effect";
import type {
  AppComponentError,
  ConfigLoadError,
  ConfigParseError,
  ConfigValidationError,
  ConfigSaveError,
} from "./errors";
import type { AppComponentConfig, AppComponentState } from "./types";

/**
 * ApplicationManager API - Core application lifecycle and configuration
 * 
 * This is the minimal interface currently implemented by ApplicationManager.
 * Additional methods from AppComponentApi will be added as needed.
 */
export interface ApplicationManagerApi {
  // Configuration loading
  readonly loadConfig: (
    configPath?: string
  ) => Effect.Effect<
    AppDomainModel,
    ConfigLoadError | ConfigParseError | ConfigValidationError | Error
  >;
  readonly getAppConfig: () => Effect.Effect<AppDomainModel | null, never>;
  readonly getState: () => Effect.Effect<AppComponentState, never>;
  readonly saveAppConfig: (
    config: AppDomainModel
  ) => Effect.Effect<AppDomainModel, ConfigSaveError | Error>;
}

/**
 * Extended API for future implementation
 * 
 * @deprecated Use ApplicationManagerApi for current implementation
 */
export interface AppComponentApi extends ApplicationManagerApi {
  // Core component lifecycle
  readonly initialize: (
    config: AppComponentConfig
  ) => Effect.Effect<void, AppComponentError>;
  readonly setState: (
    state: Partial<AppComponentState>
  ) => Effect.Effect<void, AppComponentError>;
  readonly subscribe: (
    callback: (state: AppComponentState) => void
  ) => Effect.Effect<() => void, AppComponentError>;
  readonly cleanup: () => Effect.Effect<void, AppComponentError>;

  // Additional configuration
  readonly reloadConfig: () => Effect.Effect<AppDomainModel, AppComponentError>;

  // Workspace management
  readonly setCurrentWorkspace: (
    workspaceId: string
  ) => Effect.Effect<void, AppComponentError>;
  readonly getCurrentWorkspace: () => Effect.Effect<
    WorkspaceModel | null,
    AppComponentError
  >;
  readonly getWorkspaces: () => Effect.Effect<
    WorkspaceModel[],
    AppComponentError
  >;

  // App shell rendering
  readonly renderAppShell: () => Effect.Effect<void, AppComponentError>;
  readonly isAppShellRendered: () => Effect.Effect<boolean, AppComponentError>;
}
