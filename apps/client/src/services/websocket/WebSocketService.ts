import {
  ERROR_CODES,
  type ProtocolMessage,
  type UserMessage,
  type WebSocketEnvelope,
  createWebSocketEnvelope,
  parseWebSocketMessage,
  validateUserInput
} from "@buddy/protocol";
import { Effect, Queue, Ref, Stream } from "effect";

export class WebSocketError extends Error {
  code: string;
  constructor(message: string, code = "GENERIC") {
    super(message);
    this.name = "WebSocketError";
    this.code = code;
  }
}

// WebSocket service interface
export interface WebSocketServiceApi {
  readonly _tag: "WebSocketService";
  connect(url: string): Effect.Effect<void, WebSocketError>;
  disconnect(): Effect.Effect<void, WebSocketError>;
  send(message: UserMessage): Effect.Effect<void, WebSocketError>;
  receive(): Stream.Stream<ProtocolMessage, WebSocketError, never>;
}

// Create the service implementation
const createWebSocketServiceImpl = (): Effect.Effect<WebSocketServiceApi, never, never> =>
  Effect.gen(function* () {

    const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
    const socketRef = yield* Ref.make<WebSocket | null>(null);
    const isConnectingRef = yield* Ref.make(false);
    const isConnectedRef = yield* Ref.make(false);

    const waitForConnection = (ws: WebSocket): Effect.Effect<void, WebSocketError> =>
      Effect.async<void, WebSocketError>((resume) => {
        console.log("[WebSocketService] Waiting for WebSocket connection...");
        
        const onOpen = () => {
          console.log("[WebSocketService] WebSocket opened successfully");
          Effect.runSync(Ref.set(isConnectedRef, true));
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
            target: event.target === ws ? 'WebSocket' : 'Unknown',
            timeStamp: event.timeStamp
          });
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          ws.removeEventListener("close", onClose);
          resume(Effect.fail(new WebSocketError("Connection failed", "CONNECT_ERROR")));
        };

        const onClose = (event: CloseEvent) => {
          console.log("[WebSocketService] WebSocket closed:", event);
          Effect.runSync(Ref.set(isConnectedRef, false));
          Effect.runSync(Queue.shutdown(messageQueue));
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          ws.removeEventListener("close", onClose);
          resume(Effect.fail(new WebSocketError("Connection closed", "CONNECT_ERROR")));
        };

        ws.addEventListener("open", onOpen);
        ws.addEventListener("error", onError);
        ws.addEventListener("close", onClose);
      }).pipe(
        Effect.timeout("10 seconds"),
        Effect.mapError((error) => {
          if (error && typeof error === 'object' && '_tag' in error && error._tag === "TimeoutException") {
            console.error("[WebSocketService] Connection timeout after 10 seconds");
            return new WebSocketError("Connection timeout", "TIMEOUT");
          }
          return error instanceof WebSocketError ? error : new WebSocketError("Connection failed during timeout mapping", "CONNECT_ERROR");
        })
      );

    const connect = (url: string): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Attempting to connect to:", url);

        // First set connecting state atomically
        const wasConnecting = yield* Ref.modify(isConnectingRef, current => [current, true]);
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
          console.log("[WebSocketService] Creating new WebSocket connection...");
          const ws = new WebSocket(url);
          yield* Ref.set(socketRef, ws);

          // Wait for connection with timeout and ensure cleanup
          yield* waitForConnection(ws).pipe(
            Effect.tapError(() => Effect.sync(() => {
              console.log("[WebSocketService] Connection failed, cleaning up...");
              ws.close();
              return Ref.set(socketRef, null);
            })),
            Effect.ensuring(Ref.set(isConnectingRef, false))
          );
          
          console.log("[WebSocketService] Connection established successfully");
          yield* Ref.set(isConnectedRef, true);

          // Set up message handlers with proper error handling
          ws.onclose = (event) => {
            console.log("[WebSocketService] WebSocket closed:", {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            });
            Effect.runSync(Ref.set(socketRef, null));
            Effect.runSync(Ref.set(isConnectingRef, false));
            Effect.runSync(Ref.set(isConnectedRef, false));
          };

          ws.onerror = (event) => {
            console.error("[WebSocketService] WebSocket error event:", {
              readyState: ws.readyState,
              url: ws.url,
              protocol: ws.protocol,
              type: event.type,
              target: event.target === ws ? 'WebSocket' : 'Unknown',
              timeStamp: event.timeStamp
            });
            Effect.runSync(Ref.set(isConnectedRef, false));
          };

          ws.onmessage = (event) => {
            console.log("[WebSocketService] Received WebSocket message:", event);
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
                console.error("[WebSocketService] Unsupported WebSocket data format", event.data);
                return;
              }

              const envelope: WebSocketEnvelope = {
                text,
                timestamp: new Date().toISOString()
              };

              console.log("[WebSocketService] Processing message envelope:", envelope);

              const { message, validation } = parseWebSocketMessage(envelope);

              if (!validation.isValid) {
                console.error("[WebSocketService] Invalid message received:", validation.errors);
                return;
              }

              if (message) {
                console.log("[WebSocketService] Offering valid message to queue:", {
                  type: message.type,
                  timestamp: message.timestamp
                });
                Effect.runSync(Queue.offer(messageQueue, message));
              }
            } catch (e) {
              console.error("[WebSocketService] Error handling WebSocket message:", e);
            }
          };

        } catch (error) {
          console.error("[WebSocketService] Connection error:", error);
          yield* Ref.set(isConnectingRef, false);
          throw new WebSocketError(`Failed to connect: ${error}`, "CONNECT_ERROR");
        }
      }).pipe(
        Effect.tapError(error => Effect.sync(() => {
          console.error("[WebSocketService] Connection failed:", error);
          Effect.runSync(Ref.set(isConnectingRef, false));
        }))
      );

    const disconnect = (): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Disconnecting WebSocket");
        const socket = yield* Ref.get(socketRef);
        if (socket) {
          socket.close();
          yield* Ref.set(socketRef, null);
          yield* Ref.set(isConnectedRef, false);
        }
      });

    const send = (message: UserMessage): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Attempting to send message:", {
          message,
          metadata: message.metadata,
          timestamp: new Date().toISOString()
        });

        const socket = yield* Ref.get(socketRef);
        const isConnected = yield* Ref.get(isConnectedRef);
        
        console.log("[WebSocketService] Current connection state:", {
          hasSocket: !!socket,
          socketState: socket?.readyState,
          isConnected
        });
        
        if (!socket || !isConnected) {
          console.error("[WebSocketService] Cannot send - WebSocket not connected", {
            hasSocket: !!socket,
            isConnected,
            readyState: socket?.readyState
          });
          throw new WebSocketError("WebSocket not connected", ERROR_CODES.CONNECTION_LOST);
        }
        try {
          const validation = validateUserInput(message.text);
          if (!validation.isValid) {
            throw new WebSocketError(
              `Invalid message: ${validation.errors.join(', ')}`,
              ERROR_CODES.INVALID_MESSAGE
            );
          }

          const envelope = createWebSocketEnvelope(message);
          console.log("[WebSocketService] Sending envelope:", {
            envelope,
            socketUrl: socket.url,
            readyState: socket.readyState
          });
          
          socket.send(envelope.text);
          console.log("[WebSocketService] Message sent successfully");
        } catch (error) {
          console.error("[WebSocketService] Send error:", error);
          yield* Ref.set(isConnectedRef, false);
          throw new WebSocketError(
            error instanceof Error ? error.message : "Failed to send message",
            ERROR_CODES.INTERNAL_ERROR
          );
        }
      });

    const receive = (): Stream.Stream<ProtocolMessage, WebSocketError, never> => {
      console.log("[WebSocketService] Setting up message stream");
      return Stream.fromQueue(messageQueue).pipe(
        Stream.mapError(
          (error): WebSocketError => {
            console.error("[WebSocketService] Stream error:", error);
            return new WebSocketError(
              (error as any)?.message ?? "Failed to receive message",
              ERROR_CODES.INTERNAL_ERROR
            );
          },
        ),
      );
    };

    return {
      _tag: "WebSocketService",
      connect,
      disconnect,
      send,
      receive,
    };
  });

/**
 * WebSocket service class implementing the Effect.Service pattern
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
  
      const service = yield* createWebSocketServiceImpl();
      return service;
    }),
    dependencies: [],
  }
) {}
