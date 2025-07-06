import { Effect, Layer } from "effect";
import { ConfigService } from "../../src/services/config";
import type { ConfigApi } from "../../src/services/config/api";

// Get environment variables with fallbacks
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3002";

// Export the test config layer
export const TestConfigLayer = Layer.succeed(ConfigService, {
  buildApiUrl: (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return Effect.succeed(`${API_URL}${cleanPath}`);
  },

  buildChatUrl: (chatId: string) => {
    const url = new URL(`${WS_URL}/chat`);
    url.searchParams.set("chatId", chatId);
    return Effect.succeed(url.toString());
  },

  getBaseUrl: Effect.succeed(API_URL),
} satisfies ConfigApi);
