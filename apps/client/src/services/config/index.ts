// Main exports
export type { ConfigServiceApi } from "./api";
export {
  ConfigLoadError,
  ConfigSaveError,
  ConfigValidationError,
  ConfigParseError,
  ConfigWatchError,
  ConfigTemplateError,
  ConfigMergeError,
  ConfigBackupError,
  ConfigRestoreError,
  ConfigMigrationError,
  ConfigExportError,
  ConfigImportError,
  ConfigHealthError,
  ConfigRepairError,
  ConfigResetError,
  ConfigFileSystemError,
  ConfigPermissionError,
  ConfigNetworkError,
  ConfigTimeoutError,
} from "./errors";
export type { ConfigServiceError } from "./errors";
export { ConfigService } from "./service";
export type {
  AppDomainModel,
  AppMetadata,
  WorkspaceModel,
  WorkspacePermissions,
  ChatAppModel,
  ChatAppPermissions,
  AgentModel,
  AgentParameters,
  AgentPermissions,
  AppConfigValidationResult,
  ConfigValidationIssue,
  ConfigValidationWarning,
  ConfigValidationSuggestion,
  ConfigLoadOptions,
  ConfigSaveOptions,
  ConfigWatchOptions,
  ConfigMergeOptions,
  ConfigValidationOptions,
  ConfigTemplate,
  ConfigTemplateVariable,
  ConfigTemplateValidation,
} from "./types";

// Export functions that actually exist in types.ts
export {
  CONFIG_CONSTANTS,
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
} from "./types";

// Re-export domain model functions
export {
  generateWorkspaceId,
  generateChatAppId,
  generateAgentId,
  createWorkspaceModel as createDefaultWorkspaceConfig,
  createChatAppModel as createDefaultChatAppConfig,
  createAgentModel as createDefaultAgentConfig,
} from "@domain/index";

// Generate a config ID function (since it doesn't exist)
export function generateConfigId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
