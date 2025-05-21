import { Effect, Queue, Ref } from "effect";
import { WebSocketError, WebSocketMessage } from "./WebSocketService.js";
export type { WebSocketMessage } from "./WebSocketService.js";

// Mock server interface
export interface MockWebSocketServerApi {
  readonly start: (port: number) => Effect.Effect<void, WebSocketError>;
  readonly stop: () => Effect.Effect<void, WebSocketError>;
  readonly broadcast: (
    message: WebSocketMessage,
  ) => Effect.Effect<void, WebSocketError>;
  readonly onMessage: (
    handler: (message: WebSocketMessage) => Effect.Effect<void, WebSocketError>,
  ) => Effect.Effect<void, never>;
}

// Mock client connection
interface MockClientConnection {
  id: string;
  sendQueue: Queue.Queue<WebSocketMessage>;
}

/**
 * Mock WebSocket server implementation using Effect.Service pattern
 */
export class MockWebSocketServer extends Effect.Service<MockWebSocketServerApi>()(
  "MockWebSocketServer",
  {
    effect: Effect.gen(function* () {
      const clients = yield* Ref.make<Map<string, MockClientConnection>>(
        new Map(),
      );
      const messageHandlers = yield* Ref.make<
        Array<
          (message: WebSocketMessage) => Effect.Effect<void, WebSocketError>
        >
      >([]);

      return {
        start: (port: number) => Effect.succeed(void 0),

        stop: () =>
          Effect.gen(function* () {
            const currentClients = yield* Ref.get(clients);
            currentClients.clear();
            yield* Ref.set(clients, currentClients);
          }),

        broadcast: (message: WebSocketMessage) =>
          Effect.gen(function* () {
            const currentClients = yield* Ref.get(clients);
            yield* Effect.forEach(
              Array.from(currentClients.values()),
              (client) => Queue.offer(client.sendQueue, message),
              { concurrency: "unbounded" },
            );
          }),

        onMessage: (handler) =>
          Effect.gen(function* () {
            const currentHandlers = yield* Ref.get(messageHandlers);
            yield* Ref.set(messageHandlers, [...currentHandlers, handler]);
          }),
      };
    }),
    dependencies: [],
  },
) {}
