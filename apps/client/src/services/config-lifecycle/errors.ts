import { Data, Schema } from "effect";
import type { ChatAppConfig } from "./types";

// Error types
export class ConfigLoadError extends Schema.TaggedError<ConfigLoadError>()(
  "ConfigLoadError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConfigSaveError extends Schema.TaggedError<ConfigSaveError>()(
  "ConfigSaveError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConfigValidationError extends Schema.TaggedError<ConfigValidationError>()(
  "ConfigValidationError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConcurrentModificationError extends Schema.TaggedError<ConcurrentModificationError>()(
  "ConcurrentModificationError",
  {
    message: Schema.String,
    expectedVersion: Schema.Number,
    actualVersion: Schema.Number,
  },
) {}

export type ConfigLifecycleServiceError =
  | ConfigLoadError
  | ConfigSaveError
  | ConfigValidationError
  | ConcurrentModificationError;

// State machine context with save status tracking
export interface ConfigLifecycleContext {
  readonly configs: ChatAppConfig[];
  readonly activeConfigId: string | null;
  readonly displayMode: "expanded" | "compact";
  readonly openConfigs: Set<string>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastModified: number;

  // Save status tracking
  readonly saveStatus: Record<string, "saved" | "saving" | "dirty" | "error">;
  readonly pendingSaves: Record<string, ChatAppConfig>;
  readonly autoSaveEnabled: boolean;
  readonly lastSaved: Record<string, number>;
}
