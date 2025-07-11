// Main exports
export type { ChatAppComponentApi } from "./api";
export {
  ChatAppLoadError,
  ChatAppAgentError,
  ChatAppWindowError,
  ChatAppUIError,
  ChatAppConversationError,
  ChatAppOperationError,
  ChatAppStateError,
  ChatAppValidationError,
  ChatAppWindowBoundsError,
} from "./errors";
export type { ChatAppComponentError } from "./errors";
export { ChatAppComponent } from "./service";
export type {
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppOperationType,
  ChatAppUIState,
} from "./types";
export { createDefaultChatAppState, CHATAPP_OPERATIONS } from "./types";

// React components
export { ChatApp } from "./ChatApp";
export { ChatBubble } from "./ChatBubble";
export { CustomTable, CustomTableCell } from "./CustomTable";
export { ChatAppContainer, useChatAppContainer } from "./ChatAppContainer";
export type { ChatAppContainerProps } from "./ChatAppContainer";
