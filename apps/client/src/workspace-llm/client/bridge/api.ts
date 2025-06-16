import type { WebSocketService } from "@/services/websocket";
import type { Effect } from "effect";

export interface LlmWorkspaceBridgeApi {
  /** Dummy method – bridge initialises itself during service construction. */
  readonly noop: () => Effect.Effect<void>;
  /** Starts the bridge event subscription. */
  readonly start: () => Effect.Effect<void>;
  /** Starts the bridge with a specific WebSocketService instance. */
  readonly startWithWebSocket: (ws: WebSocketService) => Effect.Effect<void>;
}
