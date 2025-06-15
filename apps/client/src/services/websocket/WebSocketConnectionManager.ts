import { Effect, Layer, Ref, Schedule } from "effect";
import { Data } from "effect";
import { WebSocketError } from "./errors";

// Connection Manager Errors
export class ConnectionManagerError extends Data.TaggedError(
  "ConnectionManagerError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ConnectionPoolExhaustedError extends Data.TaggedError(
  "ConnectionPoolExhaustedError",
)<{
  readonly message: string;
  readonly maxConnections: number;
}> {}

// Connection state tracking
export interface ConnectionInfo {
  readonly id: string;
  readonly url: string;
  readonly status: "connecting" | "connected" | "disconnected" | "error";
  readonly createdAt: number;
  readonly lastActivity: number;
  readonly reconnectAttempts: number;
}

// Connection manager interface
export interface WebSocketConnectionManagerApi {
  readonly _tag: "WebSocketConnectionManager";
  connect: (url: string) => Effect.Effect<WebSocket, WebSocketError>;
  disconnect: (ws: WebSocket) => Effect.Effect<void, WebSocketError>;
  getConnection: (url: string) => Effect.Effect<string, ConnectionManagerError>;
  releaseConnection: (connectionId: string) => Effect.Effect<void, never>;
  getConnectionInfo: (
    connectionId: string,
  ) => Effect.Effect<ConnectionInfo | null, never>;
  getAllConnections: () => Effect.Effect<ReadonlyArray<ConnectionInfo>, never>;
  healthCheck: () => Effect.Effect<{ healthy: number; total: number }, never>;
  cleanup: () => Effect.Effect<void, never>;
}

// Configuration for connection manager
interface ConnectionManagerConfig {
  readonly maxConnections: number;
  readonly connectionTimeout: number;
  readonly idleTimeout: number;
  readonly healthCheckInterval: number;
}

const defaultConfig: ConnectionManagerConfig = {
  maxConnections: 10,
  connectionTimeout: 30000,
  idleTimeout: 300000, // 5 minutes
  healthCheckInterval: 60000, // 1 minute
};

