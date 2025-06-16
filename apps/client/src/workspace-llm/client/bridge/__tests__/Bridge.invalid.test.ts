import { createServer } from "node:http";
import { WebSocketService } from "@/services/websocket";
import { workspaceStore } from "@/workspace/workspaceStore";
import { Effect, Layer } from "effect";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";
import { LlmWorkspaceBridge } from "../service";

let server: any;
let TEST_PORT: number;
let TEST_URL: string;

beforeAll(async () => {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      ws.send(data); // Echo for test
    });
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      const address = httpServer.address();
      if (typeof address === "object" && address && "port" in address) {
        TEST_PORT = address.port;
        TEST_URL = `ws://localhost:${TEST_PORT}`;
      }
      resolve();
    });
  });

  server = httpServer;
});

afterAll(() => {
  if (server) server.close();
});

describe("Bridge invalid payload (integration)", () => {
  beforeEach(() => {
    workspaceStore.send({ type: "RESET" });
  });

  it("does not crash on malformed payload", async () => {
    // Compose the layers properly - LlmWorkspaceBridge already includes WebSocketService
    const AppLayer = Layer.merge(
      WebSocketService.Default,
      LlmWorkspaceBridge.Default,
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        // 1. Get services
        const wsService = yield* WebSocketService;
        const bridge = yield* LlmWorkspaceBridge;

        // 2. Connect WebSocket
        yield* wsService.connect(TEST_URL);

        // 3. Start bridge
        yield* bridge.start();

        // 4. Send malformed message
        const malformedMessage = { type: "invalid" };
        yield* wsService.send(malformedMessage);

        // 5. Wait briefly for processing
        yield* Effect.sleep("50 millis");

        // 6. Cleanup - disconnect WebSocket
        yield* wsService.disconnect();
      }).pipe(
        Effect.provide(AppLayer),
        Effect.timeout("5 seconds"), // Add timeout to prevent hanging
      ),
    );

    // 7. Verify store state remains unchanged
    const state = workspaceStore.getSnapshot().context;
    expect(state.chatApps).toEqual({});
  });
});
