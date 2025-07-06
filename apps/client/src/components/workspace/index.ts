// Main exports
export type { WorkspaceComponentApi } from "./api";
export {
  WorkspaceLoadError,
  WorkspaceChatAppError,
  WorkspaceAgentError,
  WorkspaceUIError,
  WorkspaceOperationError,
  WorkspaceStateError,
  WorkspaceValidationError,
  WorkspaceSwitchError,
  WorkspaceInitializationError,
  WorkspaceConfigurationError,
} from "./errors";
export type { WorkspaceComponentError } from "./errors";
export { WorkspaceComponent } from "./service";
export type {
  WorkspaceComponentConfig,
  WorkspaceComponentState,
} from "./types";
export { createDefaultWorkspaceState } from "./types";

// React components
export {
  WorkspaceContainer,
  useWorkspaceContainer,
} from "./WorkspaceContainer";
export type { WorkspaceContainerProps } from "./WorkspaceContainer";
