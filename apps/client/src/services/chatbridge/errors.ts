import { Data } from "effect";

export class ChatBridgeError extends Data.TaggedError("ChatBridgeError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeStartError extends Data.TaggedError(
  "ChatBridgeStartError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeStopError extends Data.TaggedError(
  "ChatBridgeStopError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeConnectionError extends Data.TaggedError(
  "ChatBridgeConnectionError"
)<{
  readonly message: string;
  readonly connectionId?: string;
  readonly endpoint?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeMessageError extends Data.TaggedError(
  "ChatBridgeMessageError"
)<{
  readonly message: string;
  readonly messageId?: string;
  readonly messageType?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeHandlerError extends Data.TaggedError(
  "ChatBridgeHandlerError"
)<{
  readonly message: string;
  readonly handlerId?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeConfigurationError extends Data.TaggedError(
  "ChatBridgeConfigurationError"
)<{
  readonly message: string;
  readonly configField?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeTimeoutError extends Data.TaggedError(
  "ChatBridgeTimeoutError"
)<{
  readonly message: string;
  readonly timeout?: number;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeNetworkError extends Data.TaggedError(
  "ChatBridgeNetworkError"
)<{
  readonly message: string;
  readonly endpoint?: string;
  readonly statusCode?: number;
  readonly cause?: unknown;
}> {}

export class ChatBridgeAuthenticationError extends Data.TaggedError(
  "ChatBridgeAuthenticationError"
)<{
  readonly message: string;
  readonly endpoint?: string;
  readonly authMethod?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeValidationError extends Data.TaggedError(
  "ChatBridgeValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
  readonly cause?: unknown;
}> {}

export class ChatBridgeOperationError extends Data.TaggedError(
  "ChatBridgeOperationError"
)<{
  readonly message: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeStateError extends Data.TaggedError(
  "ChatBridgeStateError"
)<{
  readonly message: string;
  readonly currentState?: string;
  readonly expectedState?: string;
  readonly cause?: unknown;
}> {}

export type ChatBridgeServiceError =
  | ChatBridgeError
  | ChatBridgeStartError
  | ChatBridgeStopError
  | ChatBridgeConnectionError
  | ChatBridgeMessageError
  | ChatBridgeHandlerError
  | ChatBridgeConfigurationError
  | ChatBridgeTimeoutError
  | ChatBridgeNetworkError
  | ChatBridgeAuthenticationError
  | ChatBridgeValidationError
  | ChatBridgeOperationError
  | ChatBridgeStateError;
