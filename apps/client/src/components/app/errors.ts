import type { CoreComponentError } from "@/components/core";
import type { WorkspaceComponentError } from "@/components/workspace";
import { Data } from "effect";

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
  | AppConfigLoadError
  | AppConfigValidationError
  | AppWorkspaceError
  | AppShellRenderError
  | AppStateError
  | AppInitializationError
  | CoreComponentError
  | WorkspaceComponentError;
