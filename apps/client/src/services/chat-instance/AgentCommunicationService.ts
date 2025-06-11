/**
 * @file AgentCommunicationService - Agent communication and session management
 * @module services/chat-instance/AgentCommunicationService
 */

import type { AgentSession } from "@/services/chat-runtime/ChatRuntimeService";
import { type AgentRuntimeError, ChatRuntimeService } from "@/services/chat-runtime/ChatRuntimeService";
import type { WebSocketMessage } from "@buddy/protocol";
import { createMessage } from "@buddy/protocol";
import { Data, Duration, Effect, Schedule, Stream } from "effect";

// Error types
export class SessionEstablishmentError extends Data.TaggedError("SessionEstablishmentError")<{
    readonly message: string;
    readonly agentId: string;
    readonly chatId: string;
    readonly cause?: unknown;
}> { }

export class MessageSendError extends Data.TaggedError("MessageSendError")<{
    readonly message: string;
    readonly cause?: unknown;
}> { }

// Configuration constants
export const INITIAL_RECONNECT_DELAY = Duration.seconds(1);
export const MAX_RECONNECT_ATTEMPTS = 5;

// Service API interface
export interface AgentCommunicationServiceApi {
    readonly establishSession: (
        agentId: string,
        chatId: string
    ) => Effect.Effect<AgentSession, SessionEstablishmentError>;

    readonly sendMessage: (
        session: AgentSession,
        text: string,
        chatId: string,
        attachments?: Array<{ name: string }>
    ) => Effect.Effect<void, MessageSendError>;

    readonly createIncomingMessageStream: (
        session: AgentSession
    ) => Stream.Stream<WebSocketMessage, never>;

    readonly createStatusStream: (
        session: AgentSession
    ) => Stream.Stream<AgentSession["status$"] extends Stream.Stream<infer T, any> ? T : never, never>;
}

/**
 * AgentCommunicationService - Handles agent communication and session management
 */
export class AgentCommunicationService extends Effect.Service<AgentCommunicationServiceApi>()(
    "AgentCommunicationService",
    {
        effect: Effect.gen(function* () {
            const chatRuntime = yield* ChatRuntimeService;

            const establishSession = (
                agentId: string,
                chatId: string
            ): Effect.Effect<AgentSession, SessionEstablishmentError> =>
                Effect.gen(function* () {
                    yield* Effect.logInfo(
                        `[AgentCommunicationService] Establishing session for chatId: ${chatId}, agentId: ${agentId}`
                    );

                    const sessionEffect = chatRuntime.establishSession(agentId, chatId).pipe(
                        Effect.retry(
                            Schedule.intersect(
                                Schedule.exponential(INITIAL_RECONNECT_DELAY).pipe(
                                    Schedule.jittered
                                ),
                                Schedule.recurs(MAX_RECONNECT_ATTEMPTS)
                            ).pipe(
                                Schedule.tapOutput((details) => {
                                    const attempt = typeof details === "number" ? details + 1 : details[1] + 1;
                                    return Effect.logInfo(
                                        `[AgentCommunicationService] Connection attempt ${attempt} for ${chatId}`
                                    );
                                })
                            )
                        ),
                        Effect.mapError(
                            (error: AgentRuntimeError) =>
                                new SessionEstablishmentError({
                                    message: `Failed to establish session after ${MAX_RECONNECT_ATTEMPTS} attempts`,
                                    agentId,
                                    chatId,
                                    cause: error,
                                })
                        )
                    );

                    const session = yield* sessionEffect;

                    yield* Effect.logInfo(
                        `[AgentCommunicationService] Session established: ${session.id}, URL: ${session.url}`
                    );

                    return session;
                });

            const sendMessage = (
                session: AgentSession,
                text: string,
                chatId: string,
                attachments?: Array<{ name: string }>
            ): Effect.Effect<void, MessageSendError> =>
                Effect.gen(function* () {
                    const protocolMessage = createMessage(
                        "COMMAND",
                        {
                            command: "userMessage",
                            data: {
                                text,
                                attachments,
                                chatId,
                                sessionId: session.id,
                            },
                            __tag: "CommandPayload"
                        },
                        session.id,
                        Date.now(),
                        { processed: false, __tag: "Metadata" }
                    );

                    yield* Effect.logDebug(
                        `[AgentCommunicationService] Sending message for ${chatId}`,
                        protocolMessage
                    );

                    yield* session.send(protocolMessage).pipe(
                        Effect.mapError(
                            (error) =>
                                new MessageSendError({
                                    message: `Failed to send message: ${error.message}`,
                                    cause: error,
                                })
                        )
                    );
                });

            const createIncomingMessageStream = (
                session: AgentSession
            ): Stream.Stream<WebSocketMessage, never> =>
                session.incomingMessages$.pipe(
                    Stream.tap((message) =>
                        Effect.logDebug(
                            `[AgentCommunicationService] Received message`,
                            message
                        )
                    )
                );

            const createStatusStream = (
                session: AgentSession
            ): Stream.Stream<AgentSession["status$"] extends Stream.Stream<infer T, any> ? T : never, never> =>
                session.status$.pipe(
                    Stream.tap((status) =>
                        Effect.logDebug(
                            `[AgentCommunicationService] Status update`,
                            status
                        )
                    )
                );

            return {
                establishSession,
                sendMessage,
                createIncomingMessageStream,
                createStatusStream,
            };
        }),
        dependencies: [ChatRuntimeService],
    }
) { } 