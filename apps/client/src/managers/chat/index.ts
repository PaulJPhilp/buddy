// Main exports
export type { ChatManagerApi } from "./api";
export {
  ChatManagerStateError,
  ChatManagerConversationError,
  ChatManagerMessageError,
  ChatManagerOperationError,
  ChatManagerAgentError,
  ChatManagerSearchError,
  ChatManagerValidationError,
  ChatManagerInitializationError,
} from "./errors";
export type { ChatManagerError } from "./errors";
export { ChatManager } from "./service";
export * from "./commands";
export type {
  ChatManagerState,
  ChatManagerConfig,
  ConversationState,
  MessageState,
  ChatOperation,
  ChatOperationType,
  ConversationId,
  MessageId,
  AgentId,
  MessageRole,
  MessageStatus,
  ConversationStatus,
  ConversationFilter,
  MessageFilter,
  SearchOptions,
} from "./types";
export { CHAT_MANAGER_CONSTANTS } from "./types";
