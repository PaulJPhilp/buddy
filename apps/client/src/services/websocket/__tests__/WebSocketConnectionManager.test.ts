import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  ConnectionManagerError,
  ConnectionPoolExhaustedError,
  WebSocketConnectionManager,
  WebSocketConnectionManagerLive,
} from "../WebSocketConnectionManager";
import { TEST_WS_URL } from "./setup";

describe("WebSocketConnectionManager", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(WebSocketConnectionManager.Default).toBeDefined();
      expect(typeof WebSocketConnectionManager.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(WebSocketConnectionManager.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* WebSocketConnectionManager;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(WebSocketConnectionManager.Default)),
      ).not.toThrow();
    });
  });

  it("should create and manage connections", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Create a new connection
      const connectionId = yield* manager.getConnection(TEST_WS_URL);

      expect(typeof connectionId).toBe("string");
      expect(connectionId).toMatch(/^ws_\d+_[a-z0-9]+$/);

      // Get connection info
      const connectionInfo = yield* manager.getConnectionInfo(connectionId);

      expect(connectionInfo).not.toBeNull();
      expect(connectionInfo?.id).toBe(connectionId);
      expect(connectionInfo?.url).toBe(TEST_WS_URL);
      expect(connectionInfo?.status).toBe("connecting");
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should create separate connections for same URL when not connected", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Create first connection (will be in "connecting" status)
      const connectionId1 = yield* manager.getConnection(TEST_WS_URL);

      // Try to create another connection to same URL
      // Since first connection is not "connected", it will create a new one
      const connectionId2 = yield* manager.getConnection(TEST_WS_URL);

      // Should create different connection IDs since first is not "connected"
      expect(connectionId1).not.toBe(connectionId2);

      // Both should be for the same URL
      const connection1Info = yield* manager.getConnectionInfo(connectionId1);
      const connection2Info = yield* manager.getConnectionInfo(connectionId2);

      expect(connection1Info?.url).toBe(TEST_WS_URL);
      expect(connection2Info?.url).toBe(TEST_WS_URL);
      expect(connection1Info?.status).toBe("connecting");
      expect(connection2Info?.status).toBe("connecting");
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should release connections", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Create a connection
      const connectionId = yield* manager.getConnection(TEST_WS_URL);

      // Verify connection exists
      const connectionInfo = yield* manager.getConnectionInfo(connectionId);
      expect(connectionInfo).not.toBeNull();

      // Release the connection
      yield* manager.releaseConnection(connectionId);

      // Verify connection is removed
      const releasedConnectionInfo =
        yield* manager.getConnectionInfo(connectionId);
      expect(releasedConnectionInfo).toBeNull();
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should list all connections", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Initially should have no connections
      const initialConnections = yield* manager.getAllConnections();
      expect(initialConnections).toHaveLength(0);

      // Create multiple connections
      const connectionId1 = yield* manager.getConnection(TEST_WS_URL);
      const connectionId2 = yield* manager.getConnection(
        `${TEST_WS_URL}/other`,
      );

      // Should now have 2 connections
      const connections = yield* manager.getAllConnections();
      expect(connections).toHaveLength(2);

      const connectionIds = connections.map((conn) => conn.id);
      expect(connectionIds).toContain(connectionId1);
      expect(connectionIds).toContain(connectionId2);
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should perform health checks", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Initial health check
      const initialHealth = yield* manager.healthCheck();
      expect(initialHealth.total).toBe(0);
      expect(initialHealth.healthy).toBe(0);

      // Create a connection
      yield* manager.getConnection(TEST_WS_URL);

      // Health check after creating connection
      const healthAfterConnection = yield* manager.healthCheck();
      expect(healthAfterConnection.total).toBe(1);
      expect(healthAfterConnection.healthy).toBe(0); // connecting status is not "connected"
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should cleanup all connections", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Create multiple connections
      yield* manager.getConnection(TEST_WS_URL);
      yield* manager.getConnection(`${TEST_WS_URL}/other`);

      // Verify connections exist
      const connectionsBeforeCleanup = yield* manager.getAllConnections();
      expect(connectionsBeforeCleanup).toHaveLength(2);

      // Cleanup all connections
      yield* manager.cleanup();

      // Verify all connections are removed
      const connectionsAfterCleanup = yield* manager.getAllConnections();
      expect(connectionsAfterCleanup).toHaveLength(0);
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should handle connection limit", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Create connections up to the limit (default is 10)
      const connectionPromises = Array.from({ length: 10 }, (_, i) =>
        manager.getConnection(`${TEST_WS_URL}/${i}`),
      );

      // All should succeed
      const connectionIds = yield* Effect.all(connectionPromises);
      expect(connectionIds).toHaveLength(10);

      // Try to create one more connection (should fail)
      const overLimitResult = yield* Effect.either(
        manager.getConnection(`${TEST_WS_URL}/overflow`),
      );

      expect(overLimitResult._tag).toBe("Left");
      if (overLimitResult._tag === "Left") {
        expect(overLimitResult.left).toBeInstanceOf(ConnectionManagerError);
        expect(overLimitResult.left.message).toContain("Maximum connections");
      }
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should handle non-existent connection info requests", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Request info for non-existent connection
      const connectionInfo =
        yield* manager.getConnectionInfo("non-existent-id");

      expect(connectionInfo).toBeNull();
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));

  it("should handle releasing non-existent connections gracefully", () =>
    Effect.gen(function* (_) {
      const manager = yield* WebSocketConnectionManager;

      // Release non-existent connection (should not throw)
      yield* manager.releaseConnection("non-existent-id");

      // Should complete without error
      expect(true).toBe(true);
    }).pipe(Effect.provide(WebSocketConnectionManagerLive), Effect.runPromise));
});
