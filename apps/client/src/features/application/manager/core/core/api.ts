import { Effect, Ref } from "effect";
import type { CoreManagerError } from "./errors";
import type { CoreManagerConfig, CoreManagerState } from "./types";
import type { CoreCommand } from "./commands";

export interface CoreManagerApi {
  readonly initialize: (
    config: CoreManagerConfig
  ) => Effect.Effect<void, CoreManagerError, never>;
  readonly getState: () => Effect.Effect<
    CoreManagerState,
    CoreManagerError,
    never
  >;
  readonly setState: (
    state: Partial<CoreManagerState>
  ) => Effect.Effect<void, CoreManagerError, never>;
  readonly subscribe: (
    callback: (state: CoreManagerState) => void
  ) => Effect.Effect<() => void, CoreManagerError, never>;
  readonly start: () => Effect.Effect<void, CoreManagerError, never>;
  readonly stop: () => Effect.Effect<void, CoreManagerError, never>;
  readonly cleanup: () => Effect.Effect<void, CoreManagerError, never>;

  // Command Dispatch
  readonly dispatch: (command: CoreCommand) => Effect.Effect<void, never>;
}
