import { Effect } from "effect";
import type { ChatManagerError } from "./errors";
import type {
  AgentId,
  ChatManagerState,
  ChatOperation,
  ConversationId,
  ConversationState,
  MessageId,
  MessageState,
} from "./types";

export interface ChatManagerApi {
  // State Management
  readonly getState: () => Effect.Effect<ChatManagerState, ChatManagerError>;
  readonly setState: (
    state: Partial<ChatManagerState>
  ) => Effect.Effect<void, ChatManagerError>;
  readonly resetState: () => Effect.Effect<void, ChatManagerError>;

  // Conversation Management
  readonly startConversation: (
    agentId: AgentId,
    initialMessage?: string
  ) => Effect.Effect<ConversationId, ChatManagerError>;
  readonly endConversation: (
    conversationId: ConversationId
  ) => Effect.Effect<void, ChatManagerError>;
  readonly getConversation: (
    conversationId: ConversationId
  ) => Effect.Effect<ConversationState, ChatManagerError>;
  readonly getAllConversations: () => Effect.Effect<
    readonly ConversationState[],
    ChatManagerError
  >;
  readonly getActiveConversation: () => Effect.Effect<
    ConversationState | null,
    ChatManagerError
  >;
  readonly setActiveConversation: (
    conversationId: ConversationId | null
  ) => Effect.Effect<void, ChatManagerError>;

  // Message Management
  readonly sendMessage: (
    conversationId: ConversationId,
    content: string
  ) => Effect.Effect<MessageId, ChatManagerError>;
  readonly getMessages: (
    conversationId: ConversationId
  ) => Effect.Effect<readonly MessageState[], ChatManagerError>;
  readonly getMessage: (
    messageId: MessageId
  ) => Effect.Effect<MessageState, ChatManagerError>;
  readonly updateMessage: (
    messageId: MessageId,
    updates: Partial<MessageState>
  ) => Effect.Effect<void, ChatManagerError>;
  readonly deleteMessage: (
    messageId: MessageId
  ) => Effect.Effect<void, ChatManagerError>;

  // Chat Operations
  readonly executeOperation: (
    operation: ChatOperation
  ) => Effect.Effect<unknown, ChatManagerError>;
  readonly getLastOperation: () => Effect.Effect<
    ChatOperation | null,
    ChatManagerError
  >;
  readonly isOperationInProgress: () => Effect.Effect<
    boolean,
    ChatManagerError
  >;

  // Agent Management
  readonly setConversationAgent: (
    conversationId: ConversationId,
    agentId: AgentId
  ) => Effect.Effect<void, ChatManagerError>;
  readonly getConversationAgent: (
    conversationId: ConversationId
  ) => Effect.Effect<AgentId | null, ChatManagerError>;

  // Conversation History
  readonly getConversationHistory: (
    conversationId: ConversationId,
    limit?: number
  ) => Effect.Effect<readonly MessageState[], ChatManagerError>;
  readonly clearConversationHistory: (
    conversationId: ConversationId
  ) => Effect.Effect<void, ChatManagerError>;
  readonly exportConversation: (
    conversationId: ConversationId
  ) => Effect.Effect<string, ChatManagerError>;

  // Conversation Search
  readonly searchConversations: (
    query: string
  ) => Effect.Effect<readonly ConversationState[], ChatManagerError>;
  readonly searchMessages: (
    conversationId: ConversationId,
    query: string
  ) => Effect.Effect<readonly MessageState[], ChatManagerError>;

  // Conversation Statistics
  readonly getConversationStats: (
    conversationId: ConversationId
  ) => Effect.Effect<
    { messageCount: number; lastActivity: Date },
    ChatManagerError
  >;
  readonly getAllConversationStats: () => Effect.Effect<
    {
      totalConversations: number;
      totalMessages: number;
      activeConversations: number;
    },
    ChatManagerError
  >;
}
