import type { Effect } from "effect";

export interface LlmWorkspaceBridgeApi {
  /** Dummy method – bridge initialises itself during service construction. */
  readonly noop: () => Effect.Effect<void>;
}
