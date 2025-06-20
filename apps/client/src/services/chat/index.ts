// Main exports
export type { ChatServiceApi } from "./api";
export {
  ChatConnectionError,
  ChatHistoryError,
  ChatMessageError,
  ChatValidationError,
  // Legacy error classes for backward compatibility
  HistoryError,
  MessageCreationError,
  MessageStreamError,
  StateUpdateError,
} from "./errors";
export type { ChatServiceError } from "./errors";
export { ChatService } from "./service";
export type {
  ChatHistoryApi,
  ChatHistoryPage,
  ChatState,
  ChatStateApi,
  FileAttachment,
  MessageApi,
  MessageValidation,
  MessageValidationApi,
} from "./types";
export {
  MAX_FILE_SIZE,
  MAX_FILES_PER_MESSAGE,
  MAX_MESSAGES_PER_CHAT,
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from "./types";

// Utilities
export {
  createUserMessage,
  finalizeStreamingMessage,
  MessageProcessingError,
  sanitizeMessage,
  validateMessageText,
} from "./utils";
