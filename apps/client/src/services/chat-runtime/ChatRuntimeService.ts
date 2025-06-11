import { ProtocolMessage, createMessage } from "@buddy/protocol";
// Ensure all necessary Effect modules are imported directly
import { Data, Effect, Layer, Queue, Stream } from "effect"; // Added Layer back
import { Scope } from "effect/Scope";
import {
  WebSocketError as BaseWebSocketError,
  WebSocketService,
} from "../websocket/WebSocketService";
import {
  AgentEndpointNotFoundError,
  AgentEndpointResolverService,
} from "./AgentEndpointResolverService";

// --- Enums and Interfaces for Agent Runtime ---

export type AgentSessionStatus =
  | { _tag: "Initializing" }
  | { _tag: "Connecting"; attempt: number; url?: string }
  | { _tag: "Connected"; url: string }
  | { _tag: "Disconnected"; reason?: string; code?: number; url: string }
  | { _tag: "Error"; error: AgentRuntimeError; url?: string };

export const AgentSessionStatus = {
  Initializing: (): AgentSessionStatus => ({ _tag: "Initializing" }),
  Connecting: (attempt: number, url?: string): AgentSessionStatus => ({
    _tag: "Connecting",
    attempt,
    url,
  }),
  Connected: (url: string): AgentSessionStatus => ({
    _tag: "Connected",
    url,
  }),
  Disconnected: (
    url: string,
    reason?: string,
    code?: number,
  ): AgentSessionStatus => ({ _tag: "Disconnected", url, reason, code }),
  Error: (error: AgentRuntimeError, url?: string): AgentSessionStatus => ({
    _tag: "Error",
    error,
    url,
  }),
};

export class AgentRuntimeError extends Data.TaggedError("AgentRuntimeError")<{
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
  readonly agentId?: string;
  readonly chatId?: string;
  readonly url?: string;
}> { }

function mapToAgentRuntimeError(
  error: unknown,
  context: { agentId: string; chatId: string; url?: string },
): AgentRuntimeError {
  if (error instanceof AgentRuntimeError) return error;
  if (error instanceof AgentEndpointNotFoundError) {
    return new AgentRuntimeError({
      message: `Failed to resolve endpoint for agent ${error.agentId}: ${error.message}`,
      code: "ENDPOINT_NOT_FOUND",
      cause: error,
      agentId: error.agentId,
      chatId: context.chatId,
    });
  }
  if (error instanceof BaseWebSocketError) {
    return new AgentRuntimeError({
      message: `WebSocket error: ${error.message}`,
      code: "WEBSOCKET_ERROR",
      cause: error,
      ...context,
    });
  }
  return new AgentRuntimeError({
    message: `An unexpected error occurred: ${String(error)}`,
    code: "UNEXPECTED_RUNTIME_ERROR",
    cause: error,
    ...context,
  });
}

export interface AgentSession {
  readonly id: string;
  readonly agentId: string;
  readonly chatId: string;
  readonly url: string;
  readonly send: (
    message: ProtocolMessage,
  ) => Effect.Effect<void, AgentRuntimeError>;
  readonly incomingMessages$: Stream.Stream<ProtocolMessage, AgentRuntimeError>;
  readonly status$: Stream.Stream<AgentSessionStatus, never>;
  readonly close: (graceful?: boolean) => Effect.Effect<void, never>;
}

export interface ChatRuntimeServiceApi {
  readonly establishSession: (
    agentId: string,
    chatId: string,
  ) => Effect.Effect<AgentSession, AgentRuntimeError, Scope>;
  readonly start: () => Effect.Effect<void, AgentRuntimeError>;
  readonly stop: () => Effect.Effect<void, never>;
  readonly sendMessage: (text: string) => Effect.Effect<void, AgentRuntimeError>;
  readonly getState: Stream.Stream<{ status: string; message?: string }, never>;
}

