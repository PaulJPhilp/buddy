import { Data } from "effect";

export class ChatAppLoadError extends Data.TaggedError("ChatAppLoadError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ChatError = ChatAppLoadError;
