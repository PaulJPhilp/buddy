import { Effect, Ref } from "effect";
import type { CoreComponentError } from "./errors";
import type { CoreComponentConfig, CoreComponentState } from "./types";

export interface CoreComponentApi {
  readonly initialize: (
    config: CoreComponentConfig
  ) => Effect.Effect<void, CoreComponentError>;
  readonly getState: () => Effect.Effect<
    CoreComponentState,
    CoreComponentError
  >;
  readonly setState: (
    state: Partial<CoreComponentState>
  ) => Effect.Effect<void, CoreComponentError>;
  readonly subscribe: (
    callback: (state: CoreComponentState) => void
  ) => Effect.Effect<() => void, CoreComponentError>;
  readonly cleanup: () => Effect.Effect<void, CoreComponentError>;
}
