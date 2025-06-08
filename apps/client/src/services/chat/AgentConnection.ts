import type { JsonObject } from "@/types";
import { Chunk, Data, Effect, Option, Ref, Stream } from "effect";

// Errors
export class WebSocketConnectionError extends Data.TaggedError(
  "WebSocketConnectionError",
)<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

export class WebSocketSendError extends Data.TaggedError("WebSocketSendError")<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

export class WebSocketMessageError extends Data.TaggedError(
  "WebSocketMessageError",
)<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

// API Definition
export interface AgentConnectionApi {
  readonly connect: (
    url: string,
  ) => Effect.Effect<WebSocket, WebSocketConnectionError, never>;
  readonly sendMessage: (
    message: unknown,
  ) => Effect.Effect<void, WebSocketSendError, never>;
  readonly receiveMessages: () => Stream.Stream<
    JsonObject,
    WebSocketMessageError,
    never
  >;
  readonly close: () => Effect.Effect<void, never, never>;
}

// Service Definition
export class AgentConnectionService extends Effect.Service<AgentConnectionApi>()(
  "AgentConnectionService",
  {
    effect: Effect.gen(function* (_) {
      const connectionRef = yield* Ref.make<WebSocket | null>(null);
      const isConnectingRef = yield* Ref.make(false);

      const ensureConnection = Effect.gen(function* () {
        const ws = yield* Ref.get(connectionRef);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          return yield* Effect.fail(
            new WebSocketConnectionError({
              message: "WebSocket connection not available",
            }),
          );
        }
        return yield* Effect.succeed(ws);
      });

      return {
        connect: (url: string | URL) =>
          Effect.gen(function* () {
            const isConnecting = yield* Ref.get(isConnectingRef);
            if (isConnecting) {
              return yield* Effect.fail(
                new WebSocketConnectionError({
                  message: "Connection attempt already in progress",
                }),
              );
            }

            const existingWs = yield* Ref.get(connectionRef);
            if (existingWs?.readyState === WebSocket.OPEN) {
              return existingWs;
            }

            yield* Ref.set(isConnectingRef, true);
            try {
              const ws = yield* Effect.tryPromise({
                try: () =>
                  new Promise<WebSocket>((resolve, reject) => {
                    const newWs = new WebSocket(url);
                    newWs.onopen = () => resolve(newWs);
                    newWs.onerror = (event) =>
                      reject(
                        new WebSocketConnectionError({
                          message: `WebSocket connection failed for URL: ${url}`,
                          cause: event,
                        }),
                      );
                  }),
                catch: (unknown) =>
                  new WebSocketConnectionError({
                    message: "Failed to establish WebSocket connection",
                    cause: unknown,
                  }),
              });
              yield* Ref.set(connectionRef, ws);
              return ws;
            } finally {
              yield* Ref.set(isConnectingRef, false);
            }
          }),

        sendMessage: (message: any) =>
          Effect.gen(function* () {
            const ws = yield* ensureConnection;
            yield* Effect.try({
              try: () => {
                ws.send(JSON.stringify(message));
              },
              catch: (unknown) =>
                new WebSocketSendError({
                  message: "Failed to send message via WebSocket",
                  cause: unknown,
                }),
            });
          }),

        receiveMessages: () =>
          Stream.async<JsonObject, WebSocketMessageError, never>((emit) => {
            Effect.runSync(
              Effect.gen(function* () {
                const ws = yield* Ref.get(connectionRef);
                if (!ws) {
                  emit(
                    Effect.fail(
                      Option.some(
                        new WebSocketMessageError({
                          message: "No WebSocket connection available",
                        }),
                      ),
                    ),
                  );
                  return;
                }

                ws.onmessage = (event) => {
                  try {
                    const parsedMessage: JsonObject = JSON.parse(
                      event.data as string,
                    );
                    emit(Effect.succeed(Chunk.of(parsedMessage)));
                  } catch (error) {
                    emit(
                      Effect.fail(
                        Option.some(
                          new WebSocketMessageError({
                            message:
                              "Failed to parse incoming WebSocket message",
                            cause: error,
                          }),
                        ),
                      ),
                    );
                  }
                };

                ws.onerror = (event) => {
                  emit(
                    Effect.fail(
                      Option.some(
                        new WebSocketMessageError({
                          message: "WebSocket error during message reception",
                          cause: event,
                        }),
                      ),
                    ),
                  );
                };

                ws.onclose = (event) => {
                  if (!event.wasClean) {
                    emit(
                      Effect.fail(
                        Option.some(
                          new WebSocketMessageError({
                            message: `WebSocket closed unexpectedly (code: ${event.code}, reason: ${event.reason})`,
                            cause: event,
                          }),
                        ),
                      ),
                    );
                  } else {
                    emit(Effect.fail(Option.none()));
                  }
                };
              }),
            );
          }),

        close: () =>
          Effect.gen(function* () {
            const ws = yield* Ref.get(connectionRef);
            if (
              ws &&
              (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING)
            ) {
              ws.close();
              yield* Ref.set(connectionRef, null);
            }
          }),
      };
    }),
    dependencies: [],
  },
) {}
