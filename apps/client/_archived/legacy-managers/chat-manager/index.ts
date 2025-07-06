// Main exports
export type { ChatManagerApi, ChatManagerState } from "./api";
export {
  ChatManagerError,
  ChatInstanceNotFoundError,
  NoChatActiveError,
  ChatInstanceCreationError,
  ChatManagerOperationError,
} from "./errors";
export type { ChatManagerErrorType } from "./errors";
export { ChatManager } from "./service";
export type {
  ChatManagerConfig,
  ChatInstanceMetadata,
  ChatManagerStats,
  ChatInstanceEntry,
  ChatManagerEvent,
} from "./types";
export { CHAT_MANAGER_CONSTANTS } from "./types";
