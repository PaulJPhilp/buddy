import { Data } from "effect";

export class ChatAppsEditorError extends Data.TaggedError(
  "ChatAppsEditorError"
)<{
  readonly message: string;
  readonly cause?: Error;
}> {}
