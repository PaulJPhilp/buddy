import type { AppDomainModel, WorkspaceModel } from "@domain/index";
import { Effect } from "effect";
import type { AppComponentError } from "./errors";
import type { AppComponentConfig, AppComponentState } from "./types";

export interface AppComponentApi {
  // Core component lifecycle (similar to CoreComponentApi but with App-specific types)
  readonly initialize: (
    config: AppComponentConfig
  ) => Effect.Effect<void, AppComponentError>;
  readonly getState: () => Effect.Effect<AppComponentState, AppComponentError>;
  readonly setState: (
    state: Partial<AppComponentState>
  ) => Effect.Effect<void, AppComponentError>;
  readonly subscribe: (
    callback: (state: AppComponentState) => void
  ) => Effect.Effect<() => void, AppComponentError>;
  readonly cleanup: () => Effect.Effect<void, AppComponentError>;

  // Configuration loading
  readonly loadConfig: (
    configPath?: string
  ) => Effect.Effect<AppDomainModel, AppComponentError>;
  readonly reloadConfig: () => Effect.Effect<AppDomainModel, AppComponentError>;
  readonly getAppConfig: () => Effect.Effect<
    AppDomainModel | null,
    AppComponentError
  >;

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
