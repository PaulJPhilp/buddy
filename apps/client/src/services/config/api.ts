import { Effect } from "effect";

export interface ConfigApi {
  readonly buildApiUrl: (path: string) => Effect.Effect<string, never>;
  readonly buildChatUrl: (chatId: string) => Effect.Effect<string, never>;
}
