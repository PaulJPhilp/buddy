import { Effect } from "effect";
import type { ChatBridgeServiceError } from "./errors";
import type {
  ChatBridgeConnection,
  ChatBridgeConnectionConfig,
  ChatBridgeEventType,
  ChatBridgeHandler,
  ChatBridgeHealthStatus,
  ChatBridgeMessage,
  ChatBridgeMetrics,
} from "./types";

export interface ChatBridgeApi {
  // Core bridge operations
  readonly noop: () => Effect.Effect<void, ChatBridgeServiceError>;
  readonly start: () => Effect.Effect<void, ChatBridgeServiceError>;
  readonly stop: () => Effect.Effect<void, ChatBridgeServiceError>;
  readonly restart: () => Effect.Effect<void, ChatBridgeServiceError>;
  readonly isStarted: () => Effect.Effect<boolean, never>;

  // Message handling
  readonly registerHandler: (
    handler: ChatBridgeHandler
  ) => Effect.Effect<string, ChatBridgeServiceError>;
  readonly unregisterHandler: (
    handlerId: string
  ) => Effect.Effect<void, ChatBridgeServiceError>;
  readonly sendMessage: (
    message: ChatBridgeMessage
  ) => Effect.Effect<void, ChatBridgeServiceError>;
  readonly broadcastMessage: (
    message: ChatBridgeMessage
  ) => Effect.Effect<void, ChatBridgeServiceError>;

  // Connection management
  readonly establishConnection: (
    config: ChatBridgeConnectionConfig
  ) => Effect.Effect<ChatBridgeConnection, ChatBridgeServiceError>;
  readonly closeConnection: (
    connectionId: string
  ) => Effect.Effect<void, ChatBridgeServiceError>;
  readonly getConnection: (
    connectionId: string
  ) => Effect.Effect<ChatBridgeConnection | null, ChatBridgeServiceError>;
  readonly getAllConnections: () => Effect.Effect<
    ChatBridgeConnection[],
    ChatBridgeServiceError
  >;

  // Event management
  readonly emitEvent: (
    eventType: ChatBridgeEventType,
    payload: unknown
  ) => Effect.Effect<void, ChatBridgeServiceError>;
  readonly subscribeToEvents: (
    eventType: ChatBridgeEventType,
    handler: (payload: unknown) => void
  ) => Effect.Effect<string, ChatBridgeServiceError>;
  readonly unsubscribeFromEvents: (
    subscriptionId: string
  ) => Effect.Effect<void, ChatBridgeServiceError>;

  // Health and monitoring
  readonly getHealth: () => Effect.Effect<ChatBridgeHealthStatus, never>;
  readonly getMetrics: () => Effect.Effect<ChatBridgeMetrics, never>;
  readonly reset: () => Effect.Effect<void, ChatBridgeServiceError>;

  // Configuration
  readonly updateConfig: (
    config: Partial<ChatBridgeConnectionConfig>
  ) => Effect.Effect<void, ChatBridgeServiceError>;
  readonly getConfig: () => Effect.Effect<
    ChatBridgeConnectionConfig | null,
    never
  >;

  // Advanced operations
  readonly ping: (
    connectionId?: string
  ) => Effect.Effect<number, ChatBridgeServiceError>;
  readonly getConnectionStatus: (
    connectionId: string
  ) => Effect.Effect<
    "connected" | "disconnected" | "connecting" | "error",
    ChatBridgeServiceError
  >;
  readonly flushMessages: () => Effect.Effect<void, ChatBridgeServiceError>;
  readonly getMessageQueue: () => Effect.Effect<ChatBridgeMessage[], never>;
}
