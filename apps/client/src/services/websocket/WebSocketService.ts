import {
  ERROR_CODES,
  type WebSocketMessage,
  parseMessage,
} from "@buddy/protocol";

// Type aliases for compatibility
type ProtocolMessage = WebSocketMessage;
type UserMessage = {
  text: string;
  attachments?: Array<{ name: string }>;
};
type WebSocketEnvelope = WebSocketMessage;

// Simple validation function since validateUserInput is not available in protocol
const validateUserInput = (text: string) => ({
  isValid: true,
  errors: [] as string[],
  sanitized: text,
});

// Helper to extract chatId from URL parameters
const extractChatIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("chatId");
  } catch {
    return null;
  }
};

// Helper functions since they're not available in protocol
let currentChatId = "default"; // Store chatId from connection URL

const createWebSocketEnvelope = (message: UserMessage): WebSocketEnvelope => {
  // For now, create a simple USER_MESSAGE format that the test server expects
  // TODO: Switch to full protocol message format when using the main LLM agent
  return {
    type: "USER_MESSAGE",
    text: message.text,
    metadata: {
      chatId: currentChatId,
    },
  } as any; // Cast to WebSocketEnvelope for compatibility
};

const parseWebSocketMessage = parseMessage;
import { Effect, Ref, Stream } from "effect";

export class WebSocketError extends Error {
  code: string;
  constructor(message: string, code = "GENERIC") {
    super(message);
    this.name = "WebSocketError";
    this.code = code;
  }
}

// Simple pub/sub pattern for message broadcasting
type MessageCallback = (message: ProtocolMessage) => void;

// WebSocket service interface
export interface WebSocketServiceApi {
  readonly _tag: "WebSocketService";
  connect(url: string): Effect.Effect<void, WebSocketError>;
  disconnect(): Effect.Effect<void, WebSocketError>;
  cleanup(): Effect.Effect<void, never>;
  send(
    message: UserMessage | WebSocketEnvelope,
  ): Effect.Effect<void, WebSocketError>;
  readonly receive: Stream.Stream<ProtocolMessage, WebSocketError, never>;
  readonly isConnected: boolean;
  readonly messageStream: Stream.Stream<ProtocolMessage, WebSocketError, never>;
}

// Create the service implementation
export const createWebSocketServiceImpl = (): Effect.Effect<
  WebSocketServiceApi,
  never,
  never
