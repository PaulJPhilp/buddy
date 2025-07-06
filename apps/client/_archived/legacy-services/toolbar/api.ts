import { Effect } from "effect";
import type { ToolbarServiceError } from "./errors";
import type { ToolbarConfig } from "./types";

export interface ToolbarServiceApi {
  readonly getAll: () => Effect.Effect<
    readonly ToolbarConfig[],
    ToolbarServiceError
  >;
  readonly getById: (
    id: string,
  ) => Effect.Effect<ToolbarConfig | undefined, ToolbarServiceError>;
  readonly create: (
    toolbar: ToolbarConfig,
  ) => Effect.Effect<void, ToolbarServiceError>;
  readonly update: (
    id: string,
    toolbar: Partial<ToolbarConfig>,
  ) => Effect.Effect<void, ToolbarServiceError>;
  readonly delete: (id: string) => Effect.Effect<void, ToolbarServiceError>;
}
