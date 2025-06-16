import type { MessageType, WebSocketMessage } from "@buddy/protocol";
import { Effect } from "effect";
import { WebSocket } from "isomorphic-ws";
import { v4 as uuidv4 } from "uuid";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

describe("WebSocket Client-Server Communication", () => {
  let server: any;
  let TEST_PORT: number;
  let TEST_URL: string;
  const clients: WebSocket[] = [];

  // Start test server
  beforeAll(async () => {
    // Import the test server and start it
    const { createServer } = await import("http");
    const express = await import("express");
    const { WebSocketServer } = await import("ws");

    const app = express.default();
    const httpServer = createServer(app);
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws) => {
      console.log("Test client connected to server");

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log("Server received:", message);

          // Echo the message back for testing
          ws.send(
            JSON.stringify({
              ...message,
              metadata: {
                ...message.metadata,
                processed: true,
                serverReceivedAt: Date.now(),
              },
            }),
          );
        } catch (error) {
          console.error("Error processing message:", error);
        }
      });
    });

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        // Get the dynamically assigned port
        const address = httpServer.address();
        if (typeof address === "object" && address && "port" in address) {
          TEST_PORT = address.port;
          TEST_URL = `ws://localhost:${TEST_PORT}`;
          console.log(`Test server running on port ${TEST_PORT}`);
        } else {
          throw new Error("Unable to determine server port");
        }
        resolve();
      });
    });

    server = httpServer;
  });

  // Cleanup after all tests
  afterAll(() => {
    // Close all client connections
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    // Close the server
    if (server) {
      server.close();
    }
  });

  // Test cases
  describe("Basic WebSocket Communication", () => {
    it("should connect to the WebSocket server", async () => {
      return new Promise<void>((resolve, reject) => {
        const client = new WebSocket(TEST_URL);
        clients.push(client);

        client.on("open", () => {
          expect(client.readyState).toBe(WebSocket.OPEN);
          client.close();
          resolve();
        });

        client.on("error", (error) => {
          reject(error);
        });
      });
    });

    it("should send and receive messages", async () => {
      return new Promise<void>((resolve, reject) => {
        const client = new WebSocket(TEST_URL);
        clients.push(client);
        const testMessage = {
          id: uuidv4(),
          type: "COMMAND" as const,
          agentRuntimeId: "test-client",
          timestamp: Date.now(),
          sequence: 1,
          payload: { command: "test" },
          metadata: {},
        };

        client.on("open", () => {
          client.send(JSON.stringify(testMessage));
        });

        client.on("message", (data) => {
          try {
            const response = JSON.parse(data.toString());
            expect(response.id).toBe(testMessage.id);
            expect(response.metadata.processed).toBe(true);
            client.close();
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        client.on("error", (error) => {
          reject(error);
        });
      });
    });
  });

  describe("EffectClient", () => {
    let EffectClient: any;
    beforeAll(async () => {
      // Dynamically import EffectClient to avoid hoisting issues
      const mod = await import("../test-client-effect");
      EffectClient = mod.EffectClient;
    });

    it("connects to the server (Effect)", async () => {
      const client = new EffectClient(TEST_URL);
      await expect(
        Effect.runPromise(client.connect()),
      ).resolves.toBeUndefined();
      client.close();
    });

    it("sends a ping and receives a response (Effect)", async () => {
      const client = new EffectClient(TEST_URL);
      await Effect.runPromise(client.connect());
      const response = (await Effect.runPromise(
        client.ping(),
      )) as WebSocketMessage;
      expect(response.type).toBe("COMMAND");
      expect(response.payload).toHaveProperty("type", "ping");
      client.close();
    });

    it("sends a command and receives a response (Effect)", async () => {
      const client = new EffectClient(TEST_URL);
      await Effect.runPromise(client.connect());
      const response = (await Effect.runPromise(
        client.sendCommand("process", { data: "Test data" }),
      )) as WebSocketMessage;
      expect(response.type).toBe("COMMAND");
      expect(response.payload).toHaveProperty("command", "process");
      client.close();
    });

    it("handles server connection errors (Effect)", async () => {
      const badUrl = "ws://localhost:65534"; // Unlikely to be open
      const client = new EffectClient(badUrl);
      await expect(Effect.runPromise(client.connect())).rejects.toThrow();
      client.close();
    });
  });

  describe("Error Handling", () => {
    it("should handle connection errors", async () => {
      return new Promise<void>((resolve, reject) => {
        // Use a port that's definitely not in use (very high port number)
        const client = new WebSocket("ws://localhost:65535");
        clients.push(client);

        let errorReceived = false;
        let closeReceived = false;

        client.on("error", (error) => {
          console.log("🔌 Connection error received:", error.message);
          errorReceived = true;
          checkCompletion();
        });

        client.on("close", (code, reason) => {
          console.log(`🔌 Connection closed: ${code} ${reason}`);
          closeReceived = true;
          checkCompletion();
        });

        function checkCompletion() {
          // Either error or close event should fire for failed connection
          if (errorReceived || closeReceived) {
            resolve();
          }
        }

        // Shorter timeout since connection should fail quickly
        setTimeout(() => {
          reject(new Error("Expected connection error did not occur"));
        }, 500);
      });
    });
  });
});
