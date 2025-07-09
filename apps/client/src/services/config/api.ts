import {
  ConfigLoadError,
  ConfigSaveError,
  ConfigValidationError,
} from "@/components/app/errors";
import type { AppDomainModel } from "@domain/index";
import { Effect, Ref } from "effect";

export interface ConfigServiceApi {
  readonly getConfig: () => Effect.Effect<AppDomainModel, ConfigLoadError>;
  readonly saveConfig: (
    config: AppDomainModel
  ) => Effect.Effect<void, ConfigSaveError>;
  readonly state: Ref.Ref<{
    readonly currentConfig: AppDomainModel | null;
    readonly isLoaded: boolean;
    readonly lastModified: Date | null;
  }>;
  readonly validateConfig: (
    config: unknown
  ) => Effect.Effect<AppDomainModel, ConfigValidationError>;
}
