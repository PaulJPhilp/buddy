import { Data } from "effect";

export class WorkspaceLLMError extends Data.TaggedError("WorkspaceLLMError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WorkspaceToolError extends Data.TaggedError("WorkspaceToolError")<{
  readonly operation: string;
  readonly details: string;
  readonly cause?: unknown;
}> {}

export class ChatAppToolError extends Data.TaggedError("ChatAppToolError")<{
  readonly operation: string;
  readonly details: string;
  readonly cause?: unknown;
}> {}

export class LLMAPIInitializationError extends Data.TaggedError(
  "LLMAPIInitializationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class LLMValidationError extends Data.TaggedError("LLMValidationError")<{
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly cause?: unknown;
}> {}

export class LLMConfigurationError extends Data.TaggedError(
  "LLMConfigurationError"
)<{
  readonly configId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type WorkspaceLLMServiceError =
  | WorkspaceLLMError
  | WorkspaceToolError
  | ChatAppToolError
  | LLMAPIInitializationError
  | LLMValidationError
  | LLMConfigurationError;
