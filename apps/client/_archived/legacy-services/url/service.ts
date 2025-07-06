import { Effect } from "effect";
import type { UrlApi } from "./api";

// URL builders using environment variables
const getApiBaseUrl = Effect.succeed(
  // In browser, use root-relative URLs; in Node.js (tests), use full URL
  typeof window !== "undefined"
    ? "/" // Browser: use root-relative URLs
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000" // Node.js: use full URL
);

const getWsBaseUrl = Effect.succeed(
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
);

export class UrlService extends Effect.Service<UrlApi>()("UrlService", {
  scoped: Effect.gen(function* () {
    const buildApiUrl = (path: string) =>
      Effect.gen(function* () {
        const baseUrl = yield* getApiBaseUrl;
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        // Properly construct URL avoiding double slashes
        const url =
          baseUrl.endsWith("/") && cleanPath.startsWith("/")
            ? `${baseUrl.slice(0, -1)}${cleanPath}`
            : `${baseUrl}${cleanPath}`;
        console.log(
          `[UrlService] buildApiUrl: baseUrl="${baseUrl}", path="${path}", cleanPath="${cleanPath}", result="${url}"`
        );
        return url;
      });

    const buildChatUrl = (chatId: string) =>
      Effect.gen(function* () {
        const wsUrl = yield* getWsBaseUrl;
        const url = new URL(wsUrl);
        url.pathname = url.pathname.endsWith("/")
          ? `${url.pathname}chat`
          : `${url.pathname}/chat`;
        url.searchParams.set("chatId", chatId);
        return url.toString();
      });

    const getBaseUrl = getApiBaseUrl;

    return {
      buildApiUrl,
      buildChatUrl,
      getBaseUrl,
    } satisfies UrlApi;
  }),
  dependencies: [], // UrlService has no dependencies
}) {}
