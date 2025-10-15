import { Effect } from "effect";
import { AppError, FatalError, HandledError } from "../errors";

export interface ErrorManagerApi {
  readonly reportError: (
    error: AppError | FatalError | HandledError
  ) => Effect.Effect<void>;
  readonly clearError: (errorId: string) => Effect.Effect<void>;
  readonly getErrors: () => Effect.Effect<
    (AppError | FatalError | HandledError)[]
  >;
}
