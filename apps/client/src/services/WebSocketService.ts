import { Effect, Queue, Stream, Layer } from "effect";
import { WebSocket } from "ws";

// Message types for WebSocket communication
export interface WebSocketMessage {
    text: string;
    timestamp: string;
    error?: {
        code: string;
        message: string;
    };
}

export interface WebSocketError {
    code: string;
    message: string;
}

export class WebSocketError extends Error implements WebSocketError {
    code: string;
    constructor(message: string, code: string = "GENERIC") {
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
    send(message: WebSocketMessage): Effect.Effect<void, WebSocketError>;
    receive(): Stream.Stream<WebSocketMessage, WebSocketError, never>;
}

/**
 * WebSocket service class implementing the Effect.Service pattern
 */
export class WebSocketService extends Effect.Tag("WebSocketService")<WebSocketService, WebSocketServiceApi>() {}

/**
 * Create a WebSocket service instance
 */
export const makeWebSocketService = Effect.gen(function* (_) {
    const messageQueue = yield* Queue.unbounded<WebSocketMessage>();
    let socket: WebSocket | null = null;

    const connect = (url: string): Effect.Effect<void, WebSocketError> =>
        Effect.try({
            try: () => {
                if (socket) {
                    throw new Error("WebSocket already connected");
                }
                try {
                    socket = new WebSocket(url);
                    socket.onmessage = (event) => {
                        try {
                            // Handle different types of WebSocket data formats
                            let text: string;
                            if (typeof event.data === 'string') {
                                text = event.data;
                            } else if (event.data instanceof ArrayBuffer) {
                                text = new TextDecoder().decode(event.data);
                            } else if (event.data instanceof Blob) {
                                // Handle Blob data (need to read it asynchronously)
                                // For now, we'll just log it and skip
                                console.log("Received blob data, not handling yet");
                                return;
                            } else {
                                // Unknown data format
                                console.error("Unknown WebSocket data format", event.data);
                                return;
                            }
                            const data = JSON.parse(text);
                            if (messageQueue) {
                                Effect.runSync(Queue.offer(messageQueue, data));
                            }
                        } catch (e) {
                            console.error("Error parsing WebSocket message:", e);
                        }
                    };
                } catch (error) {
                    throw new WebSocketError(
                        typeof error === 'object' && error !== null && 'message' in error 
                            ? String(error.message) 
                            : "Failed to connect",
                        "CONNECT_ERROR"
                    );
                }
            },
            catch: (error) => new WebSocketError(
                typeof error === 'object' && error !== null && 'message' in error 
                    ? String(error.message) 
                    : "Failed to connect",
                "CONNECT_ERROR"
            )
        });

    const disconnect = (): Effect.Effect<void, WebSocketError> =>
        Effect.try({
            try: () => {
                if (!socket) {
                    throw new Error("WebSocket not connected");
                }
                socket.close();
                socket = null;
            },
            catch: (error) => new WebSocketError(
                error instanceof Error ? error.message : "Failed to disconnect",
                "DISCONNECT_ERROR"
            )
        });

    const send = (message: WebSocketMessage): Effect.Effect<void, WebSocketError> =>
        Effect.try({
            try: () => {
                if (!socket) {
                    throw new Error("WebSocket not connected");
                }
                socket.send(JSON.stringify(message));
            },
            catch: (error) => new WebSocketError(
                error instanceof Error ? error.message : "Failed to send message",
                "SEND_ERROR"
            )
        });

    const receive = (): Stream.Stream<WebSocketMessage, WebSocketError, never> =>
        Stream.fromQueue(messageQueue).pipe(
            Stream.mapError((error: unknown): WebSocketError => new WebSocketError(
                typeof error === 'object' && error !== null && 'message' in error 
                    ? String((error as any).message) 
                    : "Failed to receive message",
                "RECEIVE_ERROR"
            ))
        );

    const service: WebSocketServiceApi = {
        _tag: "WebSocketService",
        connect,
        disconnect,
        send,
        receive
    };
    return service;
});

/**
 * Layer providing the WebSocketService implementation
 */
export const WebSocketServiceLive = Layer.effect(
    WebSocketService,
    makeWebSocketService
);
