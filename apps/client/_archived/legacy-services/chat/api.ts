import type { ChatAppEntry } from "@/managers/workspace-component/types";
import type { ChatAppConfig } from "@/types/global";
import { Effect, Stream } from "effect";
import type { ChatServiceError } from "./errors";
import type {
  ChatConnectionState,
  ChatEvent,
  ChatEventListener,
  ChatHistoryApi,
  ChatManagerEvent,
  ChatState,
  ChatSubscription,
  HistoryState,
  MessageApi,
  MessageFlowState,
  MessageValidationApi,
} from "./types";

export interface ChatServiceApi {
  // Core state management
  readonly getState: () => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly setState: (
    state: ChatState
  ) => Effect.Effect<ChatState, ChatServiceError, never>;

  // Initialization and lifecycle
  readonly initialize: (
    chatId: string,
    wsUrl?: string,
    agentId?: string
  ) => Effect.Effect<unknown, ChatServiceError, never>;
  readonly cleanup: () => Effect.Effect<void, ChatServiceError, never>;

  // State machine management
  readonly transitionConnectionState: (
    newState: ChatConnectionState
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly transitionMessageFlowState: (
    newState: MessageFlowState
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly transitionHistoryState: (
    newState: HistoryState
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly handleEvent: (
    event: ChatManagerEvent
  ) => Effect.Effect<void, ChatServiceError, never>;

  // Message operations (orchestrated)
  readonly sendMessage: (
    content: string,
    attachments?: File[]
  ) => Effect.Effect<unknown, ChatServiceError, never>;
  readonly setTyping: (
    isTyping: boolean
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly validateMessage: (
    content: string
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly validateAttachments: (
    attachments: File[]
  ) => Effect.Effect<ChatState, ChatServiceError, never>;
  readonly clearValidationErrors: () => Effect.Effect<
    ChatState,
    ChatServiceError,
    never
  >;
  readonly setValidationError: (
    error: string
  ) => Effect.Effect<void, ChatServiceError, never>;

  // History operations
  readonly getHistory: () => Effect.Effect<
    ChatHistoryApi,
    ChatServiceError,
    never
  >;
  readonly loadMoreHistory: (
    cursor?: string,
    limit?: number
  ) => Effect.Effect<ChatHistoryApi, ChatServiceError, never>;
  readonly clearHistory: () => Effect.Effect<void, ChatServiceError, never>;

  // Agent operations
  readonly switchAgent: (
    agentId: string
  ) => Effect.Effect<void, ChatServiceError, never>;

  // Pub/Sub event system
  readonly publishEvent: <T extends ChatEvent>(
    event: T
  ) => Effect.Effect<void, ChatServiceError, never>;
  readonly subscribe: <T extends ChatEvent>(
    eventType: T["type"],
    listener: ChatEventListener<T>
  ) => Effect.Effect<ChatSubscription, ChatServiceError, never>;
  readonly subscribeToAll: (
    listener: ChatEventListener
  ) => Effect.Effect<ChatSubscription, ChatServiceError, never>;

  // Reactive streams
  readonly stateStream: Stream.Stream<ChatState, ChatServiceError, never>;
  readonly messageStream: Stream.Stream<MessageApi, ChatServiceError, never>;
  readonly eventStream: Stream.Stream<ChatEvent, ChatServiceError, never>;

  // Direct subscription (for React hooks)
  readonly subscribeToState: (
    callback: (state: ChatState) => void
  ) => () => void;
  readonly subscribeToMessages: (
    callback: (message: MessageApi) => void
  ) => () => void;
  readonly subscribeToEvents: (
    callback: (event: ChatEvent) => void
  ) => () => void;

  // Error handling and recovery
  readonly handleError: (
    error: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void, ChatServiceError, never>;
  readonly retry: () => Effect.Effect<void, ChatServiceError, never>;
  readonly reset: () => Effect.Effect<void, ChatServiceError, never>;

  // Connection management
  readonly connect: (
    agentId?: string
  ) => Effect.Effect<void, ChatServiceError, never>;
  readonly disconnect: (
    reason?: string
  ) => Effect.Effect<void, ChatServiceError, never>;

  // Connection state
  readonly isConnected: () => boolean;
  readonly getConnectionState: () => ConnectionState;
  readonly getConnectionError: () => string | null;
  readonly getLastActivity: () => Date | null;
  readonly getReconnectAttempts: () => number;
  readonly getMaxReconnectAttempts: () => number;

  // Chat app operations
  readonly getChatApps: (
    workspaceId?: string
  ) => Effect.Effect<ChatAppEntry[], ChatServiceError, never>;
  readonly getChatAppConfig: (
    appId: string
  ) => Effect.Effect<ChatAppConfig, ChatServiceError, never>;
}

export interface ChatWorkspaceManager {
  readonly getAppsForWorkspace: (
    workspaceId: string
  ) => Effect.Effect<ChatAppEntry[], ChatServiceError, never>;
  readonly getAppConfig: (
    appId: string
  ) => Effect.Effect<ChatAppConfig, ChatServiceError, never>;
}
