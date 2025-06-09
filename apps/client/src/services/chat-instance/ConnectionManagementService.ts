/**
 * @file ConnectionManagementService - Connection state management and reconnection logic
 * @module services/chat-instance/ConnectionManagementService
 */

import { Data, Effect } from "effect";

// Error types
export class ConnectionError extends Data.TaggedError("ConnectionError")<{
    readonly message: string;
    readonly cause?: unknown;
}> { }

export class ReconnectionError extends Data.TaggedError("ReconnectionError")<{
    readonly message: string;
    readonly attempt: number;
    readonly cause?: unknown;
}> { }

// Connection status types
export type ConnectionStatus =
    | "initializing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "error";

export interface ConnectionState {
    readonly status: ConnectionStatus;
    readonly error?: string;
    readonly attempt?: number;
    readonly url?: string;
}

// Service API interface
export interface ConnectionManagementServiceApi {
    readonly createInitialState: () => Effect.Effect<ConnectionState, never>;

    readonly handleStatusChange: (
        currentState: ConnectionState,
        statusUpdate: {
            _tag: "Initializing" | "Connecting" | "Connected" | "Disconnected" | "Error";
            attempt?: number;
            url?: string;
            reason?: string;
            error?: { message: string };
        }
    ) => Effect.Effect<ConnectionState, never>;

    readonly handleReconnectionAttempt: (
        currentState: ConnectionState,
        attempt: number
    ) => Effect.Effect<ConnectionState, never>;

    readonly handleConnectionFailure: (
        currentState: ConnectionState,
        error: string
    ) => Effect.Effect<ConnectionState, never>;

    readonly isConnected: (state: ConnectionState) => Effect.Effect<boolean, never>;

    readonly shouldReconnect: (state: ConnectionState) => Effect.Effect<boolean, never>;
}

/**
 * ConnectionManagementService - Handles connection state management and reconnection logic
 */
export class ConnectionManagementService extends Effect.Service<ConnectionManagementServiceApi>()(
    "ConnectionManagementService",
    {
        effect: Effect.gen(function* () {
            const createInitialState = (): Effect.Effect<ConnectionState, never> =>
                Effect.succeed({
                    status: "initializing" as const,
                });

            const handleStatusChange = (
                currentState: ConnectionState,
                statusUpdate: {
                    _tag: "Initializing" | "Connecting" | "Connected" | "Disconnected" | "Error";
                    attempt?: number;
                    url?: string;
                    reason?: string;
                    error?: { message: string };
                }
            ): Effect.Effect<ConnectionState, never> =>
                Effect.gen(function* () {
                    yield* Effect.logDebug(
                        `[ConnectionManagementService] Status change from ${currentState.status} to ${statusUpdate._tag}`,
                        statusUpdate
                    );

                    switch (statusUpdate._tag) {
                        case "Initializing":
                            return {
                                ...currentState,
                                status: "initializing" as const,
                                error: undefined,
                            };

                        case "Connecting":
                            return {
                                ...currentState,
                                status: "connecting" as const,
                                attempt: statusUpdate.attempt,
                                url: statusUpdate.url,
                                error: statusUpdate.attempt
                                    ? `Attempt ${statusUpdate.attempt} to ${statusUpdate.url}`
                                    : undefined,
                            };

                        case "Connected":
                            return {
                                ...currentState,
                                status: "connected" as const,
                                error: undefined,
                                attempt: undefined,
                            };

                        case "Disconnected":
                            return {
                                ...currentState,
                                status: "disconnected" as const,
                                error: statusUpdate.reason ?? "Connection closed",
                            };

                        case "Error":
                            return {
                                ...currentState,
                                status: "error" as const,
                                error: statusUpdate.error?.message ?? "Unknown error",
                            };

                        default:
                            return currentState;
                    }
                });

            const handleReconnectionAttempt = (
                currentState: ConnectionState,
                attempt: number
            ): Effect.Effect<ConnectionState, never> =>
                Effect.gen(function* () {
                    yield* Effect.logInfo(
                        `[ConnectionManagementService] Reconnection attempt ${attempt}`
                    );

                    return {
                        ...currentState,
                        status: "reconnecting" as const,
                        attempt,
                        error: `Connection attempt ${attempt} failed. Retrying...`,
                    };
                });

            const handleConnectionFailure = (
                currentState: ConnectionState,
                error: string
            ): Effect.Effect<ConnectionState, never> =>
                Effect.gen(function* () {
                    yield* Effect.logError(
                        `[ConnectionManagementService] Connection failure: ${error}`
                    );

                    return {
                        ...currentState,
                        status: "error" as const,
                        error,
                    };
                });

            const isConnected = (state: ConnectionState): Effect.Effect<boolean, never> =>
                Effect.succeed(state.status === "connected");

            const shouldReconnect = (state: ConnectionState): Effect.Effect<boolean, never> =>
                Effect.succeed(
                    state.status === "disconnected" ||
                    state.status === "error" ||
                    state.status === "reconnecting"
                );

            return {
                createInitialState,
                handleStatusChange,
                handleReconnectionAttempt,
                handleConnectionFailure,
                isConnected,
                shouldReconnect,
            };
        }),
        dependencies: [],
    }
) { } 