// import { parseMessage } from "@buddy/protocol";
import { Effect, Queue, Ref, Stream } from "effect";
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

// Simplified protocol format matching the server
interface SimpleMessage {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

// Helper functions for simplified protocol
const createMessage = (type: string, content: string): SimpleMessage => ({
  id: Math.random().toString(36).substring(7),
  type,
  content,
  timestamp: Date.now(),
});

const parseMessage = (data: string): SimpleMessage | null => {
  try {
    const parsed = JSON.parse(data);
    if (
      parsed &&
      typeof parsed.type === "string" &&
      typeof parsed.content === "string"
    ) {
      return parsed as SimpleMessage;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * WebSocket service class implementing the Effect.Service pattern
 * Using simplified protocol matching the server
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const instanceId = Math.random().toString(36).substring(7);
      console.log(
        "[WebSocketService] Service construction started, instanceId:",
        instanceId,
      );

      // Create message queue and stream
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const messageStream = Stream.fromQueue(messageQueue);

      console.log(
        `[WebSocketService:${instanceId}] Created messageQueue and messageStream`,
      );

      // Create connection ref
      const connectionRef = yield* Ref.make<WebSocket | null>(null);

      // Create service implementation
      const service = {
        _tag: "WebSocketService" as const,
        instanceId,

        connect: (url: string) =>
          Effect.gen(function* () {
            console.log("[WebSocketService] Connecting to:", url);

            // Use Effect.promise directly
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
                  console.error(
                    "[WebSocketService] Connection error:",
                    error?.type || error,
                  );
                  clearTimeout(timeout);
                  reject(new Error("WebSocket connection error"));
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

            // Set up message handling
            const handleMessage = (event: MessageEvent) => {
              console.log(
                `[WebSocketService:${instanceId}] Raw message received:`,
                event.data,
              );

              const parsed = parseMessage(event.data);
              if (parsed) {
                console.log(
                  `[WebSocketService:${instanceId}] Parsed message successfully, type:`,
                  parsed.type,
                );

                // Convert to protocol message format
                const protocolMessage: ProtocolMessage = {
                  id: parsed.id,
                  type: "RESPONSE" as any,
                  agentRuntimeId: "simplified-agent",
                  timestamp: parsed.timestamp,
                  sequence: 0,
                  payload: {
                    type: parsed.type,
                    content: parsed.content,
                  },
                  metadata: {
                    __tag: "Metadata" as const,
                  },
                  __tag: "WebSocketMessage" as const,
                };

                // Offer to queue
                Effect.runFork(
                  Effect.gen(function* () {
                    yield* Queue.offer(messageQueue, protocolMessage);
                    console.log(
                      `[WebSocketService:${instanceId}] ✅ Message offered to queue:`,
                      parsed.type,
                    );
                  }),
                );
              }
            };

            ws.onmessage = handleMessage;
            yield* Ref.set(connectionRef, ws);
            console.log(
              "[WebSocketService] Connection established successfully",
            );
          }),

        disconnect: () =>
          Effect.gen(function* () {
            const currentConnection = yield* Ref.get(connectionRef);
            if (currentConnection) {
              yield* Effect.sync(() => {
                if (currentConnection.readyState === WebSocket.OPEN) {
                  currentConnection.close();
                }
              });
              yield* Ref.set(connectionRef, null);
            }
          }),

        cleanup: () =>
          Effect.gen(function* () {
            const currentConnection = yield* Ref.get(connectionRef);
            if (currentConnection) {
              yield* Effect.sync(() => {
                if (currentConnection.readyState === WebSocket.OPEN) {
                  currentConnection.close();
                }
              });
              yield* Ref.set(connectionRef, null);
            }
          }),

        send: (message: UserMessage | WebSocketEnvelope) =>
          Effect.gen(function* () {
            const currentConnection = yield* Ref.get(connectionRef);
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

            const simpleMessage =
              "text" in message
                ? createMessage("USER_MESSAGE", message.text)
                : createMessage("USER_MESSAGE", JSON.stringify(message));

            const messageStr = JSON.stringify(simpleMessage);
            currentConnection.send(messageStr);
            console.log(
              "[WebSocketService] Message sent successfully:",
              messageStr,
            );
          }),

        isConnected: Effect.gen(function* () {
          const currentConnection = yield* Ref.get(connectionRef);
          return (
            currentConnection !== null &&
            currentConnection.readyState === WebSocket.OPEN
          );
        }),

        messageStream,
        receive: messageStream,
      } satisfies WebSocketServiceApi;

      console.log(
        "[WebSocketService] Service construction complete, instanceId:",
        instanceId,
      );
      return service;
    }),
    dependencies: [],
  },
) {}