// Create connection manager implementation
const createConnectionManager = (
  config: ConnectionManagerConfig = defaultConfig,
): Effect.Effect<WebSocketConnectionManagerApi, never> =>
  Effect.gen(function* () {
    const connections = yield* Ref.make<Map<string, ConnectionInfo>>(new Map());
    const urlToConnectionId = yield* Ref.make<Map<string, string>>(new Map());

    // Generate unique connection ID
    const generateConnectionId = (): string =>
      `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Cleanup idle connections
    const cleanupIdleConnections = Effect.gen(function* () {
      const now = Date.now();
      const currentConnections = yield* Ref.get(connections);
      const urlMappings = yield* Ref.get(urlToConnectionId);

      const toRemove: string[] = [];

      for (const [id, info] of currentConnections) {
        if (now - info.lastActivity > config.idleTimeout) {
          toRemove.push(id);
        }
      }

      if (toRemove.length > 0) {
        yield* Ref.update(connections, (map) => {
          const newMap = new Map(map);
          for (const id of toRemove) {
            newMap.delete(id);
          }
          return newMap;
        });

        yield* Ref.update(urlToConnectionId, (map) => {
          const newMap = new Map(map);
          for (const [url, connId] of map) {
            if (toRemove.includes(connId)) {
              newMap.delete(url);
            }
          }
          return newMap;
        });

        yield* Effect.log(`Cleaned up ${toRemove.length} idle connections`);
      }
    });

    // Start background cleanup task
    const startCleanupTask = Effect.gen(function* () {
      yield* Effect.fork(
        Effect.repeat(
          cleanupIdleConnections,
          Schedule.fixed(config.healthCheckInterval),
        ),
      );
    });

    // Initialize cleanup task
    yield* startCleanupTask;

    const connect = (url: string) =>
      Effect.gen(function* () {
        const ws = yield* Effect.try({
          try: () => new WebSocket(url),
          catch: (error) =>
            new WebSocketError({
              message: `Failed to create WebSocket connection to: ${url}`,
              cause: error,
            }),
        });

        // Wait for connection to be established or fail
        yield* Effect.promise(
          () =>
            new Promise((resolve, reject) => {
              ws.onopen = () => resolve(undefined);
              ws.onerror = (error) => reject(error);
            }),
        ).pipe(
          Effect.mapError(
            (error) =>
              new WebSocketError({
                message: `Failed to connect to WebSocket server: ${url}`,
                cause: error,
              }),
          ),
        );

        return ws;
      });

    const disconnect = (ws: WebSocket) =>
      Effect.gen(function* () {
        try {
          ws.close();
        } catch (error) {
          return yield* Effect.fail(
            new WebSocketError({
              message: "Failed to disconnect from WebSocket server",
              cause: error,
            }),
          );
        }
      });

    const getConnection = (url: string) =>
      Effect.gen(function* () {
        const urlMappings = yield* Ref.get(urlToConnectionId);
        const existingConnectionId = urlMappings.get(url);

        if (existingConnectionId) {
          const currentConnections = yield* Ref.get(connections);
          const existingConnection =
            currentConnections.get(existingConnectionId);

          if (existingConnection && existingConnection.status === "connected") {
            // Update last activity
            yield* Ref.update(connections, (map) => {
              const newMap = new Map(map);
              newMap.set(existingConnectionId, {
                ...existingConnection,
                lastActivity: Date.now(),
              });
              return newMap;
            });
            return existingConnectionId;
          }
        }

        // Check connection limit
        const currentConnections = yield* Ref.get(connections);
        if (currentConnections.size >= config.maxConnections) {
          return yield* Effect.fail(
            new ConnectionManagerError({
              message: `Maximum connections (${config.maxConnections}) reached`,
              cause: new ConnectionPoolExhaustedError({
                message: `Maximum connections (${config.maxConnections}) reached`,
                maxConnections: config.maxConnections,
              }),
            }),
          );
        }

        // Create new connection
        const connectionId = generateConnectionId();
        const now = Date.now();

        const connectionInfo: ConnectionInfo = {
          id: connectionId,
          url,
          status: "connecting",
          createdAt: now,
          lastActivity: now,
          reconnectAttempts: 0,
        };

        yield* Ref.update(connections, (map) =>
          new Map(map).set(connectionId, connectionInfo),
        );

        yield* Ref.update(urlToConnectionId, (map) =>
          new Map(map).set(url, connectionId),
        );

        yield* Effect.log(`Created new connection ${connectionId} for ${url}`);
        return connectionId;
      });

    const releaseConnection = (connectionId: string) =>
      Effect.gen(function* () {
        const currentConnections = yield* Ref.get(connections);
        const connection = currentConnections.get(connectionId);

        if (connection) {
          yield* Ref.update(connections, (map) => {
            const newMap = new Map(map);
            newMap.delete(connectionId);
            return newMap;
          });

          yield* Ref.update(urlToConnectionId, (map) => {
            const newMap = new Map(map);
            newMap.delete(connection.url);
            return newMap;
          });

          yield* Effect.log(`Released connection ${connectionId}`);
        }
      });

    const getConnectionInfo = (connectionId: string) =>
      Effect.gen(function* () {
        const currentConnections = yield* Ref.get(connections);
        return currentConnections.get(connectionId) || null;
      });

    const getAllConnections = () =>
      Effect.gen(function* () {
        const currentConnections = yield* Ref.get(connections);
        return Array.from(currentConnections.values());
      });

    const healthCheck = () =>
      Effect.gen(function* () {
        const currentConnections = yield* Ref.get(connections);
        const total = currentConnections.size;
        const healthy = Array.from(currentConnections.values()).filter(
          (conn) => conn.status === "connected",
        ).length;

        return { healthy, total };
      });

    const cleanup = () =>
      Effect.gen(function* () {
        yield* Ref.set(connections, new Map());
        yield* Ref.set(urlToConnectionId, new Map());
        yield* Effect.log("Connection manager cleanup completed");
      });

    return {
      _tag: "WebSocketConnectionManager",
      connect,
      disconnect,
      getConnection,
      releaseConnection,
      getConnectionInfo,
      getAllConnections,
      healthCheck,
      cleanup,
    };
  });

/**
 * WebSocket connection manager service following Effect.Service pattern
 */
export class WebSocketConnectionManager extends Effect.Service<WebSocketConnectionManagerApi>()(
  "WebSocketConnectionManager",
  {
    scoped: Effect.gen(function* () {
      const service = yield* createConnectionManager();
      return service;
    }),
    dependencies: [],
  },
) {}

// Default layer
export const WebSocketConnectionManagerLive = Layer.effect(
  WebSocketConnectionManager,
  createConnectionManager(),
);
