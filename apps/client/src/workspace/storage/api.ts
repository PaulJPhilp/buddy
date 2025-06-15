import { Effect } from "effect";
import type { UIState } from "../types";
import { StorageError } from "./errors";

export interface WorkspaceStorageApi {
  readonly load: Effect.Effect<UIState | null, StorageError>;
  readonly save: (state: UIState) => Effect.Effect<void, StorageError>;
  readonly clear: Effect.Effect<void, StorageError>;
}
