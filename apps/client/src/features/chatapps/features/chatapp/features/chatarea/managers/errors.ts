import { Data } from "effect";

export class ChatAreaManagerError extends Data.TaggedError(
  "ChatAreaManagerError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ChatAreaManagerStateError extends Data.TaggedError(
  "ChatAreaManagerStateError"
)<{
  readonly message: string;
  readonly state: "uninitialized" | "invalid";
  readonly cause?: unknown;
}> {}
