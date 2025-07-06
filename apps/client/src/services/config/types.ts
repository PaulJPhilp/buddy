/**
 * Configuration Service Types
 * Uses clean domain models + config-specific operations
 * NO UI or layout concerns
 */

// Import clean domain models
import type { AppDomainModel } from "@domain/index";
import { createAppDomainModel } from "@domain/index";

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
} from "@domain/index";

// Configuration-specific types (not domain logic)
export interface ConfigLoadOptions {
  readonly validateOnLoad?: boolean;
  readonly mergeDefaults?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly backupOnLoad?: boolean;
  readonly format?: "json" | "yaml" | "toml";
}

export interface ConfigSaveOptions {
  readonly validateOnSave?: boolean;
  readonly createBackup?: boolean;
  readonly prettyPrint?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly format?: "json" | "yaml" | "toml";
}

export interface ConfigWatchOptions {
  readonly debounceMs?: number;
  readonly recursive?: boolean;
  readonly ignoreInitial?: boolean;
  readonly validateOnChange?: boolean;
  readonly reloadOnChange?: boolean;
}

export interface ConfigMergeOptions {
  readonly strategy?: "replace" | "merge" | "append";
  readonly conflictResolution?: "source" | "target" | "error";
  readonly preserveComments?: boolean;
  readonly validateResult?: boolean;
}

export interface ConfigValidationOptions {
  readonly strict?: boolean;
  readonly allowUnknownFields?: boolean;
  readonly validateReferences?: boolean;
  readonly checkDuplicates?: boolean;
  readonly validatePermissions?: boolean;
}

// Configuration validation results
export interface AppConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: ConfigValidationIssue[];
  readonly warnings: ConfigValidationWarning[];
  readonly suggestions: ConfigValidationSuggestion[];
}

export interface ConfigValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly severity: "error" | "warning" | "info";
}

export interface ConfigValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly suggestion?: string;
}

export interface ConfigValidationSuggestion {
  readonly field: string;
  readonly message: string;
  readonly suggestedValue?: unknown;
  readonly reason?: string;
}

// Configuration templates
export interface ConfigTemplate {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly category: string;
  readonly template: Partial<AppDomainModel>;
  readonly variables?: ConfigTemplateVariable[];
  readonly requirements?: string[];
  readonly tags?: string[];
  readonly isDefault?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ConfigTemplateVariable {
  readonly name: string;
  readonly description?: string;
  readonly type: "string" | "number" | "boolean" | "array" | "object";
  readonly defaultValue?: unknown;
  readonly required?: boolean;
  readonly validation?: ConfigTemplateValidation;
}

export interface ConfigTemplateValidation {
  readonly pattern?: string;
  readonly min?: number;
  readonly max?: number;
  readonly options?: unknown[];
  readonly customValidator?: string;
}

// Configuration constants
export const CONFIG_CONSTANTS = {
  DEFAULT_CONFIG_PATH: "/configs/index.json",
  CURRENT_VERSION: "1.0.0",
  MAX_BACKUP_COUNT: 10,
  DEFAULT_TIMEOUT: 5000,
  DEFAULT_RETRIES: 3,
} as const;

// Configuration utilities - delegate to domain models
export {
  generateWorkspaceId,
  generateChatAppId,
  generateAgentId,
  createWorkspaceModel,
  createChatAppModel,
  createAgentModel,
  validateAppConfiguration,
} from "@domain/index";

// Config-specific utilities
export function isValidConfigPath(path: string): boolean {
  return path.trim().length > 0 && path.includes(".");
}

export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidTimestamp(timestamp: string): boolean {
  return !Number.isNaN(Date.parse(timestamp));
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ID validation functions (delegate to domain models)
export function isValidWorkspaceId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function isValidChatAppId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function isValidAgentId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Default configuration factory
export function createDefaultAppConfig(): AppDomainModel {
  return createAppDomainModel({
    app: {
      name: "Buddy",
      version: "1.0.0",
      description: "AI Chat Application",
      author: "Buddy Team",
      environment: "development",
    },
    workspaces: [],
    chatapps: [],
    agents: [],
    version: CONFIG_CONSTANTS.CURRENT_VERSION,
  });
}
