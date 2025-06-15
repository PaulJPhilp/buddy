import {
  ERROR_CODES,
  type WebSocketMessage,
  parseMessage,
} from "@buddy/protocol";
import { Effect, Queue, Stream } from "effect";
import { WebSocketConnectionManager } from "./WebSocketConnectionManager";
import type { WebSocketServiceApi } from "./api";
import { WebSocketError } from "./errors";
import type { UserMessage } from "./types";

// Re-export WebSocketError for consumers
export { WebSocketError } from "./errors";

/**
 * WebSocket service class implementing the Effect.Service pattern
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      // Get dependencies
      const connectionManager = yield* WebSocketConnectionManager;
      const messageQueue = yield* Queue.unbounded<WebSocketMessage>();

      // Create message stream from queue
      const messageStream = Stream.fromQueue(messageQueue);

      // Create service instance
      const service = {
        _tag: "WebSocketService" as const,
        connect: (url: string) =>
          Effect.gen(function* () {
            const connectionId = yield* connectionManager.getConnection(url);
            const ws = yield* connectionManager.connect(url);

            // Set up message handling
            ws.onmessage = (event) => {
              const parsed = parseMessage(event.data);
              if (parsed._tag === "Right") {
                Effect.runSync(Queue.offer(messageQueue, parsed.right));
              }
            };

            return; // Explicitly return void on success
          }).pipe(
            Effect.mapError(
              (error) =>
                new WebSocketError({
                  code: "CONNECT_ERROR",
                  message: "Failed to connect to WebSocket server",
                  cause: error,
                }),
            ),
          ),

        disconnect: () =>
          Effect.gen(function* () {
            const connections = yield* connectionManager.getAllConnections();
            for (const connection of connections) {
              yield* connectionManager.releaseConnection(connection.id);
            }
          }).pipe(
            Effect.mapError(
              (error) =>
                new WebSocketError({
                  code: "DISCONNECT_ERROR",
                  message: "Failed to disconnect from WebSocket server",
                  cause: error,
                }),
            ),
          ),

        cleanup: () =>
          Effect.gen(function* () {
            yield* connectionManager.cleanup();
          }),

        send: (message: UserMessage) =>
          Effect.gen(function* () {
            const connections = yield* connectionManager.getAllConnections();
            if (connections.length === 0) {
              return yield* Effect.fail(
                new WebSocketError({
                  code: "NOT_CONNECTED",
                  message: "Not connected to any WebSocket server",
                }),
              );
            }

            // Send to all connections
            for (const connection of connections) {
              const ws = yield* connectionManager.connect(connection.url).pipe(
                Effect.mapError(
                  (error) =>
                    new WebSocketError({
                      code: "SEND_ERROR",
                      message: "Failed to send message - connection error",
                      cause: error,
                    }),
                ),
              );
              ws.send(JSON.stringify(message));
            }
          }),

        isConnected: Effect.gen(function* () {
          const connections = yield* connectionManager.getAllConnections();
          return connections.length > 0;
        }),

        messageStream,
        receive: messageStream,
      } satisfies WebSocketServiceApi;

      return service;
    }),
    dependencies: [WebSocketConnectionManager.Default],
  },
) {}
