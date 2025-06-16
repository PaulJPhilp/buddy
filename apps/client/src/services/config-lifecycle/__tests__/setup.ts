import { afterAll, beforeAll } from "vitest";
import { ConfigApiTestServer } from "./api-test-server";

// Create a shared test server instance
export const testApiServer = new ConfigApiTestServer(3001);

// Global setup and teardown
beforeAll(async () => {
  console.log("🚀 Starting Config API test server...");
  await testApiServer.start();
});

afterAll(async () => {
  console.log("🛑 Stopping Config API test server...");
  await testApiServer.stop();
});

// Export test server URL for tests to use
export const TEST_API_URL = "http://localhost:3001";
