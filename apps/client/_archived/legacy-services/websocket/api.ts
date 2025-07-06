import { Effect, Stream } from "effect";
import type { WebSocketConnectionError, WebSocketSendError } from "./errors";
import type { ProtocolMessage, UserMessage, WebSocketEnvelope } from "./types";

export type WebSocketServiceError =
  | WebSocketConnectionError
  | WebSocketSendError;

export interface WebSocketServiceApi {
  readonly _tag: "WebSocketService";
  readonly connect: (
    url: string,
  ) => Effect.Effect<void, WebSocketConnectionError>;
  readonly disconnect: () => Effect.Effect<void, WebSocketConnectionError>;
  readonly cleanup: () => Effect.Effect<void, never>;
  readonly send: (
    message: UserMessage | WebSocketEnvelope,
  ) => Effect.Effect<void, WebSocketConnectionError | WebSocketSendError>;
  readonly isConnected: Effect.Effect<boolean, never>;
  readonly messageStream: Stream.Stream<ProtocolMessage>;
  readonly receive: Stream.Stream<ProtocolMessage>;
}
