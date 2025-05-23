/**
 * @file Defines the ChatService API for managing chat state and messages.
 *
 * Provides methods for sending messages, retrieving chat state, managing typing status,
 * validating messages, and handling chat history.
 *
 * @remarks
 * This service is responsible for the in-memory management of chat state and
 * communication with the agent runtime. It is designed for use with Effect-TS.
 *
 * @example
 * ```typescript
 * const chatService = yield* ChatService;
 * const message = yield* chatService.sendMessage("Hello!");
 * ```
 */
import { type Effect } from "effect";

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
    readonly attachedFileCount?: number; // New
    readonly fileNames?: readonly string[]; // New & readonly array
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
 * API contract for the ChatService.
 *
 * @remarks
 * All methods return Effect-TS Effects for composability and error handling.
 */
export interface ChatStateApi {
  /**
   * Retrieves the current chat state.
   * @returns An Effect yielding the current ChatState.
   */
  readonly getState: () => Effect.Effect<ChatState>;

  /**
   * Sets the chat state.
   * @param state The new chat state.
   * @returns An Effect yielding the new ChatState.
   */
  readonly setState: (state: ChatState) => Effect.Effect<ChatState>;

  /**
   * Sends a message to the chat.
   * @param text The message text.
   * @param attachments Optional file attachments.
   * @returns An Effect yielding the created MessageApi.
   */
  readonly sendMessage: (
    text: string,
    attachments?: File[],
  ) => Effect.Effect<MessageApi>;

  /**
   * Sets the typing status.
   * @param isTyping Whether the user is typing.
   * @returns An Effect yielding the updated ChatState.
   */
  readonly setTyping: (isTyping: boolean) => Effect.Effect<ChatState>;

  /**
   * Validates a message's text.
   * @param text The message text.
   * @returns An Effect yielding a validation result.
   */
  readonly validateMessage: (text: string) => Effect.Effect<MessageValidation>;

  /**
   * Retrieves a page of chat history.
   * @param cursor Optional cursor for pagination.
   * @param limit Maximum number of messages to retrieve.
   * @returns An Effect yielding a page of messages.
   */
  readonly getHistory: (
    cursor?: string,
    limit?: number,
  ) => Effect.Effect<ChatHistoryPage>;

  /**
   * Clears the chat history.
   * @returns An Effect yielding void.
   */
  readonly clearHistory: () => Effect.Effect<void>;
}
