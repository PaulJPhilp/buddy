import { Data } from "effect"

export class AppConfigValidationError extends Data.TaggedError("AppConfigValidationError")<{
  readonly message: string
  readonly errors: Record<string, string>
}> {}

export class AppConfigNotFoundError extends Data.TaggedError("AppConfigNotFoundError")<{
  readonly configId: string
}> {}

export class AppConfigReferenceError extends Data.TaggedError("AppConfigReferenceError")<{
  readonly message: string
  readonly referenceId: string
}> {}

export class AppConfigPersistenceError extends Data.TaggedError("AppConfigPersistenceError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/**
 * An error that occurs when a chat app configuration fails to load.
 * This could be due to a network error, a parsing error, or the file not being found.
 */
export class AppConfigLoadError extends Data.TaggedError("AppConfigLoadError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export type AppServiceError =
  | AppConfigValidationError
  | AppConfigNotFoundError
  | AppConfigReferenceError
  | AppConfigPersistenceError
  | AppConfigLoadError
