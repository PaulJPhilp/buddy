import { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { Effect } from "effect";
import { ChatAppEditorError } from "./errors";

export interface ChatAppEditorApi {
  readonly setChatApp: (
    chatApp: ChatAppConfig | null
  ) => Effect.Effect<never, never, void>;
  readonly getChatApp: () => Effect.Effect<
    never,
    ChatAppEditorError,
    ChatAppConfig | null
  >;
  readonly loadChatAppById: (
    id: string
  ) => Effect.Effect<never, ChatAppEditorError, ChatAppConfig>;
  readonly saveChatApp: (
    chatApp: ChatAppConfig
  ) => Effect.Effect<never, ChatAppEditorError, ChatAppConfig>;
  readonly deleteChatApp: (
    id: string
  ) => Effect.Effect<never, ChatAppEditorError, void>;
}
