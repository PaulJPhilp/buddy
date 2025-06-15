import { Effect, Stream } from "effect";
import type { WebSocketServiceError } from "./errors";
import type { ProtocolMessage, UserMessage, WebSocketEnvelope } from "./types";

export interface WebSocketServiceApi {
  readonly _tag: "WebSocketService";
  readonly connect: (url: string) => Effect.Effect<void, WebSocketServiceError>;
  readonly disconnect: () => Effect.Effect<void, WebSocketServiceError>;
  readonly cleanup: () => Effect.Effect<void, never>;
  readonly send: (
    message: UserMessage | WebSocketEnvelope,
  ) => Effect.Effect<void, WebSocketServiceError>;
  readonly receive: Stream.Stream<
    ProtocolMessage,
    WebSocketServiceError,
    never
  >;
  readonly isConnected: Effect.Effect<boolean, never>;
  readonly messageStream: Stream.Stream<
    ProtocolMessage,
    WebSocketServiceError,
    never
  >;
}
