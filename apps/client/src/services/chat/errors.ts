import { Data } from "effect";

export class ChatMessageProcessingError extends Data.TaggedError(
  "ChatMessageProcessingError"
)<{
  readonly message: string;
  readonly messageId?: string;
  readonly cause?: unknown;
}> {}

export class ChatValidationError extends Data.TaggedError(
  "ChatValidationError"
)<{
  readonly message: string;
  readonly field?: string;
  readonly validationErrors?: string[];
  readonly cause?: unknown;
}> {}

export class ChatConnectionError extends Data.TaggedError(
  "ChatConnectionError"
)<{
  readonly message: string;
  readonly connectionId?: string;
  readonly endpoint?: string;
  readonly cause?: unknown;
}> {}

export class ChatAgentError extends Data.TaggedError("ChatAgentError")<{
  readonly message: string;
  readonly agentId?: string;
  readonly chatId?: string;
  readonly cause?: unknown;
}> {}

export class ChatHistoryError extends Data.TaggedError("ChatHistoryError")<{
  readonly message: string;
  readonly chatId?: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {}

export class ChatStreamError extends Data.TaggedError("ChatStreamError")<{
  readonly message: string;
  readonly streamId?: string;
  readonly cause?: unknown;
}> {}

export class ChatBatchError extends Data.TaggedError("ChatBatchError")<{
  readonly message: string;
  readonly batchId?: string;
  readonly failedCount?: number;
  readonly cause?: unknown;
}> {}

export class ChatOperationError extends Data.TaggedError("ChatOperationError")<{
  readonly message: string;
  readonly operation?: string;
  readonly operationId?: string;
  readonly cause?: unknown;
}> {}

export class ChatContentError extends Data.TaggedError("ChatContentError")<{
  readonly message: string;
  readonly contentType?: string;
  readonly contentSize?: number;
  readonly cause?: unknown;
}> {}

export class ChatServiceConfigurationError extends Data.TaggedError(
  "ChatServiceConfigurationError"
)<{
  readonly message: string;
  readonly configKey?: string;
  readonly cause?: unknown;
}> {}

export class ChatServiceStateError extends Data.TaggedError(
  "ChatServiceStateError"
)<{
  readonly message: string;
  readonly expectedState?: string;
  readonly actualState?: string;
  readonly cause?: unknown;
}> {}

export class ChatServiceTimeoutError extends Data.TaggedError(
  "ChatServiceTimeoutError"
)<{
  readonly message: string;
  readonly operation?: string;
  readonly timeoutMs?: number;
  readonly cause?: unknown;
}> {}

export class ChatServiceResourceError extends Data.TaggedError(
  "ChatServiceResourceError"
)<{
  readonly message: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly cause?: unknown;
}> {}

export class ChatServiceNetworkError extends Data.TaggedError(
  "ChatServiceNetworkError"
)<{
  readonly message: string;
  readonly endpoint?: string;
  readonly statusCode?: number;
  readonly cause?: unknown;
}> {}

export type ChatServiceError =
  | ChatMessageProcessingError
  | ChatValidationError
  | ChatConnectionError
  | ChatAgentError
  | ChatHistoryError
  | ChatStreamError
  | ChatBatchError
  | ChatOperationError
  | ChatContentError
  | ChatServiceConfigurationError
  | ChatServiceStateError
  | ChatServiceTimeoutError
  | ChatServiceResourceError
  | ChatServiceNetworkError;
