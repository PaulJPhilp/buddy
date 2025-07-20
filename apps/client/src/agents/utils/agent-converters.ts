import type { AgentConfig } from "@/features/application/types/AppConfig";

export function isAgentLike(obj: unknown): obj is {
  id: string;
  name: string;
  description?: string;
  version?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  capabilities?: string[];
  parameters?: unknown;
  permissions?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: unknown;
} {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;

  return (
    "id" in record &&
    "name" in record &&
    typeof record.id === "string" &&
    typeof record.name === "string"
  );
}

export function extractAgentProperties(obj: unknown): {
  id: string;
  name: string;
  description?: string;
  version?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  capabilities?: string[];
  parameters?: unknown;
  permissions?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: unknown;
} | null {
  if (!isAgentLike(obj)) {
    return null;
  }

  const record = obj as Record<string, unknown>;

  return {
    id: record.id as string,
    name: record.name as string,
    description:
      typeof record.description === "string" ? record.description : undefined,
    version: typeof record.version === "string" ? record.version : undefined,
    provider: typeof record.provider === "string" ? record.provider : undefined,
    model: typeof record.model === "string" ? record.model : undefined,
    prompt: typeof record.prompt === "string" ? record.prompt : undefined,
    capabilities: Array.isArray(record.capabilities)
      ? record.capabilities
      : undefined,
    parameters: record.parameters,
    permissions: record.permissions,
    isDefault:
      typeof record.isDefault === "boolean" ? record.isDefault : undefined,
    isShared:
      typeof record.isShared === "boolean" ? record.isShared : undefined,
    isArchived:
      typeof record.isArchived === "boolean" ? record.isArchived : undefined,
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    metadata: record.metadata,
  };
}

export function agentConfigToRecord(
  config: AgentConfig
): Record<string, unknown> {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version,
    provider: config.provider,
    model: config.model,
    prompt: config.prompt,
    capabilities: config.capabilities,
    parameters: config.parameters,
    permissions: {
      canAccessInternet: config.permissions.canAccessInternet,
      canExecuteCode: config.permissions.canExecuteCode,
      canAccessFiles: config.permissions.canAccessFiles,
      canModifyFiles: config.permissions.canModifyFiles,
      canAccessDatabase: config.permissions.canAccessDatabase,
      canSendEmails: config.permissions.canSendEmails,
      allowedDomains: config.permissions.allowedDomains,
      blockedDomains: config.permissions.blockedDomains,
    },
    isDefault: config.isDefault,
    isShared: config.isShared,
    isArchived: config.isArchived,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    metadata: config.metadata,
  };
}
