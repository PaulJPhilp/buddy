import { Data } from "effect";

export class ChatConnectionError extends Data.TaggedError(
  "ChatConnectionError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatMessageError extends Data.TaggedError("ChatMessageError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatHistoryError extends Data.TaggedError("ChatHistoryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatValidationError extends Data.TaggedError(
  "ChatValidationError",
)<{
  readonly message: string;
  readonly field?: string;
  readonly cause?: unknown;
}> {}

export type ChatServiceError =
  | ChatConnectionError
  | ChatMessageError
  | ChatHistoryError
  | ChatValidationError;

// Legacy error classes for backward compatibility with tests
export class HistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryError";
  }
  description = "Error accessing chat history";
  method = "getHistory";
}

export class MessageCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageCreationError";
  }
  description = "Error creating message";
  method = "sendMessage";
}

export class StateUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateUpdateError";
  }
  description = "Error updating chat state";
  method = "setState";
}

export class MessageStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageStreamError";
  }
  description = "Error in real-time message stream";
  method = "messageStream";
}
