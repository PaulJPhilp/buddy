import type { Effect } from "effect";
import type { ChatState, MessageApi } from "../../services/chat/types";
import type { ChatManagerError } from "./errors";

export interface ChatManagerState {
  readonly activeChatId: string | null;
  readonly activeChats: readonly string[];
  readonly totalMessages: number;
}

export interface ChatManagerApi {
  // Message operations
  readonly sendMessage: (
    chatId: string,
    content: string,
    attachments?: File[]
  ) => Effect.Effect<void, ChatManagerError, never>;

  readonly sendMessageToActiveChat: (
    content: string,
    attachments?: File[]
  ) => Effect.Effect<void, ChatManagerError, never>;

  // Chat management
  readonly setActiveChat: (
    chatId: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  readonly getChatState: (
    chatId: string
  ) => Effect.Effect<ChatState, ChatManagerError, never>;

  readonly getActiveChatState: () => Effect.Effect<
    ChatState | null,
    ChatManagerError,
    never
  >;

  readonly getAllActiveChats: () => Effect.Effect<
    string[],
    ChatManagerError,
    never
  >;

  readonly closeChatInstance: (
    chatId: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  readonly initializeChatInstance: (
    chatId: string,
    agentId?: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  // Agent operations
  readonly switchAgent: (
    chatId: string,
    agentId: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  readonly switchAgentInActiveChat: (
    agentId: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  // State management
  readonly getState: () => Effect.Effect<
    ChatManagerState,
    ChatManagerError,
    never
  >;

  readonly subscribe: (
    listener: (state: ChatManagerState) => void
  ) => Effect.Effect<() => Effect.Effect<void>, ChatManagerError, never>;

  // Advanced access for debugging and testing
  readonly getChatInstance: (
    chatId: string
  ) => Effect.Effect<any, ChatManagerError, never>; // ChatService type

  readonly clearAllChats: () => Effect.Effect<void, ChatManagerError, never>;

  readonly broadcastMessage: (
    content: string
  ) => Effect.Effect<void, ChatManagerError, never>;

  // Chat history operations
  readonly getChatHistory: (
    chatId: string
  ) => Effect.Effect<MessageApi[], ChatManagerError, never>;

  readonly clearChatHistory: (
    chatId: string
  ) => Effect.Effect<void, ChatManagerError, never>;
}
