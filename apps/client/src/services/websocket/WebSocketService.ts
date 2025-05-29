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
    console.log("[WebSocketService] Initializing WebSocket service");
    const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
    const socketRef = yield* Ref.make<WebSocket | null>(null);
    const isConnectingRef = yield* Ref.make(false);

    const waitForConnection = (ws: WebSocket): Effect.Effect<void, WebSocketError> =>
      Effect.async<void, WebSocketError>((resume) => {
        console.log("[WebSocketService] Waiting for WebSocket connection...");
        
        const onOpen = () => {
          console.log("[WebSocketService] WebSocket opened successfully");
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          resume(Effect.succeed(undefined));
        };

        const onError = (event: Event) => {
          console.error("[WebSocketService] WebSocket error event:", {
            readyState: ws.readyState,
            url: ws.url,
            protocol: ws.protocol,
            type: event.type,
            target: event.target === ws ? 'WebSocket' : 'Unknown',
            timeStamp: event.timeStamp,
            error: (event as any).error || 'No error details available',
            message: (event as any).message || 'No message available',
            code: (event as any).code || 'No code available'
          });
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          resume(Effect.fail(new WebSocketError("Connection failed", "CONNECT_ERROR")));
        };

        ws.addEventListener("open", onOpen);
        ws.addEventListener("error", onError);
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

        const currentSocket = yield* Ref.get(socketRef);
        if (currentSocket?.readyState === WebSocket.OPEN) {
          console.log("[WebSocketService] Already connected");
          return;
        }

        const isConnecting = yield* Ref.get(isConnectingRef);
        if (isConnecting) {
          console.log("[WebSocketService] Connection attempt already in progress, waiting...");
          yield* Effect.sleep("1 second");
          const socket = yield* Ref.get(socketRef);
          if (socket?.readyState === WebSocket.OPEN) {
            return;
          }
          throw new WebSocketError("Previous connection attempt failed", "CONNECT_ERROR");
        }

        yield* Ref.set(isConnectingRef, true);

        try {
          console.log("[WebSocketService] Creating new WebSocket instance for URL:", url);
          const socket = new WebSocket(url);
          
          console.log("[WebSocketService] WebSocket created, initial state:", socket.readyState);

          socket.onclose = (event) => {
            console.log("[WebSocketService] WebSocket closed:", {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            });
            Effect.runSync(Ref.set(socketRef, null));
            Effect.runSync(Ref.set(isConnectingRef, false));
          };

          socket.onerror = (event) => {
            console.error("[WebSocketService] WebSocket error event:", {
              readyState: socket.readyState,
              url: socket.url,
              protocol: socket.protocol,
              type: event.type,
              target: event.target === socket ? 'WebSocket' : 'Unknown',
              timeStamp: event.timeStamp,
              error: (event as any).error || 'No error details available',
              message: (event as any).message || 'No message available',
              code: (event as any).code || 'No code available'
            });
          };

          console.log("[WebSocketService] Waiting for connection to establish...");
          yield* waitForConnection(socket);
          console.log("[WebSocketService] Connection established successfully");
          
          yield* Ref.set(socketRef, socket);
          yield* Ref.set(isConnectingRef, false);

          socket.onmessage = (event) => {
            console.log("[WebSocketService] Received message:", event.data);
            try {
              let text: string;
              if (typeof event.data === "string") {
                text = event.data;
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

              const { message, validation } = parseWebSocketMessage(envelope);

              if (!validation.isValid) {
                console.error("[WebSocketService] Invalid message received:", validation.errors);
                return;
              }

              if (message) {
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
        }
      });

    const send = (message: UserMessage): Effect.Effect<void, WebSocketError> =>
      Effect.gen(function* () {
        console.log("[WebSocketService] Attempting to send message:", message);
        const socket = yield* Ref.get(socketRef);
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          console.error("[WebSocketService] Cannot send - WebSocket not connected");
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
          socket.send(envelope.text);
          console.log("[WebSocketService] Message sent:", envelope);
        } catch (error) {
          console.error("[WebSocketService] Send error:", error);
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
      console.log("[WebSocketService] Creating new instance");
      const service = yield* createWebSocketServiceImpl();
      return service;
    }),
    dependencies: [],
  }
) {}
