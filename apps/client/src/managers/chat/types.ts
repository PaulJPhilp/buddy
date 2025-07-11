// Re-export core manager types
import type { CoreManagerConfig, CoreManagerState } from "@managers/core/types";
export type { CoreManagerState, CoreManagerConfig };

// Identifiers
export type ConversationId = string;
export type MessageId = string;
export type AgentId = string;

// Message Types
export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "sent" | "failed" | "delivered";

export interface MessageState {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
  readonly status: MessageStatus;
  readonly timestamp: Date;
  readonly agentId?: AgentId;
  readonly metadata?: Record<string, unknown>;
  readonly parentMessageId?: MessageId;
  readonly isEdited?: boolean;
  readonly editHistory?: readonly string[];
}

// Conversation Types
export type ConversationStatus = "active" | "paused" | "ended" | "archived";

export interface ConversationState {
  readonly id: ConversationId;
  readonly title: string;
  readonly status: ConversationStatus;
  readonly agentId: AgentId | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastActivity: Date;
  readonly messageCount: number;
  readonly messages: readonly MessageState[];
  readonly metadata?: Record<string, unknown>;
  readonly tags?: readonly string[];
  readonly isArchived?: boolean;
}

// Chat Operations
export type ChatOperationType =
  | "start_conversation"
  | "end_conversation"
  | "send_message"
  | "delete_message"
  | "edit_message"
  | "search_conversations"
  | "search_messages"
  | "export_conversation"
  | "clear_history"
  | "set_agent"
  | "archive_conversation"
  | "restore_conversation"
  | "custom_operation";

export interface ChatOperation {
  readonly type: ChatOperationType;
  readonly timestamp: Date;
  readonly conversationId?: ConversationId;
  readonly messageId?: MessageId;
  readonly agentId?: AgentId;
  readonly parameters?: Record<string, unknown>;
  readonly result?: unknown;
  readonly error?: string;
}

// Chat Manager Configuration
export interface ChatManagerConfig extends CoreManagerConfig {
  readonly maxConversations: number;
  readonly maxMessagesPerConversation: number;
  readonly autoArchiveAfterDays: number;
  readonly enableSearch: boolean;
  readonly searchIndexSize: number;
  readonly messageRetentionDays: number;
  readonly enableMessageHistory: boolean;
  readonly maxMessageHistorySize: number;
}

// Chat Manager State
export interface ChatManagerState extends CoreManagerState {
  readonly conversations: Record<ConversationId, ConversationState>;
  readonly activeConversationId: ConversationId | null;
  readonly messageIndex: Record<MessageId, MessageState>;
  readonly conversationsByAgent: Record<AgentId, readonly ConversationId[]>;
  readonly searchIndex: Record<string, readonly ConversationId[]>;
  readonly operationHistory: readonly ChatOperation[];
  readonly currentOperation: ChatOperation | null;
  readonly config: ChatManagerConfig;
  readonly stats: {
    readonly totalConversations: number;
    readonly totalMessages: number;
    readonly activeConversations: number;
    readonly archivedConversations: number;
    readonly lastActivity: Date | null;
  };
}

// Helper Types
export interface ConversationFilter {
  readonly status?: ConversationStatus;
  readonly agentId?: AgentId;
  readonly tags?: readonly string[];
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly limit?: number;
  readonly offset?: number;
}

export interface MessageFilter {
  readonly role?: MessageRole;
  readonly status?: MessageStatus;
  readonly agentId?: AgentId;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly limit?: number;
  readonly offset?: number;
}

export interface SearchOptions {
  readonly query: string;
  readonly includeMessages?: boolean;
  readonly includeMetadata?: boolean;
  readonly caseSensitive?: boolean;
  readonly exactMatch?: boolean;
  readonly limit?: number;
}

// Constants
export const CHAT_MANAGER_CONSTANTS = {
  MAX_CONVERSATIONS: 1000,
  MAX_MESSAGES_PER_CONVERSATION: 10000,
  AUTO_ARCHIVE_AFTER_DAYS: 30,
  MESSAGE_RETENTION_DAYS: 90,
  MAX_MESSAGE_HISTORY_SIZE: 100,
  SEARCH_INDEX_SIZE: 10000,
  DEFAULT_CONVERSATION_TITLE: "New Conversation",
  DEFAULT_MESSAGE_LIMIT: 50,
  OPERATION_HISTORY_LIMIT: 1000,
} as const;
