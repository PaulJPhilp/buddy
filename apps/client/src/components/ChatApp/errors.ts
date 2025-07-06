import type { CoreComponentError } from "@/components/core";
import { Data } from "effect";

export class ChatAppLoadError extends Data.TaggedError("ChatAppLoadError")<{
  readonly message: string;
  readonly chatAppId: string;
  readonly cause?: unknown;
}> {}

export class ChatAppAgentError extends Data.TaggedError("ChatAppAgentError")<{
  readonly message: string;
  readonly agentId?: string;
  readonly chatAppId: string;
  readonly operation: "load" | "get" | "check";
  readonly cause?: unknown;
}> {}

export class ChatAppWindowError extends Data.TaggedError("ChatAppWindowError")<{
  readonly message: string;
  readonly chatAppId: string;
  readonly operation:
    | "open"
    | "close"
    | "minimize"
    | "maximize"
    | "restore"
    | "move"
    | "resize"
    | "focus"
    | "blur";
  readonly cause?: unknown;
}> {}

export class ChatAppUIError extends Data.TaggedError("ChatAppUIError")<{
  readonly message: string;
  readonly chatAppId: string;
  readonly operation: "render" | "check" | "update";
  readonly cause?: unknown;
}> {}

export class ChatAppConversationError extends Data.TaggedError(
  "ChatAppConversationError"
)<{
  readonly message: string;
  readonly chatAppId: string;
  readonly operation: "start" | "end" | "count" | "activity";
  readonly cause?: unknown;
}> {}

export class ChatAppOperationError extends Data.TaggedError(
  "ChatAppOperationError"
)<{
  readonly message: string;
  readonly chatAppId: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {}

export class ChatAppStateError extends Data.TaggedError("ChatAppStateError")<{
  readonly message: string;
  readonly chatAppId: string;
  readonly operation: "get" | "set" | "subscribe";
  readonly cause?: unknown;
}> {}

export class ChatAppValidationError extends Data.TaggedError(
  "ChatAppValidationError"
)<{
  readonly message: string;
  readonly chatAppId: string;
  readonly field: string;
  readonly value?: unknown;
  readonly cause?: unknown;
}> {}

export class ChatAppWindowBoundsError extends Data.TaggedError(
  "ChatAppWindowBoundsError"
)<{
  readonly message: string;
  readonly chatAppId: string;
  readonly requestedPosition?: { x: number; y: number };
  readonly requestedSize?: { width: number; height: number };
  readonly cause?: unknown;
}> {}

export type ChatAppComponentError =
  | ChatAppLoadError
  | ChatAppAgentError
  | ChatAppWindowError
  | ChatAppUIError
  | ChatAppConversationError
  | ChatAppOperationError
  | ChatAppStateError
  | ChatAppValidationError
  | ChatAppWindowBoundsError
  | CoreComponentError;
