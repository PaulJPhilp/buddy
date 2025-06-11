import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  ConnectionError,
  ConnectionManagementService,
  type ConnectionState,
  type ConnectionStatus,
  ReconnectionError,
} from "../ConnectionManagementService";

// --- Test Suite ---
describe("ConnectionManagementService", () => {
  describe("createInitialState", () => {
    it("should create initial state with initializing status", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const state = yield* service.createInitialState();
        
        expect(state.status).toBe("initializing");
        expect(state.error).toBe(undefined);
        expect(state.attempt).toBe(undefined);
        expect(state.url).toBe(undefined);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("handleStatusChange", () => {
    const initialState: ConnectionState = {
      status: "initializing",
    };

    it("should handle Initializing status change", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const newState = yield* service.handleStatusChange(initialState, {
          _tag: "Initializing",
        });
        
        expect(newState.status).toBe("initializing");
        expect(newState.error).toBe(undefined);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Connecting status change", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const newState = yield* service.handleStatusChange(initialState, {
          _tag: "Connecting",
          attempt: 1,
          url: "ws://localhost:8080",
        });
        
        expect(newState.status).toBe("connecting");
        expect(newState.attempt).toBe(1);
        expect(newState.url).toBe("ws://localhost:8080");
        expect(newState.error).toBe("Attempt 1 to ws://localhost:8080");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Connecting without attempt number", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const newState = yield* service.handleStatusChange(initialState, {
          _tag: "Connecting",
          url: "ws://localhost:8080",
        });
        
        expect(newState.status).toBe("connecting");
        expect(newState.url).toBe("ws://localhost:8080");
        expect(newState.error).toBe(undefined);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Connected status change", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const connectingState: ConnectionState = {
          status: "connecting",
          attempt: 1,
          error: "Connecting...",
        };
        
        const newState = yield* service.handleStatusChange(connectingState, {
          _tag: "Connected",
        });
        
        expect(newState.status).toBe("connected");
        expect(newState.error).toBe(undefined);
        expect(newState.attempt).toBe(undefined);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Disconnected status change with reason", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const connectedState: ConnectionState = {
          status: "connected",
        };
        
        const newState = yield* service.handleStatusChange(connectedState, {
          _tag: "Disconnected",
          reason: "Server closed connection",
        });
        
        expect(newState.status).toBe("disconnected");
        expect(newState.error).toBe("Server closed connection");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Disconnected status change without reason", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const connectedState: ConnectionState = {
          status: "connected",
        };
        
        const newState = yield* service.handleStatusChange(connectedState, {
          _tag: "Disconnected",
        });
        
        expect(newState.status).toBe("disconnected");
        expect(newState.error).toBe("Connection closed");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Error status change with error message", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const newState = yield* service.handleStatusChange(initialState, {
          _tag: "Error",
          error: { message: "Network timeout" },
        });
        
        expect(newState.status).toBe("error");
        expect(newState.error).toBe("Network timeout");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle Error status change without error message", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const newState = yield* service.handleStatusChange(initialState, {
          _tag: "Error",
        });
        
        expect(newState.status).toBe("error");
        expect(newState.error).toBe("Unknown error");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should preserve existing state for unknown status", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const existingState: ConnectionState = {
          status: "connected",
          url: "ws://localhost:8080",
        };
        
        const newState = yield* service.handleStatusChange(existingState, {
          _tag: "UnknownStatus" as any,
        });
        
        expect(newState).toEqual(existingState);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle multiple status transitions", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        let state = yield* service.createInitialState();
        
        // Initializing -> Connecting
        state = yield* service.handleStatusChange(state, {
          _tag: "Connecting",
          attempt: 1,
          url: "ws://localhost:8080",
        });
        expect(state.status).toBe("connecting");
        
        // Connecting -> Connected
        state = yield* service.handleStatusChange(state, {
          _tag: "Connected",
        });
        expect(state.status).toBe("connected");
        expect(state.error).toBe(undefined);
        
        // Connected -> Disconnected
        state = yield* service.handleStatusChange(state, {
          _tag: "Disconnected",
          reason: "User disconnected",
        });
        expect(state.status).toBe("disconnected");
        expect(state.error).toBe("User disconnected");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("handleReconnectionAttempt", () => {
    it("should handle first reconnection attempt", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const disconnectedState: ConnectionState = {
          status: "disconnected",
          error: "Connection lost",
        };
        
        const newState = yield* service.handleReconnectionAttempt(disconnectedState, 1);
        
        expect(newState.status).toBe("reconnecting");
        expect(newState.attempt).toBe(1);
        expect(newState.error).toBe("Connection attempt 1 failed. Retrying...");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle multiple reconnection attempts", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        let state: ConnectionState = {
          status: "disconnected",
          error: "Connection lost",
        };
        
        // First attempt
        state = yield* service.handleReconnectionAttempt(state, 1);
        expect(state.attempt).toBe(1);
        expect(state.error).toBe("Connection attempt 1 failed. Retrying...");
        
        // Second attempt
        state = yield* service.handleReconnectionAttempt(state, 2);
        expect(state.attempt).toBe(2);
        expect(state.error).toBe("Connection attempt 2 failed. Retrying...");
        
        // Third attempt
        state = yield* service.handleReconnectionAttempt(state, 3);
        expect(state.attempt).toBe(3);
        expect(state.error).toBe("Connection attempt 3 failed. Retrying...");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should preserve other state properties during reconnection", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const state: ConnectionState = {
          status: "error",
          url: "ws://localhost:8080",
          error: "Previous error",
        };
        
        const newState = yield* service.handleReconnectionAttempt(state, 1);
        
        expect(newState.status).toBe("reconnecting");
        expect(newState.url).toBe("ws://localhost:8080");
        expect(newState.attempt).toBe(1);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("handleConnectionFailure", () => {
    it("should handle connection failure with error message", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const connectingState: ConnectionState = {
          status: "connecting",
          attempt: 1,
        };
        
        const newState = yield* service.handleConnectionFailure(
          connectingState,
          "Connection timeout"
        );
        
        expect(newState.status).toBe("error");
        expect(newState.error).toBe("Connection timeout");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle connection failure from different states", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        
        // From connecting state
        const connectingState: ConnectionState = { status: "connecting" };
        const errorFromConnecting = yield* service.handleConnectionFailure(
          connectingState,
          "Network error"
        );
        expect(errorFromConnecting.status).toBe("error");
        expect(errorFromConnecting.error).toBe("Network error");
        
        // From reconnecting state
        const reconnectingState: ConnectionState = { status: "reconnecting", attempt: 2 };
        const errorFromReconnecting = yield* service.handleConnectionFailure(
          reconnectingState,
          "Timeout error"
        );
        expect(errorFromReconnecting.status).toBe("error");
        expect(errorFromReconnecting.error).toBe("Timeout error");
        expect(errorFromReconnecting.attempt).toBe(2); // Preserve attempt
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should preserve other state properties during failure", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const state: ConnectionState = {
          status: "connecting",
          url: "ws://localhost:8080",
          attempt: 3,
        };
        
        const newState = yield* service.handleConnectionFailure(state, "Auth failed");
        
        expect(newState.status).toBe("error");
        expect(newState.error).toBe("Auth failed");
        expect(newState.url).toBe("ws://localhost:8080");
        expect(newState.attempt).toBe(3);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("isConnected", () => {
    it("should return true for connected status", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        const connectedState: ConnectionState = { status: "connected" };
        
        const isConnected = yield* service.isConnected(connectedState);
        
        expect(isConnected).toBe(true);
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should return false for non-connected statuses", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        
        const statuses: ConnectionStatus[] = [
          "initializing",
          "connecting",
          "disconnected",
          "reconnecting",
          "error",
        ];
        
        for (const status of statuses) {
          const state: ConnectionState = { status };
          const isConnected = yield* service.isConnected(state);
          expect(isConnected).toBe(false);
        }
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("shouldReconnect", () => {
    it("should return true for states that should reconnect", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        
        const reconnectableStatuses: ConnectionStatus[] = [
          "disconnected",
          "error",
          "reconnecting",
        ];
        
        for (const status of reconnectableStatuses) {
          const state: ConnectionState = { status };
          const shouldReconnect = yield* service.shouldReconnect(state);
          expect(shouldReconnect).toBe(true);
        }
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should return false for states that should not reconnect", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        
        const nonReconnectableStatuses: ConnectionStatus[] = [
          "initializing",
          "connecting",
          "connected",
        ];
        
        for (const status of nonReconnectableStatuses) {
          const state: ConnectionState = { status };
          const shouldReconnect = yield* service.shouldReconnect(state);
          assert.isFalse(shouldReconnect);
        }
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });

  describe("integration scenarios", () => {
    it("should handle complete connection lifecycle", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        
        // Start with initial state
        let state = yield* service.createInitialState();
        expect(state.status).toBe("initializing");
        
        // Move to connecting
        state = yield* service.handleStatusChange(state, {
          _tag: "Connecting",
          attempt: 1,
          url: "ws://localhost:8080",
        });
        expect(state.status).toBe("connecting");
        assert.isFalse(yield* service.isConnected(state));
        
        // Successfully connect
        state = yield* service.handleStatusChange(state, {
          _tag: "Connected",
        });
        expect(state.status).toBe("connected");
        expect(yield* service.isConnected(state).toBe(true));
        assert.isFalse(yield* service.shouldReconnect(state));
        
        // Disconnect
        state = yield* service.handleStatusChange(state, {
          _tag: "Disconnected",
          reason: "Network issue",
        });
        expect(state.status).toBe("disconnected");
        assert.isFalse(yield* service.isConnected(state));
        expect(yield* service.shouldReconnect(state).toBe(true));
        
        // Attempt reconnection
        state = yield* service.handleReconnectionAttempt(state, 1);
        expect(state.status).toBe("reconnecting");
        expect(yield* service.shouldReconnect(state).toBe(true));
        
        // Reconnection fails
        state = yield* service.handleConnectionFailure(state, "Timeout");
        expect(state.status).toBe("error");
        assert.isFalse(yield* service.isConnected(state));
        expect(yield* service.shouldReconnect(state).toBe(true));
      }).pipe(Effect.provide(ConnectionManagementService.Default)));

    it("should handle rapid status changes", () =>
      Effect.gen(function* () {
        const service = yield* ConnectionManagementService;
        let state = yield* service.createInitialState();
        
        // Rapid sequence of status changes
        const statusUpdates = [
          { _tag: "Connecting" as const, url: "ws://localhost:8080" },
          { _tag: "Error" as const, error: { message: "Failed" } },
          { _tag: "Connecting" as const, attempt: 2, url: "ws://localhost:8080" },
          { _tag: "Connected" as const },
          { _tag: "Disconnected" as const, reason: "Server restart" },
        ];
        
        for (const update of statusUpdates) {
          state = yield* service.handleStatusChange(state, update);
        }
        
        expect(state.status).toBe("disconnected");
        expect(state.error).toBe("Server restart");
      }).pipe(Effect.provide(ConnectionManagementService.Default)));
  });
}); 