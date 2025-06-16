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
export { WebSocketService } from "./service";
export type {
  MessageCallback,
  MessageValidationResult,
  ProtocolMessage,
  UserMessage,
  WebSocketEnvelope,
  WebSocketMessage,
  WebSocketServiceOptions,
} from "./types";
