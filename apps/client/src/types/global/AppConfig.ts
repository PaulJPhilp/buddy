/**
 * Comprehensive App Configuration Types
 * Re-exported from services/config/types for global use
 */

export type {
  AppDomainModel as AppConfig,
  AppMetadata,
  WorkspaceModel as WorkspaceConfig,
  WorkspacePermissions,
  ChatAppModel as ChatAppConfig,
  ChatAppPermissions,
  AgentModel as AgentConfig,
  AgentParameters,
  AgentPermissions,
  AppConfigValidationResult,
  ConfigValidationIssue as ConfigValidationError,
  ConfigValidationWarning,
  ConfigValidationSuggestion,
  ConfigLoadOptions,
  ConfigSaveOptions,
  ConfigWatchOptions,
  ConfigMergeOptions,
  ConfigValidationOptions,
} from "@services/config/types";

export {
  isValidConfigPath,
  isValidWorkspaceId,
  isValidChatAppId,
  isValidAgentId,
  isValidVersion,
  isValidUrl,
  isValidColor,
  isValidEmail,
  isValidTimestamp,
  getCurrentTimestamp,
  createDefaultAppConfig,
  generateWorkspaceId,
  generateChatAppId,
  generateAgentId,
  createWorkspaceModel as createDefaultWorkspaceConfig,
  createChatAppModel as createDefaultChatAppConfig,
  createAgentModel as createDefaultAgentConfig,
} from "@services/config/types";
