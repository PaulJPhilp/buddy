import { Data } from "effect";

export class ChatManagerError extends Data.TaggedError("ChatManagerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatInstanceNotFoundError extends Data.TaggedError(
  "ChatInstanceNotFoundError",
)<{
  readonly chatId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class NoChatActiveError extends Data.TaggedError("NoChatActiveError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatInstanceCreationError extends Data.TaggedError(
  "ChatInstanceCreationError",
)<{
  readonly chatId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatManagerOperationError extends Data.TaggedError(
  "ChatManagerOperationError",
)<{
  readonly operation: string;
  readonly chatId?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AgentSwitchError extends Data.TaggedError("AgentSwitchError")<{
  readonly chatId: string;
  readonly agentId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ChatManagerErrorType =
  | ChatManagerError
  | ChatInstanceNotFoundError
  | NoChatActiveError
  | ChatInstanceCreationError
  | ChatManagerOperationError
  | AgentSwitchError;
