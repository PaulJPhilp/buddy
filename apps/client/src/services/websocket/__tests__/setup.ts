import { Effect } from "effect";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { WebSocketConnectionManager } from "../WebSocketConnectionManager";
import { WebSocketTestServer } from "./websocket-test-server";

// Use a different port for WebSocketService tests to avoid conflicts
export const testServer = new WebSocketTestServer(9998);

// Global setup and teardown
beforeAll(async () => {
  await testServer.start();
});

afterAll(async () => {
  await testServer.stop();
});

// Reset server state between tests
beforeEach(() => {
  // Add any per-test setup if needed
});

afterEach(async () => {
  // Clean up all WebSocket connections
  await Effect.runPromise(
    Effect.gen(function* () {
      const manager = yield* WebSocketConnectionManager;
      yield* manager.cleanup();
    }).pipe(Effect.provide(WebSocketConnectionManager.Default)),
  );
});

// Export test server URL for tests to use
export const TEST_WS_URL = "ws://localhost:9998";