> =>
  Effect.gen(function* () {
    const instanceId = Math.random().toString(36).substr(2, 9);
    console.log(
      "[WebSocketService] Creating new service instance:",
      instanceId,
    );

    // Use a simple callback-based pub/sub pattern instead of Hub/Queue
    const subscribers = new Set<MessageCallback>();
    const socketRef = yield* Ref.make<WebSocket | null>(null);
    const isConnectingRef = yield* Ref.make(false);
    const isConnectedRef = yield* Ref.make(false);

    // Create a state object to hold sync values
    const state = { isConnected: false };

    // Function to broadcast messages to all subscribers
    const broadcastMessage = (message: ProtocolMessage) => {
      console.log(
        `[WebSocketService] Broadcasting message to ${subscribers.size} subscribers (instance ${instanceId}):`,
        {
          messageId: message.id,
          messageType: message.type,
          timestamp: message.timestamp,
        },
      );
      for (const callback of subscribers) {
        try {
          callback(message);
        } catch (error) {
          console.error(
            `[WebSocketService] Error in subscriber callback (instance ${instanceId}):`,
            error,
          );
        }
      }
    };

    const waitForConnection = (
      ws: WebSocket,
    ): Effect.Effect<void, WebSocketError> =>
      Effect.async<void, WebSocketError>((resume) => {
        console.log("[WebSocketService] Waiting for WebSocket connection...");

        const onOpen = () => {
          console.log("[WebSocketService] WebSocket opened successfully");
          Effect.runSync(Ref.set(isConnectedRef, true));
          state.isConnected = true;
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          ws.removeEventListener("close", onClose);
          resume(Effect.succeed(undefined));
        };

        const onError = (event: Event) => {
          console.error("[WebSocketService] WebSocket error event:", {
            readyState: ws.readyState,
            url: ws.url,
            protocol: ws.protocol,
            type: event.type,
            target: event.target === ws ? "WebSocket" : "Unknown",
            timeStamp: event.timeStamp,
          });
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          ws.removeEventListener("close", onClose);
          resume(
            Effect.fail(
              new WebSocketError("Connection failed", "CONNECT_ERROR"),
            ),
          );
        };

        const onClose = (event: CloseEvent) => {
          console.log("[WebSocketService] WebSocket closed:", event);
          Effect.runSync(Ref.set(isConnectedRef, false));
          state.isConnected = false;
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          ws.removeEventListener("close", onClose);
          resume(
            Effect.fail(
              new WebSocketError("Connection closed", "CONNECT_ERROR"),
            ),
          );
        };

        ws.addEventListener("open", onOpen);
        ws.addEventListener("error", onError);
        ws.addEventListener("close", onClose);
      }).pipe(
        Effect.timeout("10 seconds"),
        Effect.mapError((error) => {
          if (
            error &&
            typeof error === "object" &&
            "_tag" in error &&
            error._tag === "TimeoutException"
          ) {
            console.error(
              "[WebSocketService] Connection timeout after 10 seconds",
            );
            return new WebSocketError("Connection timeout", "TIMEOUT");
          }
          return error instanceof WebSocketError
            ? error
            : new WebSocketError(
                "Connection failed during timeout mapping",
                "CONNECT_ERROR",
              );
        }),
      );

    const connect = (url: string): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        // Check if we're in a browser environment
        if (typeof window === "undefined" || typeof WebSocket === "undefined") {
          console.error(
            "[WebSocketService] WebSocket not available in this environment",
          );
          return yield* Effect.fail(
            new WebSocketError(
              "WebSocket not available in server environment",
              "ENVIRONMENT_ERROR",
            ),
          );
        }

        console.log("[WebSocketService] Attempting to connect to:", url);

        // Extract chatId from URL
        const chatId = extractChatIdFromUrl(url);
        if (chatId) {
          currentChatId = chatId;
          console.log("[WebSocketService] Extracted chatId:", chatId);
        }

        // First set connecting state atomically
        const wasConnecting = yield* Ref.modify(isConnectingRef, (current) => [
          current,
          true,
        ]);
        if (wasConnecting) {
          console.log("[WebSocketService] Connection already in progress");
          return;
        }

        try {
          const currentSocket = yield* Ref.get(socketRef);

          // Check if we already have a valid connection
          if (currentSocket?.readyState === WebSocket.OPEN) {
            console.log("[WebSocketService] Already connected");
            yield* Ref.set(isConnectingRef, false);
            return;
          }

          // Clean up any existing socket
          if (currentSocket) {
            console.log("[WebSocketService] Cleaning up existing socket");
            currentSocket.close();
            yield* Ref.set(socketRef, null);
          }

          // Create new WebSocket
          console.log(
            "[WebSocketService] Creating new WebSocket connection...",
          );
          const ws = new WebSocket(url);
          yield* Ref.set(socketRef, ws);

          // Wait for connection with timeout and ensure cleanup
          yield* waitForConnection(ws).pipe(
            Effect.tapError(() =>
              Effect.sync(() => {
                console.log(
                  "[WebSocketService] Connection failed, cleaning up...",
                );
                ws.close();
                return Ref.set(socketRef, null);
              }),
            ),
            Effect.ensuring(Ref.set(isConnectingRef, false)),
          );

          console.log("[WebSocketService] Connection established successfully");
          yield* Ref.set(isConnectedRef, true);
          state.isConnected = true;

          // Give a small delay to ensure connection is stable
          yield* Effect.sleep("100 millis");

          // Set up message handlers with proper error handling
          ws.onclose = (event) => {
            console.log("[WebSocketService] WebSocket closed:", {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
            Effect.runSync(Ref.set(socketRef, null));
            Effect.runSync(Ref.set(isConnectingRef, false));
            Effect.runSync(Ref.set(isConnectedRef, false));
            state.isConnected = false;
          };

          ws.onerror = (event) => {
            console.error("[WebSocketService] WebSocket error event:", {
              readyState: ws.readyState,
              url: ws.url,
              protocol: ws.protocol,
              type: event.type,
              target: event.target === ws ? "WebSocket" : "Unknown",
              timeStamp: event.timeStamp,
            });
            Effect.runSync(Ref.set(isConnectedRef, false));
            state.isConnected = false;
          };

          ws.onmessage = (event) => {
            console.log(
              `[WebSocketService] Received WebSocket message (instance ${instanceId}):`,
              event,
            );
            try {
              let text: string;
              if (typeof event.data === "string") {
                text = event.data;
              } else if (event.data instanceof Blob) {
                // Note: This is async but we're in a sync context
                // For now we'll handle only string data
                console.error("[WebSocketService] Blob data not supported yet");
                return;
              } else if (event.data instanceof ArrayBuffer) {
                text = new TextDecoder().decode(event.data);
              } else {
                console.error(
                  "[WebSocketService] Unsupported WebSocket data format",
                  event.data,
                );
                return;
              }

              console.log(
                `[WebSocketService] Processing message text (instance ${instanceId}):`,
                text,
              );

              // Try to parse the message - for now just log it
              // TODO: Properly integrate with parseMessage when Effect versions are aligned
              try {
                const parsed = JSON.parse(text);
                console.log(
                  `[WebSocketService] Parsed message (instance ${instanceId}):`,
                  parsed,
                );

                // Create a basic protocol message for testing
                const protocolMessage: ProtocolMessage = {
                  id: parsed.id || crypto.randomUUID(),
                  type: parsed.type || "SYSTEM",
                  agentRuntimeId: parsed.agentRuntimeId || "test-server",
                  timestamp: parsed.timestamp || Date.now(),
                  sequence: parsed.sequence || 0,
                  payload: parsed,
                  metadata: {
                    processed: false,
                    __tag: "Metadata",
                  },
                  __tag: "WebSocketMessage",
                };

                console.log(
                  `[WebSocketService] Offering message to queue (instance ${instanceId}):`,
                  {
                    type: protocolMessage.type,
                    timestamp: protocolMessage.timestamp,
                  },
                );

                // Broadcast message to all subscribers
                broadcastMessage(protocolMessage);
                console.log(
                  `[WebSocketService] Message successfully published (instance ${instanceId})`,
                );
              } catch (parseError) {
                console.error(
                  `[WebSocketService] Failed to parse message (instance ${instanceId}):`,
                  parseError,
                );
              }
            } catch (e) {
              console.error(
                `[WebSocketService] Error handling WebSocket message (instance ${instanceId}):`,
                e,
              );
            }
          };
        } catch (error) {
          console.error("[WebSocketService] Connection error:", error);
          yield* Ref.set(isConnectingRef, false);
          throw new WebSocketError(
            `Failed to connect: ${error}`,
            "CONNECT_ERROR",
          );
        }
      }).pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            console.error("[WebSocketService] Connection failed:", error);
            Effect.runSync(Ref.set(isConnectingRef, false));
          }),
        ),
      );

    const disconnect = (): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Disconnecting WebSocket");
        const socket = yield* Ref.get(socketRef);
        if (socket) {
          socket.close();
          yield* Ref.set(socketRef, null);
          yield* Ref.set(isConnectedRef, false);
          state.isConnected = false;
        }
        return; // Explicitly return void
      });

    const cleanup = (): Effect.Effect<void, never> =>
      Effect.gen(function* () {
        console.log(
          "[WebSocketService] Cleaning up resources for instance:",
          instanceId,
        );
        const socket = yield* Ref.get(socketRef);
        if (socket) {
          socket.close();
          yield* Ref.set(socketRef, null);
        }
        yield* Ref.set(isConnectedRef, false);
        yield* Ref.set(isConnectingRef, false);
        state.isConnected = false;
        console.log("[WebSocketService] Resources cleaned up");
      });

    const send = (
      message: UserMessage | WebSocketEnvelope,
    ): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Attempting to send message:", {
          message,
          timestamp: new Date().toISOString(),
        });

        const socket = yield* Ref.get(socketRef);
        const isConnected = yield* Ref.get(isConnectedRef);

        console.log("[WebSocketService] Current connection state:", {
          hasSocket: !!socket,
          socketState: socket?.readyState,
          isConnected,
          socketReadyStateConstants: {
            CONNECTING: WebSocket.CONNECTING,
            OPEN: WebSocket.OPEN,
            CLOSING: WebSocket.CLOSING,
            CLOSED: WebSocket.CLOSED,
          },
        });

        // Check if socket exists and is actually open
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          console.error(
            "[WebSocketService] Cannot send - WebSocket not connected",
            {
              hasSocket: !!socket,
              isConnected,
              readyState: socket?.readyState,
              readyStateText: socket
                ? socket.readyState === WebSocket.CONNECTING
                  ? "CONNECTING"
                  : socket.readyState === WebSocket.OPEN
                    ? "OPEN"
                    : socket.readyState === WebSocket.CLOSING
                      ? "CLOSING"
                      : socket.readyState === WebSocket.CLOSED
                        ? "CLOSED"
                        : "UNKNOWN"
                : "NO_SOCKET",
            },
          );
          yield* Effect.fail(
            new WebSocketError(
              `WebSocket not connected (state: ${
                socket
                  ? socket.readyState === WebSocket.CONNECTING
                    ? "CONNECTING"
                    : socket.readyState === WebSocket.OPEN
                      ? "OPEN"
                      : socket.readyState === WebSocket.CLOSING
                        ? "CLOSING"
                        : socket.readyState === WebSocket.CLOSED
                          ? "CLOSED"
                          : "UNKNOWN"
                  : "NO_SOCKET"
              })`,
              ERROR_CODES.CONNECTION_LOST,
            ),
          );
        }
        try {
          let envelope: WebSocketEnvelope;
          if ("text" in message) {
            // It's a UserMessage
            const validation = validateUserInput(message.text);
            if (!validation.isValid) {
              yield* Effect.fail(
                new WebSocketError(
                  `Invalid message: ${validation.errors.join(", ")}`,
                  ERROR_CODES.INVALID_MESSAGE,
                ),
              );
            }
            envelope = createWebSocketEnvelope(message);
          } else {
            // It's already an envelope
            envelope = message;
          }
          console.log("[WebSocketService] Sending envelope:", {
            envelope,
            socketUrl: socket.url,
            readyState: socket.readyState,
          });

          socket.send(JSON.stringify(envelope));
          console.log("[WebSocketService] Message sent successfully");
          return; // Explicitly return void
        } catch (error) {
          console.error("[WebSocketService] Send error:", error);
          yield* Ref.set(isConnectedRef, false);
          state.isConnected = false;
          yield* Effect.fail(
            new WebSocketError(
              error instanceof Error ? error.message : "Failed to send message",
              ERROR_CODES.INTERNAL_ERROR,
            ),
          );
        }
      });

    return {
      _tag: "WebSocketService",
      connect,
      disconnect,
      cleanup,
      send,
      get receive() {
        // Return a NEW stream instance each time, not the shared one
        console.log(
          `[WebSocketService] Creating NEW receive stream instance (instance ${instanceId})`,
        );
        return Stream.asyncScoped<ProtocolMessage, WebSocketError>((emit) =>
          Effect.gen(function* () {
            console.log(
              `[WebSocketService] Creating NEW subscriber for receive stream (instance ${instanceId}), total subscribers: ${subscribers.size + 1}`,
            );

            // Create a callback function for this specific subscriber
            const callback: MessageCallback = (message) => {
              console.log(
                `[WebSocketService] *** RECEIVE STREAM CALLBACK - Message received (instance ${instanceId}) ***:`,
                {
                  messageId: message.id,
                  messageType: message.type,
                  timestamp: message.timestamp,
                },
              );
              emit.single(message);
            };

            // Add the callback to subscribers
            subscribers.add(callback);

            // Return cleanup that will be called when stream is explicitly closed
            return Effect.sync(() => {
              console.log(
                `[WebSocketService] Removing receive stream subscriber (instance ${instanceId}), remaining: ${subscribers.size - 1}`,
              );
              subscribers.delete(callback);
            });
          }),
        ).pipe(
          Stream.mapError((error): WebSocketError => {
            console.error("[WebSocketService] Receive stream error:", error);
            return new WebSocketError(
              (error as any)?.message ?? "Failed to receive message",
              ERROR_CODES.INTERNAL_ERROR,
            );
          }),
        );
      },
      get isConnected() {
        // Return synchronous state to avoid Effect.runSync during initialization
        return state.isConnected;
      },
      get messageStream() {
        // Return a NEW stream instance each time, not the shared one
        console.log(
          `[WebSocketService] Creating NEW messageStream instance (instance ${instanceId})`,
        );
        return Stream.asyncScoped<ProtocolMessage, WebSocketError>((emit) =>
          Effect.gen(function* () {
            console.log(
              `[WebSocketService] Creating NEW subscriber for messageStream (instance ${instanceId}), total subscribers: ${subscribers.size + 1}`,
            );

            // Create a callback function for this specific subscriber
            const callback: MessageCallback = (message) => {
              console.log(
                `[WebSocketService] *** MESSAGESTREAM CALLBACK - Message received (instance ${instanceId}) ***:`,
                {
                  messageId: message.id,
                  messageType: message.type,
                  timestamp: message.timestamp,
                },
              );
              emit.single(message);
            };

            // Add the callback to subscribers
            subscribers.add(callback);

            // Return cleanup that will be called when stream is explicitly closed
            return Effect.sync(() => {
              console.log(
                `[WebSocketService] Removing messageStream subscriber (instance ${instanceId}), remaining: ${subscribers.size - 1}`,
              );
              subscribers.delete(callback);
            });
          }),
        ).pipe(
          Stream.mapError((error): WebSocketError => {
            console.error("[WebSocketService] MessageStream error:", error);
            return new WebSocketError(
              (error as any)?.message ?? "Failed to receive message",
              ERROR_CODES.INTERNAL_ERROR,
            );
          }),
        );
      },
    };
  });

/**
 * WebSocket service class implementing the Effect.Service pattern
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    effect: Effect.gen(function* () {
      const service = yield* createWebSocketServiceImpl();
      return service;
    }),
    dependencies: [],
  },
) {}
