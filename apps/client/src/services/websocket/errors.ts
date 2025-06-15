import { Data } from "effect";

export class WebSocketConnectionError extends Data.TaggedError(
  "WebSocketConnectionError",
)<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class WebSocketSendError extends Data.TaggedError("WebSocketSendError")<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class WebSocketReceiveError extends Data.TaggedError(
  "WebSocketReceiveError",
)<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
}> {}

export class WebSocketTimeoutError extends Data.TaggedError(
  "WebSocketTimeoutError",
)<{
  readonly message: string;
  readonly timeout: string;
  readonly cause?: unknown;
}> {}

// Legacy error class for compatibility
export class WebSocketError extends Error {
  code: string;
  constructor(message: string, code = "GENERIC") {
    super(message);
    this.name = "WebSocketError";
    this.code = code;
  }
}

export type WebSocketServiceError =
  | WebSocketConnectionError
  | WebSocketSendError
  | WebSocketReceiveError
  | WebSocketTimeoutError;
