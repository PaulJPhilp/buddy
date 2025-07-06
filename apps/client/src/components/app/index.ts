// Main exports
export type { AppComponentApi } from "./api";
export {
  AppConfigLoadError,
  AppConfigValidationError,
  AppInitializationError,
  AppShellRenderError,
  AppStateError,
  AppWorkspaceError,
} from "./errors";
export type { AppComponentError } from "./errors";
export { AppComponent } from "./service";
export type {
  AppComponentConfig,
  AppComponentState,
  AppLifecycleState,
} from "./types";
export { APP_LIFECYCLE, createDefaultAppState } from "./types";

// React components
export { AppContainer, useAppContainer } from "./AppContainer";
export type { AppContainerProps } from "./AppContainer";

// Integration components (for compatibility)
export { AppShellIntegration } from "./AppShellIntegration";
