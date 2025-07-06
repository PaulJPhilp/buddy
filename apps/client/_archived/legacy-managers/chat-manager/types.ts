import type { Message } from "@/types";
import type { ChatService } from "../../services/chat/service";

// Re-export types from global
export type { Message } from "@/types";

// ChatManager-specific configuration
export interface ChatManagerConfig {
  readonly maxConcurrentChats: number;
  readonly autoCleanupInactiveChats: boolean;
  readonly inactiveTimeoutMs: number;
  readonly chatId: string;
  readonly agentId?: string;
  readonly enableStreaming: boolean;
  readonly enableHistory: boolean;
  readonly historyPageSize: number;
  readonly reconnectAttempts: number;
  readonly reconnectDelay: number;
  readonly messageTimeout: number;
}

// Chat instance metadata
export interface ChatInstanceMetadata {
  readonly chatId: string;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly messageCount: number;
  readonly currentAgentId?: string;
}

// Chat manager statistics
export interface ChatManagerStats {
  readonly totalActiveChats: number;
  readonly totalMessages: number;
  readonly activeChatId: string | null;
  readonly longestActiveChatId: string | null;
  readonly oldestChatId: string | null;
  readonly averageMessagesPerChat: number;
}

// Internal chat instance registry entry
export interface ChatInstanceEntry {
  readonly service: ChatService;
  readonly metadata: ChatInstanceMetadata;
}

// Chat Manager State Machine Types
export type ChatConnectionState =
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export type MessageFlowState =
  | "idle"
  | "sending"
  | "streaming"
  | "processing"
  | "complete"
  | "error";

export type HistoryState = "idle" | "loading" | "loaded" | "error";

// Chat Manager Core State
export interface ChatManagerState {
  readonly chatId: string;
  readonly agentId: string | null;
  readonly connectionState: ChatConnectionState;
  readonly messageFlowState: MessageFlowState;
  readonly historyState: HistoryState;
  readonly messages: readonly Message[];
  readonly isTyping: boolean;
  readonly hasMoreHistory: boolean;
  readonly nextCursor?: string;
  readonly lastError: string | null;
  readonly metadata: ChatMetadata;
}

export interface ChatMetadata {
  readonly messageCount: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly lastMessageAt: Date | null;
}

// State Machine Events
export type ChatManagerEvent =
  | { type: "INITIALIZE"; chatId: string; agentId?: string }
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "RECONNECT" }
  | { type: "CONNECTION_ERROR"; error: string }
  | { type: "SEND_MESSAGE"; content: string; attachments?: File[] }
  | { type: "MESSAGE_SENT"; messageId: string }
  | { type: "MESSAGE_RECEIVED"; message: Message }
  | { type: "MESSAGE_ERROR"; error: string }
  | { type: "START_TYPING" }
  | { type: "STOP_TYPING" }
  | { type: "LOAD_HISTORY" }
  | {
      type: "HISTORY_LOADED";
      messages: Message[];
      hasMore: boolean;
      nextCursor?: string;
    }
  | { type: "HISTORY_ERROR"; error: string }
  | { type: "CLEAR_HISTORY" }
  | { type: "SWITCH_AGENT"; agentId: string }
  | { type: "RESET" };

// Pub/Sub Event Types
export interface ChatEventPayload {
  readonly chatId: string;
  readonly timestamp: Date;
}

export interface MessageEvent extends ChatEventPayload {
  readonly type: "message";
  readonly message: Message;
}

export interface StateChangeEvent extends ChatEventPayload {
  readonly type: "stateChange";
  readonly previousState: Partial<ChatManagerState>;
  readonly newState: ChatManagerState;
}

export interface ErrorEvent extends ChatEventPayload {
  readonly type: "error";
  readonly error: string;
  readonly context?: Record<string, unknown>;
}

export interface TypingEvent extends ChatEventPayload {
  readonly type: "typing";
  readonly isTyping: boolean;
  readonly userId?: string;
}

export interface ConnectionEvent extends ChatEventPayload {
  readonly type: "connection";
  readonly connectionState: ChatConnectionState;
}

export type ChatEvent =
  | MessageEvent
  | StateChangeEvent
  | ErrorEvent
  | TypingEvent
  | ConnectionEvent;

// Pub/Sub Listener Types
export type ChatEventListener<T extends ChatEvent = ChatEvent> = (
  event: T
) => void;

export interface ChatSubscription {
  readonly unsubscribe: () => void;
}

// Message Operations
export interface SendMessageOptions {
  readonly content: string;
  readonly attachments?: File[];
  readonly metadata?: Record<string, unknown>;
}

export interface LoadHistoryOptions {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface HistoryPage {
  readonly messages: Message[];
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// Agent Integration
export interface AgentConfig {
  readonly agentId: string;
  readonly name: string;
  readonly capabilities: string[];
  readonly settings: Record<string, unknown>;
}

// Constants
export const CHAT_MANAGER_CONSTANTS = {
  DEFAULT_MAX_CONCURRENT_CHATS: 10,
  DEFAULT_INACTIVE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  DEFAULT_AUTO_CLEANUP: true,
  MAX_CHAT_HISTORY_SIZE: 1000,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  DEFAULT_HISTORY_PAGE_SIZE: 20,
  DEFAULT_RECONNECT_ATTEMPTS: 3,
  DEFAULT_RECONNECT_DELAY: 1000,
  DEFAULT_MESSAGE_TIMEOUT: 30000,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// State Machine Transition Validation
export const VALID_CONNECTION_TRANSITIONS: Record<
  ChatConnectionState,
  ChatConnectionState[]
> = {
  initializing: ["connecting", "error"],
  connecting: ["connected", "error", "disconnected"],
  connected: ["disconnected", "reconnecting", "error"],
  disconnected: ["connecting", "reconnecting"],
  reconnecting: ["connected", "error", "disconnected"],
  error: ["connecting", "reconnecting", "disconnected"],
};

export const VALID_MESSAGE_FLOW_TRANSITIONS: Record<
  MessageFlowState,
  MessageFlowState[]
> = {
  idle: ["sending"],
  sending: ["streaming", "complete", "error"],
  streaming: ["processing", "complete", "error"],
  processing: ["complete", "error"],
  complete: ["idle"],
  error: ["idle"],
};

// Utility Functions
export function createInitialChatState(
  chatId: string,
  agentId?: string
): ChatManagerState {
  return {
    chatId,
    agentId: agentId || null,
    connectionState: "initializing",
    messageFlowState: "idle",
    historyState: "idle",
    messages: [],
    isTyping: false,
    hasMoreHistory: true,
    nextCursor: undefined,
    lastError: null,
    metadata: {
      messageCount: 0,
      totalInteractions: 0,
      averageResponseTime: 0,
      errorCount: 0,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      lastMessageAt: null,
    },
  };
}

export function isValidConnectionTransition(
  from: ChatConnectionState,
  to: ChatConnectionState
): boolean {
  return VALID_CONNECTION_TRANSITIONS[from].includes(to);
}

export function isValidMessageFlowTransition(
  from: MessageFlowState,
  to: MessageFlowState
): boolean {
  return VALID_MESSAGE_FLOW_TRANSITIONS[from].includes(to);
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateChatEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
