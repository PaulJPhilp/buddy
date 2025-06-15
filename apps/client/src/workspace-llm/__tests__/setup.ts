import { WebSocketTestServer } from "@/services/websocket/__tests__/websocket-test-server";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

// Create a shared test server instance
export const testServer = new WebSocketTestServer(9999);

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
  // Cleanup after each test
  if (testServer.isRunning()) {
    await testServer.stop();
    await testServer.start();
  }
});

// Export test server URL for tests to use
export const TEST_WS_URL = "ws://localhost:9999";
