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
export type { ChatAppComponentConfig, ChatAppComponentState } from "./types";
export { createDefaultChatAppState } from "./types";

// React components
export { ChatAppContainer, useChatAppContainer } from "./ChatAppContainer";
export type { ChatAppContainerProps } from "./ChatAppContainer";
