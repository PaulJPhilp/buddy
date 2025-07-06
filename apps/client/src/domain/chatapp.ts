/**
 * Pure ChatApp Domain Model
 * Contains only business logic - no UI, styling, or presentation concerns
 */

// Core chat app business model
export interface ChatAppModel {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly agentId: string;
  readonly workspaceId?: string;
  readonly permissions: ChatAppPermissions;
  readonly isDefault?: boolean;
  readonly isShared?: boolean;
  readonly isArchived?: boolean;
  readonly plugins?: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: Record<string, unknown>;
}

// Business permissions for chat apps
export interface ChatAppPermissions {
  readonly canSendMessages: boolean;
  readonly canReceiveMessages: boolean;
  readonly canViewHistory: boolean;
  readonly canDeleteMessages: boolean;
  readonly canModifySettings: boolean;
  readonly canShareConversations: boolean;
}

// Domain operations
export interface ChatAppDomainOperations {
  readonly canUserSendMessage: (
    chatApp: ChatAppModel,
    userId: string
  ) => boolean;
  readonly canUserViewHistory: (
    chatApp: ChatAppModel,
    userId: string
  ) => boolean;
  readonly isAppActive: (chatApp: ChatAppModel) => boolean;
  readonly canAppReceiveMessages: (chatApp: ChatAppModel) => boolean;
}

// Factory functions
export function createChatAppModel(params: {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  agentId: string;
  workspaceId?: string;
  permissions?: Partial<ChatAppPermissions>;
  isDefault?: boolean;
  plugins?: string[];
  metadata?: Record<string, unknown>;
}): ChatAppModel {
  const now = new Date().toISOString();

  return {
    id: params.id ?? generateChatAppId(),
    name: params.name,
    description: params.description,
    version: params.version ?? "1.0.0",
    agentId: params.agentId,
    workspaceId: params.workspaceId,
    permissions: {
      canSendMessages: true,
      canReceiveMessages: true,
      canViewHistory: true,
      canDeleteMessages: false,
      canModifySettings: false,
      canShareConversations: false,
      ...params.permissions,
    },
    isDefault: params.isDefault ?? false,
    isShared: false,
    isArchived: false,
    plugins: params.plugins ?? [],
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata ?? {},
  };
}

export function updateChatAppModel(
  chatApp: ChatAppModel,
  updates: Partial<
    Pick<ChatAppModel, "name" | "description" | "permissions" | "metadata">
  >
): ChatAppModel {
  return {
    ...chatApp,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

// Domain utilities
export function generateChatAppId(): string {
  return `chatapp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidChatAppName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}

export function isActiveChatApp(chatApp: ChatAppModel): boolean {
  return !chatApp.isArchived && chatApp.permissions.canSendMessages;
}

export function canChatAppOperate(chatApp: ChatAppModel): boolean {
  return (
    chatApp.permissions.canSendMessages &&
    chatApp.permissions.canReceiveMessages
  );
}
