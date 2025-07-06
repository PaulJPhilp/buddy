import { Effect } from "effect";

// Simple config service interface for basic functionality
export interface ConfigServiceApi {
  readonly loadConfig: () => Effect.Effect<Record<string, unknown>>;
  readonly saveConfig: (config: Record<string, unknown>) => Effect.Effect<void>;
}

// Simple config service implementation
export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    scoped: Effect.gen(function* () {
      const loadConfig = () => Effect.succeed({});
      const saveConfig = (_config: Record<string, unknown>) => Effect.succeed(void 0);

      return {
        loadConfig,
        saveConfig,
      } satisfies ConfigServiceApi;
    }),
    dependencies: [],
  }
) {}

// Export types for compatibility
export type AppConfig = Record<string, unknown>;
export type ConfigServiceError = Error;
