import { Effect } from "effect";
import type { ConfigApi } from "./api";

// Simple URL builders
export const buildApiUrl = (path: string): string => {
  const baseUrl = "http://localhost:3000";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const buildChatUrl = (chatId: string): string => {
  const chatUrl = "ws://localhost:8080/chat";
  const url = new URL(chatUrl);
  url.searchParams.set("chatId", chatId);
  return url.toString();
};

export class ConfigService extends Effect.Service<ConfigApi>()(
  "ConfigService",
  {
    scoped: Effect.gen(function* () {
      return {
        buildApiUrl: (path: string) => Effect.succeed(buildApiUrl(path)),
        buildChatUrl: (chatId: string) => Effect.succeed(buildChatUrl(chatId)),
      } satisfies ConfigApi;
    }),
    dependencies: [],
  },
) {}
