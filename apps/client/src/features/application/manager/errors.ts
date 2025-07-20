import { Data } from "effect";

export class ConfigLoadError extends Data.TaggedError("ConfigLoadError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigSaveError extends Data.TaggedError("ConfigSaveError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly cause?: unknown;
}> {}

export class ConfigValidationError extends Data.TaggedError(
  "ConfigValidationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ConfigParseError extends Data.TaggedError("ConfigParseError")<{
  readonly message: string;
  readonly configPath?: string;
  readonly format?: string;
  readonly cause?: unknown;
}> {}

export class AppConfigLoadError extends Data.TaggedError("AppConfigLoadError")<{
  readonly message: string;
  readonly configPath: string;
  readonly cause?: unknown;
}> {}

export class AppConfigValidationError extends Data.TaggedError(
  "AppConfigValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export class AppWorkspaceError extends Data.TaggedError("AppWorkspaceError")<{
  readonly message: string;
  readonly workspaceId: string;
  readonly operation: "set" | "get" | "validate";
  readonly cause?: unknown;
}> {}

export class AppShellRenderError extends Data.TaggedError(
  "AppShellRenderError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AppStateError extends Data.TaggedError("AppStateError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class AppInitializationError extends Data.TaggedError(
  "AppInitializationError"
)<{
  readonly message: string;
  readonly phase: "config" | "workspace" | "shell" | "unknown";
  readonly cause?: unknown;
}> {}

export type AppComponentError =
  | ConfigLoadError
  | ConfigValidationError
  | ConfigSaveError
  | ConfigParseError;
