import { Effect, Stream } from "effect";
import {
  WebSocketError,
  WebSocketMessage,
  WebSocketService,
} from "./WebSocketService";

export interface AgentRuntimeError extends WebSocketError {
  type: "RUNTIME_ERROR";
}

export interface AgentRuntimeState {
  id: string;
  status: "idle" | "thinking" | "responding";
  message?: string;
}

// Service interface
export interface AgentRuntimeServiceApi {
  readonly start: () => Effect.Effect<void, AgentRuntimeError>;
  readonly stop: () => Effect.Effect<void, AgentRuntimeError>;
  readonly sendMessage: (
    text: string,
  ) => Effect.Effect<void, AgentRuntimeError>;
  readonly getState: Stream.Stream<never, AgentRuntimeError, AgentRuntimeState>;
}

/**
 * AgentRuntime service implementation using Effect.Service pattern
 * Adapts to use WebSocket communication
 */
export class AgentRuntimeService extends Effect.Service<AgentRuntimeServiceApi>()(
  "AgentRuntimeService",
  {
    effect: Effect.gen(function* () {
      const ws = yield* WebSocketService;

      const mapError = (error: WebSocketError): AgentRuntimeError => ({
        ...error,
        type: "RUNTIME_ERROR",
      });

      return {
        start: () =>
          Effect.gen(function* () {
            yield* Effect.mapError(ws.connect("ws://localhost:3000"), mapError);
          }),

        stop: () =>
          Effect.gen(function* () {
            yield* Effect.mapError(ws.disconnect(), mapError);
          }),

        sendMessage: (text: string) =>
          Effect.gen(function* () {
            yield* Effect.mapError(
              ws.send({
                type: "MESSAGE",
                payload: { text },
              }),
              mapError,
            );
          }),

        getState: ws.receive().pipe(
          Stream.map((message: WebSocketMessage) => {
            switch (message.type) {
              case "MESSAGE":
                return {
                  id: "default",
                  status: "idle",
                  message: message.payload as string,
                };
              case "TYPING":
                return {
                  id: "default",
                  status: "thinking",
                };
              default:
                return {
                  id: "default",
                  status: "idle",
                };
            }
          }),
          Stream.mapError(mapError),
        ),
      };
    }),
    dependencies: [WebSocketService.Default],
  },
) {}
