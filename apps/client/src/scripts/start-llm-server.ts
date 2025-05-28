#!/usr/bin/env bun

import { spawn } from "child_process";
import { join } from "path";

console.log("Starting mock-agent-llm server...");

// Get the path to the mock-agent-llm directory
const mockServerPath = join(process.cwd(), "../../../mock-agent-llm");

// Start the server using npm run start (Node.js runtime)
const serverProcess = spawn("npm", ["run", "start"], {
    cwd: mockServerPath,
    stdio: "inherit",
    shell: true
});

serverProcess.on("error", (error) => {
    console.error("Failed to start mock-agent-llm server:", error);
    process.exit(1);
});

serverProcess.on("close", (code) => {
    console.log(`Mock-agent-llm server exited with code ${code}`);
    process.exit(code || 0);
});

// Handle cleanup on exit
process.on("SIGINT", () => {
    console.log("\nShutting down mock-agent-llm server...");
    serverProcess.kill("SIGTERM");
});

process.on("SIGTERM", () => {
    serverProcess.kill("SIGTERM");
});

console.log("Mock-agent-llm server started on port 8080");
console.log("Press Ctrl+C to stop the server"); 