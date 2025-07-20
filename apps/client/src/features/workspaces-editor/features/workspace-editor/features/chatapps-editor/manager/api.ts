import { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { Data, Effect } from "effect";
import { ChatAppsEditorError } from "./errors";

export interface ChatAppsEditorManagerApi {
  readonly getAllChatApps: () => Effect.Effect<
    never,
    ChatAppsEditorError,
    ChatAppConfig[]
  >;
  readonly addChatApp: (
    chatApp: ChatAppConfig
  ) => Effect.Effect<never, ChatAppsEditorError, ChatAppConfig>;
  readonly updateChatApp: (
    chatApp: ChatAppConfig
  ) => Effect.Effect<never, ChatAppsEditorError, ChatAppConfig>;
  readonly deleteChatApp: (
    id: string
  ) => Effect.Effect<never, ChatAppsEditorError, void>;
}
