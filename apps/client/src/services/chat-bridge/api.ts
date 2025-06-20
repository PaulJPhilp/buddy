import type { WebSocketService } from "@/services/websocket";
import type { Effect } from "effect";
import type { ChatBridgeError } from "./errors";

export interface ChatBridgeApi {
  /** Dummy method – bridge initialises itself during service construction. */
  readonly noop: () => Effect.Effect<void, ChatBridgeError>;
  /** Starts the bridge event subscription. */
  readonly start: () => Effect.Effect<void, ChatBridgeError>;
  /** Starts the bridge with a specific WebSocketService instance. */
  readonly startWithWebSocket: (
    ws: WebSocketService,
  ) => Effect.Effect<void, ChatBridgeError>;
  /** Registers a message handler for chat messages */
  readonly registerHandler: (
    handler: (message: any) => void,
  ) => Effect.Effect<void, ChatBridgeError>;
  readonly stop: () => Effect.Effect<void, ChatBridgeError>;
  readonly isStarted: () => Effect.Effect<boolean, never>;
}
