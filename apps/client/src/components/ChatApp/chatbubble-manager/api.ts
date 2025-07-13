import { Effect } from "effect";
// ChatBubbleManagerApi: contract for bubble-level operations
import type { Message } from "../ChatBubble";
import { ChatBubbleError } from "./errors";
import type { ChatBubbleState } from "./types";

export interface ChatBubbleManagerApi {
  readonly formatMessage: (
    message: Message
  ) => Effect.Effect<string, never, never>;
  readonly getBubbleState: (
    messageId: string
  ) => Effect.Effect<ChatBubbleState, never, never>;
  readonly setBubbleState: (
    messageId: string,
    state: Partial<ChatBubbleState>
  ) => Effect.Effect<void, never, never>;
  readonly performAction: (
    messageId: string,
    action: ChatBubbleAction
  ) => Effect.Effect<void, ChatBubbleError, never>;
}

export type ChatBubbleAction = "edit" | "retry" | "copy" | "delete" | "react";
