import { Effect, Stream } from "effect";
import type { Message } from "@/types";

// Re-export types from global
export type { Message } from "@/types";

export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_MESSAGE_LENGTH = 1;
export const MAX_MESSAGES_PER_CHAT = 1000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_MESSAGE = 10;

export interface MessageValidation {
  /** Whether the message is valid */
  readonly isValid: boolean;
  /** List of validation errors, if any */
  readonly errors: string[];
}

export interface FileAttachment {
  /** Unique file identifier */
  readonly id: string;
  /** File name */
  readonly name: string;
  /** File size in bytes */
  readonly size: number;
  /** MIME type */
  readonly type: string;
  /** Optional URL for the file */
  readonly url?: string;
}

/**
 * Represents a single chat message.
 */
export interface MessageApi {
  readonly id: string;
  readonly text: string;
  readonly sender: "user" | "assistant" | "system";
  readonly timestamp: number;
  readonly status?: "sending" | "sent" | "delivered" | "error";
  readonly attachments?: readonly AttachmentApi[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Represents a page of chat history.
 */
export interface ChatHistoryPage {
  readonly messages: MessageApi[];
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// Enhanced State Machine Types for ChatManager
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

// Enhanced Chat State with State Machine
export interface ChatState {
  readonly id: string;
  readonly chatId: string;
  readonly agentId: string;
  readonly connectionState: ChatConnectionState;
  readonly messageFlowState: MessageFlowState;
  readonly historyState: HistoryState;
  readonly messages: readonly MessageApi[];
  readonly isTyping: boolean;
  readonly hasMoreHistory: boolean;
  readonly nextCursor?: string;
  readonly lastError: string | null;
  readonly metadata: ChatMetadata;
}

export interface ChatMetadata {
  readonly messageCount: number;
  readonly totalAttachments: number;
  readonly totalInteractions: number;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly lastMessageAt?: Date;
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
  | { type: "MESSAGE_RECEIVED"; message: MessageApi }
  | { type: "MESSAGE_ERROR"; error: string }
  | { type: "START_TYPING" }
  | { type: "STOP_TYPING" }
  | { type: "LOAD_HISTORY" }
  | {
      type: "HISTORY_LOADED";
      messages: MessageApi[];
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
  readonly eventId: string;
}

export interface MessageEvent extends ChatEventPayload {
  readonly type: "message";
  readonly message: MessageApi;
}

export interface StateChangeEvent extends ChatEventPayload {
  readonly type: "stateChange";
  readonly previousState: Partial<ChatState>;
  readonly newState: ChatState;
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

export interface AttachmentApi {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url?: string;
}

// Chat History API
export interface ChatHistoryApi {
  readonly messages: readonly MessageApi[];
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// Message Validation API
export interface MessageValidationApi {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

// Chat State API (for backward compatibility)
export interface ChatStateApi {
  readonly state: ChatState;
  readonly getState: () => ChatState;
  readonly setState: (state: ChatState) => ChatState;
  readonly setTyping: (isTyping: boolean) => ChatState;
  readonly sendMessage: (
    content: string,
    attachments?: File[]
  ) => Promise<MessageApi>;
  readonly validateMessage: (text: string) => MessageValidationApi;
  readonly loadMoreHistory: () => Promise<ChatHistoryApi>;
  readonly clearHistory: () => void;
}

// Constants and Validation
export const CHAT_CONSTANTS = {
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
): ChatState {
  return {
    id: crypto.randomUUID(),
    chatId,
    agentId: agentId || "",
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
      totalAttachments: 0,
      totalInteractions: 0,
      averageResponseTime: 0,
      errorCount: 0,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      lastMessageAt: undefined,
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

export function createChatEvent<T extends ChatEvent>(
  chatId: string,
  eventData: Omit<T, keyof ChatEventPayload>
): T {
  return {
    ...eventData,
    chatId,
    timestamp: new Date(),
    eventId: generateChatEventId(),
  } as T;
}
