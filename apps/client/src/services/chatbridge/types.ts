// Service constants
export const CHAT_BRIDGE_CONSTANTS = {
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 1000,
  MAX_MESSAGE_QUEUE_SIZE: 1000,
  HEARTBEAT_INTERVAL_MS: 30000,
  MAX_HANDLERS: 100,
  MAX_CONNECTIONS: 50,
  MESSAGE_BUFFER_SIZE: 100,
  DEFAULT_PROTOCOL: "websocket" as const,
  SUPPORTED_PROTOCOLS: ["websocket", "http", "grpc"] as const,
} as const;

// Core message types
export interface ChatBridgeMessage {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: number;
  readonly source?: string;
  readonly target?: string;
  readonly priority?: "low" | "normal" | "high";
  readonly metadata?: Record<string, unknown>;
}

// Connection types
export interface ChatBridgeConnectionConfig {
  readonly endpoint: string;
  readonly protocol: "websocket" | "http" | "grpc";
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly authentication?: ChatBridgeAuthConfig;
  readonly headers?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}

export interface ChatBridgeAuthConfig {
  readonly type: "bearer" | "basic" | "apikey" | "oauth";
  readonly token?: string;
  readonly username?: string;
  readonly password?: string;
  readonly apiKey?: string;
  readonly refreshToken?: string;
}

export interface ChatBridgeConnection {
  readonly id: string;
  readonly endpoint: string;
  readonly protocol: string;
  readonly status: "connected" | "disconnected" | "connecting" | "error";
  readonly createdAt: number;
  readonly lastActivity: number;
  readonly messageCount: number;
  readonly errorCount: number;
  readonly metadata?: Record<string, unknown>;
}

// Handler types
export interface ChatBridgeHandler {
  readonly id?: string;
  readonly name?: string;
  readonly messageTypes?: string[];
  readonly priority?: number;
  readonly handler: (message: ChatBridgeMessage) => void | Promise<void>;
}

// Event types
export type ChatBridgeEventType =
  | "connection_opened"
  | "connection_closed"
  | "connection_error"
  | "message_sent"
  | "message_received"
  | "handler_registered"
  | "handler_unregistered"
  | "bridge_started"
  | "bridge_stopped"
  | "bridge_error"
  | "config_updated"
  | "heartbeat";

export interface ChatBridgeEvent {
  readonly type: ChatBridgeEventType;
  readonly timestamp: number;
  readonly payload: unknown;
  readonly connectionId?: string;
  readonly messageId?: string;
}

// Health and monitoring types
export interface ChatBridgeHealthStatus {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly serviceId: string;
  readonly uptime: number;
  readonly lastCheck: number;
  readonly connections: {
    readonly total: number;
    readonly active: number;
    readonly errors: number;
  };
  readonly messages: {
    readonly sent: number;
    readonly received: number;
    readonly queued: number;
    readonly errors: number;
  };
  readonly handlers: {
    readonly registered: number;
    readonly active: number;
  };
}

export interface ChatBridgeMetrics {
  readonly messageCount: number;
  readonly connectionCount: number;
  readonly handlerCount: number;
  readonly errorCount: number;
  readonly averageResponseTime: number;
  readonly throughput: number;
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly lastActivity: number;
}

// State types
export interface ChatBridgeState {
  readonly isStarted: boolean;
  readonly connections: Map<string, ChatBridgeConnection>;
  readonly handlers: Map<string, ChatBridgeHandler>;
  readonly messageQueue: ChatBridgeMessage[];
  readonly eventSubscriptions: Map<string, ChatBridgeEventSubscription>;
  readonly config: ChatBridgeConnectionConfig | null;
  readonly metrics: ChatBridgeMetrics;
  readonly lastError?: string;
}

export interface ChatBridgeEventSubscription {
  readonly id: string;
  readonly eventType: ChatBridgeEventType;
  readonly handler: (payload: unknown) => void;
  readonly createdAt: number;
}

// Utility types
export interface ChatBridgeMessageFilter {
  readonly types?: string[];
  readonly sources?: string[];
  readonly priority?: "low" | "normal" | "high";
  readonly fromTimestamp?: number;
  readonly toTimestamp?: number;
}

export interface ChatBridgeConnectionStats {
  readonly connectionId: string;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly bytesTransferred: number;
  readonly averageLatency: number;
  readonly errorRate: number;
  readonly uptime: number;
}

// Validation helpers
export function isValidConnectionId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}

export function isValidMessageType(type: string): boolean {
  return typeof type === "string" && type.length > 0 && type.length <= 50;
}

export function isValidEndpoint(endpoint: string): boolean {
  try {
    new URL(endpoint);
    return true;
  } catch {
    return false;
  }
}

export function isValidProtocol(
  protocol: string
): protocol is "websocket" | "http" | "grpc" {
  return CHAT_BRIDGE_CONSTANTS.SUPPORTED_PROTOCOLS.includes(protocol as any);
}

// Utility functions
export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateHandlerId(): string {
  return `handler_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateSubscriptionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function createChatBridgeMessage(
  type: string,
  payload: unknown,
  options?: Partial<ChatBridgeMessage>
): ChatBridgeMessage {
  return {
    id: generateMessageId(),
    type,
    payload,
    timestamp: Date.now(),
    priority: "normal",
    ...options,
  };
}

export function createChatBridgeConnection(
  endpoint: string,
  protocol: string,
  options?: Partial<ChatBridgeConnection>
): ChatBridgeConnection {
  return {
    id: generateConnectionId(),
    endpoint,
    protocol,
    status: "disconnected",
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    errorCount: 0,
    ...options,
  };
}

export function createChatBridgeHandler(
  handler: (message: ChatBridgeMessage) => void | Promise<void>,
  options?: Partial<ChatBridgeHandler>
): ChatBridgeHandler {
  return {
    id: generateHandlerId(),
    priority: 0,
    handler,
    ...options,
  };
}

export function createInitialChatBridgeState(): ChatBridgeState {
  return {
    isStarted: false,
    connections: new Map(),
    handlers: new Map(),
    messageQueue: [],
    eventSubscriptions: new Map(),
    config: null,
    metrics: {
      messageCount: 0,
      connectionCount: 0,
      handlerCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      throughput: 0,
      uptime: 0,
      memoryUsage: 0,
      lastActivity: Date.now(),
    },
  };
}
