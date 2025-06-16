import { parseMessage } from "@buddy/protocol";
import { Effect, Queue, Stream } from "effect";
import WebSocket from "isomorphic-ws";
import type { WebSocketServiceApi } from "./api";
import { WebSocketConnectionError, WebSocketSendError } from "./errors";
import type { ProtocolMessage, UserMessage, WebSocketEnvelope } from "./types";

// Re-export error classes for consumers
export {
  WebSocketConnectionError,
  WebSocketSendError,
  WebSocketError,
} from "./errors";

/**
 * WebSocket service class implementing the Effect.Service pattern
 * Following llm-agent patterns for simplicity and reliability
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    effect: Effect.gen(function* () {
      const instanceId = Math.random().toString(36).substring(7);
      console.log(
        "[WebSocketService] Service construction started, instanceId:",
        instanceId,
      );

      // Create fresh message queue for each service instance
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const messageStream = Stream.fromQueue(messageQueue);

      // Create a simple callback-based message notification system
      const messageCallbacks = new Set<(message: ProtocolMessage) => void>();

      const addMessageCallback = (
        callback: (message: ProtocolMessage) => void,
      ) => {
        console.log("[WebSocketService] Adding message callback");
        messageCallbacks.add(callback);
        return Effect.sync(() => {
          console.log("[WebSocketService] Removing message callback");
          messageCallbacks.delete(callback);
        });
      };

      const notifyMessageCallbacks = (message: ProtocolMessage) => {
        console.log(
          "[WebSocketService] Notifying",
          messageCallbacks.size,
          "callbacks for message:",
          message.id,
        );
        for (const callback of messageCallbacks) {
          try {
            callback(message);
          } catch (error) {
            console.error(
              "[WebSocketService] Error in message callback:",
              error,
            );
          }
        }
      };

      // Create a simple stream that uses the callback system
      const callbackMessageStream = Stream.async<ProtocolMessage>((emit) => {
        console.log(
          "[WebSocketService] Setting up callback-based message stream",
        );
        const callback = (message: ProtocolMessage) => {
          console.log(
            "[WebSocketService] Stream callback received message:",
            message.id,
          );
          emit.single(message);
        };

        return addMessageCallback(callback);
      });

      // Create service instance with fresh state (no shared connection)
      const service = {
        _tag: "WebSocketService" as const,
        instanceId,

        connect: (url: string) =>
          Effect.gen(function* () {
            console.log("[WebSocketService] Connecting to:", url);

            // Use Effect.promise directly (like llm-agent)
            const ws = yield* Effect.promise(() => {
              console.log("[WebSocketService] Creating WebSocket connection");

              return new Promise<WebSocket>((resolve, reject) => {
                const websocket = new WebSocket(url);

                const timeout = setTimeout(() => {
                  console.log("[WebSocketService] Connection timeout");
                  websocket.close();
                  reject(new Error("Connection timeout after 5000ms"));
                }, 5000);

                websocket.onopen = () => {
                  console.log("[WebSocketService] Connection opened");
                  clearTimeout(timeout);
                  resolve(websocket);
                };

                websocket.onerror = (error) => {
                  console.error("[WebSocketService] Connection error:", error);
                  clearTimeout(timeout);
                  reject(error);
                };

                websocket.onclose = (event) => {
                  console.log(
                    "[WebSocketService] Connection closed:",
                    event.code,
                  );
                  clearTimeout(timeout);
                  if (event.code !== 1000) {
                    reject(
                      new Error(
                        `Connection closed with code ${event.code}: ${event.reason}`,
                      ),
                    );
                  }
                };
              });
            });

            // Set up message handling (following llm-agent pattern)
            ws.onmessage = (event) => {
              console.log(
                `[WebSocketService:${instanceId}] Raw message received:`,
                event.data,
              );

              console.log(
                "[WebSocketService] About to call parseMessage with:",
                typeof event.data,
                Buffer.isBuffer(event.data),
              );

              // Parse message using protocol parser with proper error handling
              const parseEffect = parseMessage(event.data);
              console.log("[WebSocketService] Created parseMessage effect");

              // Use the custom message handler to directly notify stream consumers
              Effect.runPromise(parseEffect)
                .then((parsed) => {
                  console.log(
                    `[WebSocketService:${instanceId}] Parsed message successfully, type:`,
                    parsed.type,
                    "id:",
                    parsed.id,
                  );

                  // Call the message handler directly if it exists
                  if (messageCallbacks.size > 0) {
                    console.log(
                      `[WebSocketService:${instanceId}] Calling message handler for:`,
                      parsed.id,
                    );
                    notifyMessageCallbacks(parsed);
                  } else {
                    console.log(
                      `[WebSocketService:${instanceId}] No message handler available for:`,
                      parsed.id,
                    );
                  }
                })
                .catch((error) => {
                  console.error("[WebSocketService] Parse error:", error);
                  console.error(
                    "[WebSocketService] Parse error message:",
                    (error as Error).message,
                  );
                  console.error(
                    "[WebSocketService] Parse error stack:",
                    (error as Error).stack,
                  );
                  // Don't add malformed messages to the queue
                });
            };

            ws.onerror = (error) => {
              console.error("[WebSocketService] WebSocket error:", error);
            };

            ws.onclose = (event) => {
              console.log(
                "[WebSocketService] WebSocket closed:",
                event.code,
                event.reason,
              );
            };

            console.log(
              "[WebSocketService] Connection established successfully",
            );

            // Store the WebSocket in the service context for later use
            (service as any)._currentConnection = ws;
          }).pipe(
            Effect.mapError(
              (error) =>
                new WebSocketConnectionError({
                  code: "CONNECT_ERROR",
                  message: "Failed to connect to WebSocket server",
                  cause: error,
                }),
            ),
          ),

        disconnect: () =>
          Effect.gen(function* () {
            console.log("[WebSocketService] Disconnecting...");
            const currentConnection = (service as any)._currentConnection;
            if (currentConnection) {
              yield* Effect.sync(() => {
                if (currentConnection.readyState === WebSocket.OPEN) {
                  currentConnection.close();
                }
                (service as any)._currentConnection = null;
              });
            }
          }).pipe(
            Effect.mapError(
              (error) =>
                new WebSocketConnectionError({
                  code: "DISCONNECT_ERROR",
                  message: "Failed to disconnect from WebSocket server",
                  cause: error,
                }),
            ),
          ),

        cleanup: () =>
          Effect.gen(function* () {
            console.log("[WebSocketService] Cleaning up...");
            const currentConnection = (service as any)._currentConnection;
            if (currentConnection) {
              yield* Effect.sync(() => {
                if (currentConnection.readyState === WebSocket.OPEN) {
                  currentConnection.close();
                }
                (service as any)._currentConnection = null;
              });
            }
          }),

        send: (message: UserMessage | WebSocketEnvelope) =>
          Effect.gen(function* () {
            const currentConnection = (service as any)._currentConnection;
            if (
              !currentConnection ||
              currentConnection.readyState !== WebSocket.OPEN
            ) {
              return yield* Effect.fail(
                new WebSocketConnectionError({
                  code: "NOT_CONNECTED",
                  message: "Not connected to WebSocket server",
                }),
              );
            }

            try {
              const messageStr = JSON.stringify(message);
              currentConnection.send(messageStr);
              console.log("[WebSocketService] Message sent:", message);
            } catch (error) {
              return yield* Effect.fail(
                new WebSocketSendError({
                  code: "SEND_ERROR",
                  message: "Failed to send message",
                  cause: error,
                }),
              );
            }
          }),

        isConnected: Effect.sync(() => {
          const currentConnection = (service as any)._currentConnection;
          return (
            currentConnection !== null &&
            currentConnection !== undefined &&
            currentConnection.readyState === WebSocket.OPEN
          );
        }),

        messageStream: callbackMessageStream,
        receive: callbackMessageStream,
        addMessageCallback: (callback: (message: ProtocolMessage) => void) =>
          Effect.succeed(addMessageCallback(callback)),
        removeMessageCallback: (callback: (message: ProtocolMessage) => void) =>
          Effect.sync(() => {
            console.log("[WebSocketService] Removing message callback");
            messageCallbacks.delete(callback);
          }),
      } satisfies WebSocketServiceApi;

      console.log("[WebSocketService] Service construction complete");
      return service;
    }),
    dependencies: [],
  },
) {}
