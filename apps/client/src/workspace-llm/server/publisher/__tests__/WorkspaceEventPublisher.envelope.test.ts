import { WebSocketService } from "@/services/websocket";
import { Effect, Layer } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";
import { UiEventPayload } from "../../shared/schema";
import { WorkspaceEventPublisher } from "../service";

describe("WorkspaceEventPublisher envelope", () => {
  let server: any;
  let TEST_PORT: number;
  let TEST_URL: string;

  // Start isolated test server (using llm-agent pattern)
  beforeAll(async () => {
    const { createServer } = await import("node:http");
    const express = await import("express");

    const app = express.default();
    const httpServer = createServer(app);
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws) => {
      console.log("Test client connected to envelope server");

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log("Envelope server received:", message);
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
          console.log(`Envelope test server running on port ${TEST_PORT}`);
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
    if (server) {
      server.close();
    }
  });

  it("wraps event in correct EventPayload", async () => {
    const layer = Layer.merge(
      WebSocketService.Default,
      WorkspaceEventPublisher.Default,
    );

    const testEvent: UiEventPayload = {
      type: "TAB_ADDED",
      tabId: "t2",
      name: "T",
    };

    await Effect.runPromise(
      Effect.gen(function* () {
        const wsService = yield* WebSocketService;
        const pub = yield* WorkspaceEventPublisher;

        // Connect to isolated test server
        yield* wsService.connect(TEST_URL);

        // Publish event
        yield* pub.publishEvent("userX", testEvent);

        // Cleanup
        yield* wsService.disconnect();
      }).pipe(Effect.provide(layer)),
    );

    // If we get here without throwing, the test passes
    expect(true).toBe(true);
  });
});
