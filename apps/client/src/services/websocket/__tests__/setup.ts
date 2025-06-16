import { afterAll, beforeAll } from "vitest";
import { WebSocketTestServer } from "./websocket-test-server";

// Use dynamic port allocation to avoid conflicts
export const testServer = new WebSocketTestServer();

let TEST_WS_URL: string;

// Global setup and teardown
beforeAll(async () => {
  const port = await testServer.start();
  TEST_WS_URL = `ws://localhost:${port}`;
});

afterAll(async () => {
  await testServer.stop();
});

// Export a function to get the current test server URL
export function getTestWsUrl() {
  if (typeof TEST_WS_URL !== "string" || !/^ws:\/\/.+/.test(TEST_WS_URL)) {
    throw new Error(
      `TEST_WS_URL is not set or invalid: ${String(TEST_WS_URL)}.\nDid you call getTestWsUrl() before the test server was started?`,
    );
  }
  return TEST_WS_URL;
}
