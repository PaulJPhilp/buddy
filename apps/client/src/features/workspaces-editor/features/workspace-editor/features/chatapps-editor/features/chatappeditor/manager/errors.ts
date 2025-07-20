import { Data } from "effect";

export class ChatAppEditorError extends Data.TaggedError("ChatAppEditorError")<{
  readonly message: string;
  readonly cause?: Error;
}> {}
