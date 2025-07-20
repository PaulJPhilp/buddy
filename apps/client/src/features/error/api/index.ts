import { Effect } from "effect";
import { AppError, FatalError, HandledError } from "../errors";

export interface ErrorManagerApi {
  readonly reportError: (
    error: AppError | FatalError | HandledError
  ) => Effect.Effect<void, never, void>;
  readonly clearError: (errorId: string) => Effect.Effect<void, never, void>;
  readonly getErrors: () => Effect.Effect<
    never,
    never,
    (AppError | FatalError | HandledError)[]
  >;
}
