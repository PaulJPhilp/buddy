// Main exports
export type { WebSocketServiceApi } from "./api";
export {
  WebSocketConnectionError,
  WebSocketError,
  WebSocketReceiveError,
  WebSocketSendError,
  WebSocketTimeoutError,
} from "./errors";
export type { WebSocketServiceError } from "./errors";
export {
  WebSocketService,
  createWebSocketServiceImpl,
} from "./WebSocketService";
export type {
  MessageCallback,
  MessageValidationResult,
  ProtocolMessage,
  UserMessage,
  WebSocketEnvelope,
  WebSocketMessage,
  WebSocketServiceOptions,
} from "./types";