// --- Service Definition and Implementation ---
export class ChatRuntimeService extends Effect.Service<ChatRuntimeServiceApi>()(
  "ChatRuntimeService", // Service Identifier
  {
    // The implementation is a scoped effect because it manages WebSocket connections
    scoped: Effect.gen(function* () {
      const resolver = yield* AgentEndpointResolverService; // Dependency injection
      const wsService = yield* WebSocketService; // Dependency injection
      const stateQueue = yield* Queue.sliding<{ status: string; message?: string }>(10);
      let currentSession: AgentSession | null = null;

      // The actual implementation of establishSession
      function establishSessionImpl(
        agentId: string,
        chatId: string,
      ): Effect.Effect<AgentSession, AgentRuntimeError, Scope> {
        // Scope from Effect.scoped
        return Effect.gen(function* () {
          const sessionId = crypto.randomUUID();
          const statusQueue = yield* Queue.sliding<AgentSessionStatus>(5);
          yield* statusQueue.offer(AgentSessionStatus.Initializing());

          const resolvedUrl = yield* resolver
            .resolveEndpoint(agentId, chatId)
            .pipe(
              Effect.mapError((err) =>
                mapToAgentRuntimeError(err, { agentId, chatId }),
              ),
            );

          yield* statusQueue.offer(
            AgentSessionStatus.Connecting(1, resolvedUrl),
          );

          // Connect to WebSocket, wsService.connect returns Effect<void, WebSocketError>
          yield* wsService
            .connect(resolvedUrl)
            .pipe(
              Effect.mapError((err) =>
                mapToAgentRuntimeError(err, {
                  agentId,
                  chatId,
                  url: resolvedUrl,
                }),
              ),
            );

          yield* statusQueue.offer(AgentSessionStatus.Connected(resolvedUrl));

          // Use wsService.receive() directly
          const incomingMessages$ = wsService.receive().pipe(
            Stream.catchAll((error) => {
              const runtimeError = mapToAgentRuntimeError(error, {
                agentId,
                chatId,
                url: resolvedUrl,
              });
              return Stream.fromEffect(
                statusQueue.offer(
                  AgentSessionStatus.Error(runtimeError, resolvedUrl),
                ),
              ).pipe(Stream.flatMap(() => Stream.fail(runtimeError)));
            }),
            Stream.ensuring(
              statusQueue.offer(
                AgentSessionStatus.Disconnected(resolvedUrl, "Stream ended"),
              ),
            ),
          );

          const send = (
            message: ProtocolMessage,
          ): Effect.Effect<void, AgentRuntimeError> => {
            // Construct canonical WebSocketMessage using createMessage
            // Assume message is a CommandPayload or similar
            const wsMessage = createMessage(
              message.type as any, // Should be MessageType
              message.payload,
              message.metadata
            );
            return wsService.send(wsMessage).pipe(
              Effect.mapError((err) =>
                mapToAgentRuntimeError(err, {
                  agentId,
                  chatId,
                  url: resolvedUrl,
                }),
              ),
            );
          };

          const closeSession = (graceful = true): Effect.Effect<void, never> =>
            Effect.gen(function* () {
              yield* Effect.logInfo(
                `[AgentSession ${sessionId}] Client closing session (graceful: ${graceful}). URL: ${resolvedUrl}`,
              );
              yield* statusQueue.offer(
                AgentSessionStatus.Disconnected(
                  resolvedUrl,
                  "Client initiated close",
                ),
              );
              yield* Queue.shutdown(statusQueue);
              yield* wsService.disconnect().pipe(Effect.orDie);
              return; // Explicitly return void
            }).pipe(Effect.orDie);

          const session = {
            id: sessionId,
            agentId,
            chatId,
            url: resolvedUrl,
            send,
            incomingMessages$,
            status$: Stream.fromQueue(statusQueue).pipe(
              Stream.ensuring(Queue.shutdown(statusQueue)),
            ),
            close: closeSession,
          } satisfies AgentSession;

          currentSession = session;
          return session;
        }).pipe(Effect.scoped);
      }

      return {
        establishSession: (agentId: string, chatId: string) =>
          establishSessionImpl(agentId, chatId),

        start: (): Effect.Effect<void, AgentRuntimeError> =>
          Effect.gen(function* () {
            yield* Effect.logInfo("Starting session");
            if (currentSession) {
              return yield* Effect.fail(
                new AgentRuntimeError({
                  message: "Session already started",
                  code: "ALREADY_STARTED",
                }),
              );
            }

            yield* stateQueue.offer({ status: "connecting" });
            const session = yield* Effect.scoped(establishSessionImpl("default", "default"));
            yield* stateQueue.offer({ status: "connected" });
            currentSession = session;
            return; // Explicitly return void
          }),

        stop: (): Effect.Effect<void, never> =>
          Effect.gen(function* () {
            if (currentSession) {
              yield* currentSession.close(true);
              currentSession = null;
            }
            yield* stateQueue.offer({ status: "disconnected" });
            return; // Explicitly return void
          }),

        sendMessage: (text: string): Effect.Effect<void, AgentRuntimeError> =>
          Effect.gen(function* () {
            if (!currentSession) {
              return yield* Effect.fail(
                new AgentRuntimeError({
                  message: "WebSocket not connected",
                  code: "SEND_ERROR",
                }),
              );
            }

            yield* stateQueue.offer({ status: "thinking" });

            const message = createMessage(
              "COMMAND",
              {
                command: "userMessage",
                data: { text },
                __tag: "CommandPayload",
              },
            );

            yield* currentSession.send(message);
            yield* stateQueue.offer({ status: "idle", message: text });
            return; // Explicitly return void
          }),

        getState: Stream.fromQueue(stateQueue),
      } satisfies ChatRuntimeServiceApi;
    }),
    dependencies: [AgentEndpointResolverService.Default, WebSocketService.Default], // Explicitly declare dependencies
  },
) {}
