import { Effect, Stream } from "effect";

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
  readonly sender: "user" | "assistant";
  readonly timestamp: number;
  readonly status?: "sent" | "delivered" | "read";
  readonly attachments?: FileAttachment[];
  readonly metadata?: {
    readonly length: number;
    readonly validation?: MessageValidation;
    readonly hasAttachments?: boolean;
    readonly attachedFileCount?: number;
    readonly fileNames?: readonly string[];
    readonly streaming?: boolean;
    readonly streamId?: string;
  };
}

/**
 * Represents a page of chat history.
 */
export interface ChatHistoryPage {
  readonly messages: MessageApi[];
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

/**
 * Represents the current chat state.
 */
export interface ChatState {
  readonly id: string;
  readonly messages: MessageApi[];
  readonly isTyping: boolean;
  readonly metadata?: {
    readonly messageCount: number;
    readonly lastMessageAt?: number;
    readonly totalAttachments?: number;
  };
}

/**
 * API contract for chat state management.
 */
export interface ChatStateApi {
  readonly getState: () => Effect.Effect<ChatState>;
  readonly setState: (state: ChatState) => Effect.Effect<ChatState>;
  readonly sendMessage: (
    text: string,
    attachments?: File[],
  ) => Effect.Effect<MessageApi>;
  readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatState>;
  readonly validateMessage: (text: string) => Effect.Effect<MessageValidation>;
  readonly getHistory: (
    cursor?: string,
    limit?: number,
  ) => Effect.Effect<ChatHistoryPage>;
  readonly clearHistory: () => Effect.Effect<void>;
  readonly cleanup: () => Effect.Effect<void>;
  readonly messageStream: Stream.Stream<MessageApi>;
}

/**
 * API contract for chat history management.
 */
export interface ChatHistoryApi extends ChatHistoryPage {}

/**
 * API contract for message validation.
 */
export interface MessageValidationApi extends MessageValidation {}
