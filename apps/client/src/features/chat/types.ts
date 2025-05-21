import { Effect } from "effect";

export interface DisplayFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export type Theme = "blue" | "rose";

export interface MessageValidation {
  isValid: boolean;
  errors: string[];
}

export const MIN_MESSAGE_LENGTH = 1;
export const MAX_MESSAGE_LENGTH = 32000;

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  attachments?: FileAttachment[];
  metadata?: Record<string, unknown>;
}

export type MessageApi = {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  attachments?: FileAttachment[];
  metadata?: Record<string, unknown>;
};

export interface ChatHistoryPage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatState {
  id: string;
  messages: Message[];
  isTyping: boolean;
  error?: string;
  metadata?: {
    messageCount: number;
    lastMessageAt?: number;
    totalAttachments: number;
  };
}

export interface ChatStateApi {
  readonly state: ChatState;
  getState(): Effect.Effect<ChatState, never, never>;
  setState(newState: ChatState): Effect.Effect<ChatState, never, never>;
  setTyping(isTyping: boolean): Effect.Effect<ChatState, never, never>;
  sendMessage(message: MessageApi): Effect.Effect<void, Error, never>;
  validateMessage(text: string): MessageValidation;
  loadMoreHistory(): Effect.Effect<ChatHistoryPage, Error, never>;
  clearHistory(): Effect.Effect<void, Error, never>;
}
