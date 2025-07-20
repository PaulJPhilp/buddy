import { AppError, FatalError, HandledError } from "../errors";

export interface ErrorState {
  readonly errors: (AppError | FatalError | HandledError)[];
}
