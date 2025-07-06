import type {
  CoreComponentConfig,
  CoreComponentState,
} from "@/components/core";
import type { AppDomainModel, WorkspaceModel } from "@domain/index";

// App component state (extends CoreComponentState)
export interface AppComponentState extends CoreComponentState {
  readonly appConfig: AppDomainModel | null;
  readonly currentWorkspaceId: string | null;
  readonly isConfigLoaded: boolean;
  readonly isAppShellRendered: boolean;
}

// App component configuration (extends CoreComponentConfig)
export interface AppComponentConfig extends CoreComponentConfig {
  readonly configPath: string;
  readonly autoLoadConfig?: boolean;
  readonly autoRenderShell?: boolean;
}

// App lifecycle states
export const APP_LIFECYCLE = {
  UNINITIALIZED: "uninitialized",
  LOADING_CONFIG: "loading_config",
  CONFIG_LOADED: "config_loaded",
  RENDERING_SHELL: "rendering_shell",
  SHELL_RENDERED: "shell_rendered",
  READY: "ready",
  ERROR: "error",
} as const;

export type AppLifecycleState =
  (typeof APP_LIFECYCLE)[keyof typeof APP_LIFECYCLE];

// Default app component state
export function createDefaultAppState(): AppComponentState {
  return {
    isInitialized: false,
    isLoading: false,
    lastUpdated: Date.now(),
    appConfig: null,
    currentWorkspaceId: null,
    isConfigLoaded: false,
    isAppShellRendered: false,
  };
}
