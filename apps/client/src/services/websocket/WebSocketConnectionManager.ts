import { Effect, Layer, Ref, Schedule } from "effect";
import { Data } from "effect";

// Connection Manager Errors
export class ConnectionManagerError extends Data.TaggedError("ConnectionManagerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ConnectionPoolExhaustedError extends Data.TaggedError("ConnectionPoolExhaustedError")<{
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
  getConnection: (url: string) => Effect.Effect<string, ConnectionManagerError>; // Returns connection ID
  releaseConnection: (connectionId: string) => Effect.Effect<void, never>;
  getConnectionInfo: (connectionId: string) => Effect.Effect<ConnectionInfo | null, never>;
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
  config: ConnectionManagerConfig = defaultConfig
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
          toRemove.forEach(id => newMap.delete(id));
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
          Schedule.fixed(config.healthCheckInterval)
        )
      );
    });

    // Initialize cleanup task
    yield* startCleanupTask;

    const manager: WebSocketConnectionManagerApi = {
      _tag: "WebSocketConnectionManager",

      getConnection: (url: string) =>
        Effect.gen(function* () {
          const urlMappings = yield* Ref.get(urlToConnectionId);
          const existingConnectionId = urlMappings.get(url);
          
          if (existingConnectionId) {
            const currentConnections = yield* Ref.get(connections);
            const existingConnection = currentConnections.get(existingConnectionId);
            
            if (existingConnection && existingConnection.status === "connected") {
              // Update last activity
              yield* Ref.update(connections, (map) => {
                const newMap = new Map(map);
                newMap.set(existingConnectionId, {
                  ...existingConnection,
                  lastActivity: Date.now()
                });
                return newMap;
              });
              return existingConnectionId;
            }
          }
          
          // Check connection limit
          const currentConnections = yield* Ref.get(connections);
          if (currentConnections.size >= config.maxConnections) {
            return yield* Effect.fail(new ConnectionManagerError({
              message: `Maximum connections (${config.maxConnections}) reached`,
              cause: new ConnectionPoolExhaustedError({
                message: `Maximum connections (${config.maxConnections}) reached`,
                maxConnections: config.maxConnections
              })
            }));
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
            reconnectAttempts: 0
          };
          
          yield* Ref.update(connections, (map) => 
            new Map(map).set(connectionId, connectionInfo)
          );
          
          yield* Ref.update(urlToConnectionId, (map) => 
            new Map(map).set(url, connectionId)
          );
          
          yield* Effect.log(`Created new connection ${connectionId} for ${url}`);
          return connectionId;
        }),

      releaseConnection: (connectionId: string) =>
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
        }),

      getConnectionInfo: (connectionId: string) =>
        Effect.gen(function* () {
          const currentConnections = yield* Ref.get(connections);
          return currentConnections.get(connectionId) || null;
        }),

      getAllConnections: () =>
        Effect.gen(function* () {
          const currentConnections = yield* Ref.get(connections);
          return Array.from(currentConnections.values());
        }),

      healthCheck: () =>
        Effect.gen(function* () {
          const currentConnections = yield* Ref.get(connections);
          const total = currentConnections.size;
          const healthy = Array.from(currentConnections.values())
            .filter(conn => conn.status === "connected").length;
          
          return { healthy, total };
        }),

      cleanup: () =>
        Effect.gen(function* () {
          yield* Ref.set(connections, new Map());
          yield* Ref.set(urlToConnectionId, new Map());
          yield* Effect.log("Connection manager cleanup completed");
        })
    };

    return manager;
  });

// Service definition
export const WebSocketConnectionManager = Effect.Service<WebSocketConnectionManagerApi>()(
  "WebSocketConnectionManager",
  {
    effect: createConnectionManager(),
    dependencies: [],
  }
);

// Default layer
export const WebSocketConnectionManagerLive = Layer.effect(
  WebSocketConnectionManager,
  createConnectionManager()
); 