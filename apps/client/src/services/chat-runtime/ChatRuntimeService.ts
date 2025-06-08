import { ProtocolMessage, createWebSocketEnvelope } from "@buddy/protocol";
// Ensure all necessary Effect modules are imported directly
import { Data, Effect, Queue, Stream } from "effect"; // Removed Layer, Context from general import, Added Scope
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
    // The Scope requirement comes from the fact that the implementation uses Effect.scoped
  ) => Effect.Effect<AgentSession, AgentRuntimeError, Scope>;
}

// --- Service Definition and Implementation ---
export class ChatRuntimeService extends Effect.Service<ChatRuntimeServiceApi>()(
  "ChatRuntimeService", // Service Identifier
  {
    // The implementation is a scoped effect because it manages WebSocket connections
    scoped: Effect.gen(function* () {
      const resolver = yield* AgentEndpointResolverService; // Dependency injection
      const wsService = yield* WebSocketService; // Dependency injection

      // This variable is used to store the resolvedUrl in a wider scope
      // to be accessible in the tapError block for logging.
      let resolvedUrlForErrorLogging: string | undefined = undefined;

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
              Effect.map((url) => {
                resolvedUrlForErrorLogging = url;
                return url;
              }),
              Effect.mapError((err) =>
                mapToAgentRuntimeError(err, { agentId, chatId }),
              ),
            );

          resolvedUrlForErrorLogging = resolvedUrl; // Ensure it's set for the current attempt

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
            // Pass ProtocolMessage object directly to createWebSocketEnvelope
            const envelope = createWebSocketEnvelope(message);
            return wsService.send(envelope).pipe(
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
            }).pipe(Effect.orDie);

          return {
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
        }).pipe(
          Effect.tapError((error) => {
            // Log failure of the entire establishSessionImpl attempt
            const urlForError = resolvedUrlForErrorLogging;
            return Effect.logError(
              `Failed to establish agent session for agentId: ${agentId}, chatId: ${chatId}, url: ${urlForError ?? "unknown"}`,
              error,
            );
          }),
          Effect.scoped, // This makes the whole Effect<AgentSession,...> a scoped resource
        );
      }

      // Return the API implementation, conforming to ChatRuntimeServiceApi
      return {
        establishSession: (agentId: string, chatId: string) =>
          establishSessionImpl(agentId, chatId),
      } satisfies ChatRuntimeServiceApi;
    }),
    // Define dependencies for this service using .Default as required by these specific services
    dependencies: [
      AgentEndpointResolverService.Default,
      WebSocketService.Default,
    ],
  },
) { }
