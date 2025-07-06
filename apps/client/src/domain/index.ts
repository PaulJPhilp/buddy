/**
 * Domain Models Index
 * Exports all pure business domain models
 * These models contain NO UI, layout, or presentation concerns
 */

// Workspace domain
export type {
  WorkspaceModel,
  WorkspacePermissions,
  WorkspaceDomainOperations,
  WorkspaceValidation,
} from "./workspace";

export {
  createWorkspaceModel,
  updateWorkspaceModel,
  generateWorkspaceId,
  isValidWorkspaceName,
  isActiveWorkspace,
  canAddApp,
} from "./workspace";

// ChatApp domain
export type {
  ChatAppModel,
  ChatAppPermissions,
  ChatAppDomainOperations,
} from "./chatapp";

export {
  createChatAppModel,
  updateChatAppModel,
  generateChatAppId,
  isValidChatAppName,
  isActiveChatApp,
  canChatAppOperate,
} from "./chatapp";

// Agent domain
export type {
  AgentModel,
  AgentParameters,
  AgentPermissions,
  AgentDomainOperations,
} from "./agent";

export {
  createAgentModel,
  updateAgentModel,
  generateAgentId,
  isValidAgentName,
  isActiveAgent,
  canAgentAccessInternet,
  validateAgentParameters,
} from "./agent";

// App domain
export type { AppDomainModel, AppMetadata, AppDomainOperations } from "./app";

export {
  createAppDomainModel,
  updateAppDomainModel,
  getWorkspaceChatApps,
  getWorkspaceAgents,
  getActiveWorkspaces,
  validateAppConfiguration,
  getDefaultWorkspace,
} from "./app";
