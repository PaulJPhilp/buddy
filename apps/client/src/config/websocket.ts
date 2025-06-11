// WebSocket Configuration
export interface WebSocketConfig {
  readonly chatUrl: string;
  readonly agentUrl: string;
  readonly reconnectAttempts: number;
  readonly reconnectDelay: number;
  readonly connectionTimeout: number;
  readonly heartbeatInterval: number;
}

// Environment-specific configurations
const configs: Record<string, WebSocketConfig> = {
  development: {
    chatUrl: "ws://localhost:8080/chat",
    agentUrl: "ws://localhost:8080/agent",
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    connectionTimeout: 10000,
    heartbeatInterval: 30000,
  },
  production: {
    chatUrl: "wss://api.buddy.com/chat",
    agentUrl: "wss://api.buddy.com/agent",
    reconnectAttempts: 10,
    reconnectDelay: 2000,
    connectionTimeout: 15000,
    heartbeatInterval: 30000,
  },
  test: {
    chatUrl: "ws://localhost:8081/chat",
    agentUrl: "ws://localhost:8081/agent",
    reconnectAttempts: 3,
    reconnectDelay: 500,
    connectionTimeout: 5000,
    heartbeatInterval: 10000,
  },
};

// Get current environment
const getEnvironment = (): string => {
  if (typeof window !== "undefined") {
    // Client-side environment detection
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }
    if (hostname.includes("staging")) {
      return "staging";
    }
    return "production";
  }

  // Server-side environment detection
  return process.env.NODE_ENV || "development";
};

// Get configuration for current environment
export const getWebSocketConfig = (): WebSocketConfig => {
  const env = getEnvironment();
  const config = configs[env] || configs.development;

  // Allow environment variable overrides
  return {
    ...config,
    chatUrl: process.env.NEXT_PUBLIC_WS_CHAT_URL || config.chatUrl,
    agentUrl: process.env.NEXT_PUBLIC_WS_AGENT_URL || config.agentUrl,
    reconnectAttempts: Number.parseInt(
      process.env.NEXT_PUBLIC_WS_RECONNECT_ATTEMPTS ||
        String(config.reconnectAttempts),
    ),
    reconnectDelay: Number.parseInt(
      process.env.NEXT_PUBLIC_WS_RECONNECT_DELAY ||
        String(config.reconnectDelay),
    ),
    connectionTimeout: Number.parseInt(
      process.env.NEXT_PUBLIC_WS_CONNECTION_TIMEOUT ||
        String(config.connectionTimeout),
    ),
    heartbeatInterval: Number.parseInt(
      process.env.NEXT_PUBLIC_WS_HEARTBEAT_INTERVAL ||
        String(config.heartbeatInterval),
    ),
  };
};

// WebSocket URL builders
export const buildChatUrl = (chatId: string): string => {
  const config = getWebSocketConfig();
  const url = new URL(config.chatUrl);
  url.searchParams.set("chatId", chatId);
  return url.toString();
};

export const buildAgentUrl = (agentId: string): string => {
  const config = getWebSocketConfig();
  const url = new URL(config.agentUrl);
  url.searchParams.set("agentId", agentId);
  return url.toString();
};

// Connection health check
export const isWebSocketSupported = (): boolean => {
  return typeof WebSocket !== "undefined";
};

// WebSocket readiness check
export const checkWebSocketEndpoint = async (url: string): Promise<boolean> => {
  if (!isWebSocketSupported()) {
    return false;
  }

  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 5000);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.close();
      resolve(true);
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
  });
};
