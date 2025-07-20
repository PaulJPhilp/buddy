import type { ChatAppConfig } from "@/features/application/types/AppConfig";

// Type guards for safe property access
export function isChatAppLike(obj: unknown): obj is {
  id: string;
  name: string;
  agentId?: string;
  toolbarId?: string;
  themeId?: string;
  description?: string;
  version?: string;
  agent?: unknown;
  toolbar?: unknown;
  style?: unknown;
  updatedAt?: string;
  ownerId?: string;
  spaceId?: string;
  theme?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  agentIds?: string[];
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

// Safe property extractors
export function extractChatAppProperties(obj: unknown): {
  id: string;
  name: string;
  agentId?: string;
  toolbarId?: string;
  themeId?: string;
  description?: string;
  version?: string;
  agent?: unknown;
  toolbar?: unknown;
  style?: unknown;
  updatedAt?: string;
  ownerId?: string;
  spaceId?: string;
  theme?: unknown;
  isDefault?: boolean;
  isShared?: boolean;
  agentIds?: string[];
} | null {
  if (!isChatAppLike(obj)) {
    return null;
  }

  const record = obj as Record<string, unknown>;

  return {
    id: record.id as string,
    name: record.name as string,
    agentId: typeof record.agentId === "string" ? record.agentId : undefined,
    toolbarId:
      typeof record.toolbarId === "string" ? record.toolbarId : undefined,
    themeId: typeof record.themeId === "string" ? record.themeId : undefined,
    description:
      typeof record.description === "string" ? record.description : undefined,
    version: typeof record.version === "string" ? record.version : undefined,
    agent: record.agent,
    toolbar: record.toolbar,
    style: record.style,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    ownerId: typeof record.ownerId === "string" ? record.ownerId : undefined,
    spaceId: typeof record.spaceId === "string" ? record.spaceId : undefined,
    theme: record.theme,
    isDefault:
      typeof record.isDefault === "boolean" ? record.isDefault : undefined,
    isShared:
      typeof record.isShared === "boolean" ? record.isShared : undefined,
    agentIds: Array.isArray(record.agentIds) ? record.agentIds : undefined,
  };
}

export function chatAppConfigToRecord(
  config: ChatAppConfig
): Record<string, unknown> {
  // This conversion might be needed if you're passing ChatAppConfig objects
  // to external APIs that expect plain JSON records, not class instances.
  // It also flattens nested objects if they are Schema.Class instances.
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version,
    agentId: config.agentId,
    workspaceId: config.workspaceId,
    permissions: {
      canSendMessages: config.permissions.canSendMessages,
      canReceiveMessages: config.permissions.canReceiveMessages,
      canViewHistory: config.permissions.canViewHistory,
      canDeleteMessages: config.permissions.canDeleteMessages,
      canModifySettings: config.permissions.canModifySettings,
      canShareConversations: config.permissions.canShareConversations,
    },
    isDefault: config.isDefault,
    isShared: config.isShared,
    isArchived: config.isArchived,
    plugins: config.plugins,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    metadata: config.metadata,
    theme: config.theme, // Assuming theme is already a plain object or can be directly serialized
    // Add any other top-level properties from ChatAppConfig that need to be included
  };
}
