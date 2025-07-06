// Main exports
export type { ChatBridgeApi } from "./api";
export {
  ChatBridgeError,
  ChatBridgeStartError,
  ChatBridgeStopError,
  ChatBridgeConnectionError,
  ChatBridgeMessageError,
  ChatBridgeHandlerError,
  ChatBridgeConfigurationError,
  ChatBridgeTimeoutError,
  ChatBridgeNetworkError,
  ChatBridgeAuthenticationError,
  ChatBridgeValidationError,
  ChatBridgeOperationError,
  ChatBridgeStateError,
} from "./errors";
export type { ChatBridgeServiceError } from "./errors";
export { ChatBridge } from "./service";
export type {
  ChatBridgeMessage,
  ChatBridgeConnection,
  ChatBridgeConnectionConfig,
  ChatBridgeAuthConfig,
  ChatBridgeHandler,
  ChatBridgeEventType,
  ChatBridgeEvent,
  ChatBridgeHealthStatus,
  ChatBridgeMetrics,
  ChatBridgeState,
  ChatBridgeEventSubscription,
  ChatBridgeMessageFilter,
  ChatBridgeConnectionStats,
} from "./types";
export {
  CHAT_BRIDGE_CONSTANTS,
  isValidConnectionId,
  isValidMessageType,
  isValidEndpoint,
  isValidProtocol,
  generateConnectionId,
  generateMessageId,
  generateHandlerId,
  generateSubscriptionId,
  createChatBridgeMessage,
  createChatBridgeConnection,
  createChatBridgeHandler,
  createInitialChatBridgeState,
} from "./types";
