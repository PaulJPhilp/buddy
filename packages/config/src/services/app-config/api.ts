import { Effect } from "effect";
import { ConfigError } from "../../errors";
import { AppConfig } from "../../types";

export interface AppConfigServiceApi {
  readonly getAppConfig: () => Effect.Effect<AppConfig, ConfigError>;
  readonly updateAppConfig: (
    updates: Partial<AppConfig>
  ) => Effect.Effect<AppConfig, ConfigError>;
}
