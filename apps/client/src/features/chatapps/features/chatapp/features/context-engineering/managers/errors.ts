import { Data } from "effect";

// Base error class
export class ContextEngineeringManagerError extends Data.TaggedError(
  "ContextEngineeringManagerError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}

// State-related errors
export class ContextEngineeringManagerStateError extends Data.TaggedError(
  "ContextEngineeringManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: Error;
}> {}

// Initialization errors
export class ContextEngineeringManagerInitializationError extends Data.TaggedError(
  "ContextEngineeringManagerInitializationError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}

// Element management errors
export class ContextElementNotFoundError extends Data.TaggedError(
  "ContextElementNotFoundError"
)<{
  readonly elementId: string;
  readonly section: "prePrompt" | "postPrompt";
}> {}

export class ContextElementValidationError extends Data.TaggedError(
  "ContextElementValidationError"
)<{
  readonly message: string;
  readonly elementId?: string;
  readonly validationErrors: readonly string[];
  readonly cause?: Error;
}> {}

export class ContextElementDuplicateError extends Data.TaggedError(
  "ContextElementDuplicateError"
)<{
  readonly elementId: string;
  readonly section: "prePrompt" | "postPrompt";
}> {}

// Section management errors
export class ContextSectionLimitError extends Data.TaggedError(
  "ContextSectionLimitError"
)<{
  readonly section: "prePrompt" | "postPrompt";
  readonly currentCount: number;
  readonly maxAllowed: number;
}> {}

export class ContextSectionReorderError extends Data.TaggedError(
  "ContextSectionReorderError"
)<{
  readonly section: "prePrompt" | "postPrompt";
  readonly message: string;
  readonly cause?: Error;
}> {}

// Context assembly errors
export class ContextAssemblyError extends Data.TaggedError(
  "ContextAssemblyError"
)<{
  readonly message: string;
  readonly missingData?: readonly string[];
  readonly cause?: Error;
}> {}

// Operation errors
export class ContextEngineeringOperationError extends Data.TaggedError(
  "ContextEngineeringOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: Error;
}> {}

// Configuration errors
export class ContextEngineeringConfigError extends Data.TaggedError(
  "ContextEngineeringConfigError"
)<{
  readonly message: string;
  readonly configField?: string;
  readonly cause?: Error;
}> {}

// File reference errors
export class ContextFileReferenceError extends Data.TaggedError(
  "ContextFileReferenceError"
)<{
  readonly fileId: string;
  readonly message: string;
  readonly cause?: Error;
}> {}

// Persistence errors
export class ContextPersistenceError extends Data.TaggedError(
  "ContextPersistenceError"
)<{
  readonly message: string;
  readonly operation: "save" | "load" | "delete";
  readonly cause?: Error;
}> {}

// Union type for all context engineering errors
export type ContextEngineeringError =
  | ContextEngineeringManagerError
  | ContextEngineeringManagerStateError
  | ContextEngineeringManagerInitializationError
  | ContextElementNotFoundError
  | ContextElementValidationError
  | ContextElementDuplicateError
  | ContextSectionLimitError
  | ContextSectionReorderError
  | ContextAssemblyError
  | ContextEngineeringOperationError
  | ContextEngineeringConfigError
  | ContextFileReferenceError
  | ContextPersistenceError;
