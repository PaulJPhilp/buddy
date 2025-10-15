import { Data } from "effect";

/**
 * Base error for all toolbar-related failures.
 */
export class ToolbarError extends Data.TaggedError("ToolbarError")<{
  readonly message: string;
  readonly cause?: Error;
}> {}

/**
 * Fired when a toolbar configuration file cannot be loaded or parsed.
 */
export class ConfigLoadError extends Data.TaggedError("ConfigLoadError")<{
  readonly path: string;
  readonly message: string;
}> {}

/**
 * Fired when a toolbar configuration fails schema validation.
 */
export class ConfigValidationError extends Data.TaggedError(
  "ConfigValidationError"
)<{
  readonly message: string;
  readonly path?: string;
  readonly cause?: unknown; // From Schema.ParseError or other validation errors
  readonly errors?: unknown; // Legacy field for Schema.ParseError
}> {}

/**
 * Fired when a command specified in a toolbar config is not found
 * in the command registry.
 */
export class CommandNotFoundError extends Data.TaggedError(
  "CommandNotFoundError"
)<{
  readonly commandId: string;
  readonly toolbarId: string;
}> {}

/**
 * Fired when a command's action effect fails during execution.
 */
export class CommandExecutionError extends Data.TaggedError(
  "CommandExecutionError"
)<{
  readonly commandId: string;
  readonly cause: Error;
}> {}
