import { ChildProcess, spawn } from "node:child_process";
import { WebSocketMessage, createMessage, parseMessage } from "@buddy/protocol";
import { Effect, Layer } from "effect";
import { WebSocket } from "isomorphic-ws";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocketService } from "../../src/services/websocket";

let agentProcess: ChildProcess | null = null;

const AGENT_PORT = 8080; // or your configured port
const AGENT_URL = `ws://localhost:${AGENT_PORT}/chat`;

describe("ChatApp <-> LLM-Agent integration", () => {
  beforeAll((done) => {
    // Try to start the agent as a child process
    try {
      agentProcess = spawn("bun", ["run", "start"], {
        cwd: "llm-agent",
        stdio: "pipe", // Changed from "inherit" to avoid console spam
        env: { ...process.env, PORT: String(AGENT_PORT) },
      });

      agentProcess.on("error", (error) => {
        console.warn("Agent process failed to start:", error.message);
        agentProcess = null;
      });

      // Wait a bit for the server to start
      setTimeout(done, 2000);
    } catch (error) {
      console.warn("Failed to spawn agent process:", error);
      agentProcess = null;
      done();
    }
  });

  afterAll(() => {
    if (agentProcess) {
      agentProcess.kill();
      agentProcess = null;
    }
  });

  it("should send a prompt and receive a valid response", () =>
    Effect.gen(function* () {
      const service = yield* WebSocketService;
      yield* service.connect(AGENT_URL);

      const message = {
        type: "COMMAND",
        id: "test-id",
        content: "test prompt",
        timestamp: Date.now(),
      };

      yield* service.send(message);
      const response = yield* service.receive();

      expect(response).toBeDefined();
      expect(response.type).toBeDefined();
      expect([
        "COMMAND",
        "RESPONSE",
        "LLM_STREAM",
        "SYSTEM",
        "EVENT",
      ]).toContain(response.type);

      yield* service.disconnect();
    }).pipe(Effect.provide(WebSocketService.Default)));
});
