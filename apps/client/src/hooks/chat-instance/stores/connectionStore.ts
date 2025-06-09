import { createStore } from "@xstate/store";
import type { ConnectionState } from "../types";

// Constants for reconnection logic
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;

// Initial state factory
const createInitialState = (): ConnectionState => ({
    status: "disconnected",
    reconnectAttempts: 0,
    lastError: undefined,
    maxReconnectAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
});

// Connection Store - manages connection state and reconnection logic
export const connectionStore = createStore({
    context: createInitialState(),
    on: {
        connect: (context, event: { chatId: string; agentId: string }) => ({
            ...context,
            status: "connecting" as const,
            reconnectAttempts: 0,
            lastError: undefined,
        }),

        connected: (context) => ({
            ...context,
            status: "connected" as const,
            reconnectAttempts: 0,
            lastError: undefined,
        }),

        disconnect: (context, event: { reason?: string }) => ({
            ...context,
            status: "disconnected" as const,
            lastError: event.reason ? new Error(event.reason) : undefined,
        }),

        disconnected: (context, event: { reason?: string }) => ({
            ...context,
            status: "disconnected" as const,
            lastError: event.reason ? new Error(event.reason) : context.lastError,
        }),

        reconnect: (context) => ({
            ...context,
            status: "reconnecting" as const,
        }),

        reconnectAttempted: (context, event: { attempt: number }) => ({
            ...context,
            reconnectAttempts: event.attempt,
            status: "reconnecting" as const,
        }),

        reconnectSucceeded: (context) => ({
            ...context,
            status: "connected" as const,
            reconnectAttempts: 0,
            lastError: undefined,
        }),

        reconnectFailed: (context, event: { error: Error; attempt: number }) => ({
            ...context,
            reconnectAttempts: event.attempt,
            lastError: event.error,
            status:
                event.attempt >= context.maxReconnectAttempts
                    ? ("error" as const)
                    : ("reconnecting" as const),
        }),

        reconnectAbandoned: (context, event: { finalAttempt: number }) => ({
            ...context,
            status: "error" as const,
            reconnectAttempts: event.finalAttempt,
        }),

        errorOccurred: (context, event: { error: Error }) => ({
            ...context,
            status: "error" as const,
            lastError: event.error,
        }),

        reset: () => createInitialState(),
    },
});

// Selectors for connection state
export const connectionSelectors = {
    // Get the full state
    getState: (state: typeof connectionStore.getSnapshot) => state().context,

    // Get specific parts of state
    getStatus: (state: typeof connectionStore.getSnapshot) =>
        state().context.status,
    getReconnectAttempts: (state: typeof connectionStore.getSnapshot) =>
        state().context.reconnectAttempts,
    getLastError: (state: typeof connectionStore.getSnapshot) =>
        state().context.lastError,
    getMaxReconnectAttempts: (state: typeof connectionStore.getSnapshot) =>
        state().context.maxReconnectAttempts,

    // Computed selectors
    isConnected: (state: typeof connectionStore.getSnapshot) =>
        state().context.status === "connected",

    isConnecting: (state: typeof connectionStore.getSnapshot) =>
        state().context.status === "connecting",

    isReconnecting: (state: typeof connectionStore.getSnapshot) =>
        state().context.status === "reconnecting",

    isDisconnected: (state: typeof connectionStore.getSnapshot) =>
        state().context.status === "disconnected",

    hasError: (state: typeof connectionStore.getSnapshot) =>
        state().context.status === "error",

    canReconnect: (state: typeof connectionStore.getSnapshot) => {
        const context = state().context;
        return (
            context.reconnectAttempts < context.maxReconnectAttempts &&
            (context.status === "disconnected" || context.status === "error")
        );
    },

    shouldAbandoneReconnect: (state: typeof connectionStore.getSnapshot) => {
        const context = state().context;
        return context.reconnectAttempts >= context.maxReconnectAttempts;
    },

    getReconnectAttemptsRemaining: (
        state: typeof connectionStore.getSnapshot,
    ) => {
        const context = state().context;
        return Math.max(
            0,
            context.maxReconnectAttempts - context.reconnectAttempts,
        );
    },
};

// Action creators for type-safe event dispatching
export const connectionActions = {
    connect: (chatId: string, agentId: string) =>
        connectionStore.send({ type: "connect", chatId, agentId }),

    connected: () => connectionStore.send({ type: "connected" }),

    disconnect: (reason?: string) =>
        connectionStore.send({ type: "disconnect", reason }),

    disconnected: (reason?: string) =>
        connectionStore.send({ type: "disconnected", reason }),

    reconnect: () => connectionStore.send({ type: "reconnect" }),

    reconnectAttempted: (attempt: number) =>
        connectionStore.send({ type: "reconnectAttempted", attempt }),

    reconnectSucceeded: () =>
        connectionStore.send({ type: "reconnectSucceeded" }),

    reconnectFailed: (error: Error, attempt: number) =>
        connectionStore.send({ type: "reconnectFailed", error, attempt }),

    reconnectAbandoned: (finalAttempt: number) =>
        connectionStore.send({ type: "reconnectAbandoned", finalAttempt }),

    errorOccurred: (error: Error) =>
        connectionStore.send({ type: "errorOccurred", error }),

    reset: () => connectionStore.send({ type: "reset" }),
};

// Utility functions for connection management
export const connectionUtils = {
    // Calculate exponential backoff delay
    calculateReconnectDelay: (
        attempt: number,
        baseDelay = 1000,
        maxDelay = 30000,
    ): number => {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        return Math.min(delay, maxDelay);
    },

    // Get a human-readable status message
    getStatusMessage: (state: ConnectionState): string => {
        switch (state.status) {
            case "disconnected":
                return state.lastError
                    ? `Disconnected: ${state.lastError.message}`
                    : "Disconnected";
            case "connecting":
                return "Connecting...";
            case "connected":
                return "Connected";
            case "reconnecting":
                return `Reconnecting... (attempt ${state.reconnectAttempts}/${state.maxReconnectAttempts})`;
            case "error":
                return state.lastError
                    ? `Error: ${state.lastError.message}`
                    : "Connection error";
            default:
                return "Unknown status";
        }
    },

    // Check if we should attempt reconnection
    shouldAttemptReconnect: (state: ConnectionState): boolean => {
        return (
            state.reconnectAttempts < state.maxReconnectAttempts &&
            (state.status === "disconnected" || state.status === "error")
        );
    },
};
