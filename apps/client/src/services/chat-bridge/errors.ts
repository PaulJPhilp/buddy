import { Data } from "effect";

export class ChatBridgeError extends Data.TaggedError("ChatBridgeError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeStartError extends Data.TaggedError(
  "ChatBridgeStartError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatBridgeStopError extends Data.TaggedError(
  "ChatBridgeStopError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
