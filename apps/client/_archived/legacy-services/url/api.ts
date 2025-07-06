import type { Effect } from "effect";

export interface UrlApi {
  readonly getBaseUrl: Effect.Effect<string, never, never>;
  readonly buildApiUrl: (path: string) => Effect.Effect<string, never, never>;
  readonly buildChatUrl: (
    chatId: string
  ) => Effect.Effect<string, never, never>;
}
