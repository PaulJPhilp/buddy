import { Effect } from "effect";

// Simple config service interface for basic functionality
export interface ConfigServiceApi {
  readonly loadConfig: () => Effect.Effect<
    Record<string, unknown>,
    never,
    never
  >;
  readonly saveConfig: (
    config: Record<string, unknown>
  ) => Effect.Effect<void, never, never>;
}
