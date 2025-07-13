// Errors for ChatBubbleManager
import { Data } from "effect";

export class ChatBubbleError extends Data.TaggedError("ChatBubbleError")<{
  readonly message: string;
  readonly messageId?: string;
  readonly cause?: unknown;
}> {}
