import { Data } from "effect";

export class ChatManagerStateError extends Data.TaggedError(
  "ChatManagerStateError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerConversationError extends Data.TaggedError(
  "ChatManagerConversationError"
)<{
  readonly message: string;
  readonly conversationId?: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerMessageError extends Data.TaggedError(
  "ChatManagerMessageError"
)<{
  readonly message: string;
  readonly messageId?: string;
  readonly conversationId?: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerOperationError extends Data.TaggedError(
  "ChatManagerOperationError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerAgentError extends Data.TaggedError(
  "ChatManagerAgentError"
)<{
  readonly message: string;
  readonly agentId?: string;
  readonly conversationId?: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerSearchError extends Data.TaggedError(
  "ChatManagerSearchError"
)<{
  readonly message: string;
  readonly query: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerValidationError extends Data.TaggedError(
  "ChatManagerValidationError"
)<{
  readonly message: string;
  readonly field: string;
  readonly value?: unknown;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerInitializationError extends Data.TaggedError(
  "ChatManagerInitializationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ChatManagerError =
  | ChatManagerStateError
  | ChatManagerConversationError
  | ChatManagerMessageError
  | ChatManagerOperationError
  | ChatManagerAgentError
  | ChatManagerSearchError
  | ChatManagerValidationError
  | ChatManagerInitializationError;
