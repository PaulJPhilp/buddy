#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { join } from "node:path";

console.log("Starting llm-agent server...");

// Get the path to the llm-agent directory
const mockServerPath = join(process.cwd(), "../../llm-agent");

// Start the server using npm run start (Node.js runtime)
const serverProcess = spawn("npm", ["run", "start"], {
  cwd: mockServerPath,
  stdio: "inherit",
  shell: true,
});

serverProcess.on("error", (error) => {
  console.error("Failed to start llm-agent server:", error);
  process.exit(1);
});

serverProcess.on("close", (code) => {
  console.log(`Mock-agent-llm server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log("\nShutting down llm-agent server...");
  serverProcess.kill("SIGTERM");
});

process.on("SIGTERM", () => {
  serverProcess.kill("SIGTERM");
});

console.log("Mock-agent-llm server started on port 8080");
console.log("Press Ctrl+C to stop the server");
