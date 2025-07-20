import { Data } from "effect";

export class UserAreaManagerError extends Data.TaggedError(
  "UserAreaManagerError"
)<{
  readonly message: string;
  readonly code: string;
  readonly cause?: Error;
  readonly details?: Record<string, unknown>;
}> {}

export class UserAreaManagerInitializationError extends Data.TaggedError(
  "UserAreaManagerInitializationError"
)<{
  readonly message: string;
  readonly chatAppId: string;
  readonly cause?: Error;
}> {}

export class UserAreaManagerOperationError extends Data.TaggedError(
  "UserAreaManagerOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: Error;
  readonly details?: Record<string, unknown>;
}> {}

export class UserAreaManagerStateError extends Data.TaggedError(
  "UserAreaManagerStateError"
)<{
  readonly message: string;
  readonly state: string;
  readonly expectedState?: string;
  readonly cause?: Error;
}> {}

export class UserAreaManagerConfigError extends Data.TaggedError(
  "UserAreaManagerConfigError"
)<{
  readonly message: string;
  readonly field: string;
  readonly value?: unknown;
  readonly cause?: Error;
}> {}

export class UserAreaManagerValidationError extends Data.TaggedError(
  "UserAreaManagerValidationError"
)<{
  readonly message: string;
  readonly field: string;
  readonly value?: unknown;
  readonly rule: string;
  readonly cause?: Error;
}> {}

export class UserAreaManagerInputError extends Data.TaggedError(
  "UserAreaManagerInputError"
)<{
  readonly message: string;
  readonly inputType: "text" | "file" | "agent";
  readonly value?: unknown;
  readonly cause?: Error;
}> {}

export class UserAreaManagerFileError extends Data.TaggedError(
  "UserAreaManagerFileError"
)<{
  readonly message: string;
  readonly fileName: string;
  readonly fileSize?: number;
  readonly fileType?: string;
  readonly cause?: Error;
}> {}

export class UserAreaManagerAgentError extends Data.TaggedError(
  "UserAreaManagerAgentError"
)<{
  readonly message: string;
  readonly agentId: string;
  readonly operation: string;
  readonly cause?: Error;
}> {}

export class UserAreaManagerMessageError extends Data.TaggedError(
  "UserAreaManagerMessageError"
)<{
  readonly message: string;
  readonly messageText: string;
  readonly attachmentCount: number;
  readonly cause?: Error;
}> {}

// Union type for all UserAreaManager errors
export type UserAreaManagerErrors =
  | UserAreaManagerError
  | UserAreaManagerInitializationError
  | UserAreaManagerOperationError
  | UserAreaManagerStateError
  | UserAreaManagerConfigError
  | UserAreaManagerValidationError
  | UserAreaManagerInputError
  | UserAreaManagerFileError
  | UserAreaManagerAgentError
  | UserAreaManagerMessageError;
