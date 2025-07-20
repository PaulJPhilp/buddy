import type { Message } from "@/features/chatapps/chatapp/types/chat";
import type { Effect } from "effect";
import type { ChatAreaManagerError, ChatAreaManagerStateError } from "./errors";
import type {
  ChatAreaManagerConfig,
  ChatAreaManagerState,
  ChatAreaManagerStats,
} from "./types";

export interface ChatAreaManagerApi {
  readonly initialize: (
    config: ChatAreaManagerConfig
  ) => Effect.Effect<void, ChatAreaManagerError | ChatAreaManagerStateError>;
  readonly cleanup: () => Effect.Effect<void, ChatAreaManagerError>;
  readonly addMessage: (
    message: Message
  ) => Effect.Effect<void, ChatAreaManagerError>;
  readonly setTyping: (
    isTyping: boolean
  ) => Effect.Effect<void, ChatAreaManagerError>;
  readonly loadHistory: () => Effect.Effect<void, ChatAreaManagerError>;
  readonly getState: () => Effect.Effect<
    ChatAreaManagerState,
    ChatAreaManagerError
  >;
  readonly subscribe: (
    cb: (state: ChatAreaManagerState) => void
  ) => Effect.Effect<() => void, ChatAreaManagerError>;
  readonly getStats: () => Effect.Effect<
    ChatAreaManagerStats,
    ChatAreaManagerError
  >;
}
