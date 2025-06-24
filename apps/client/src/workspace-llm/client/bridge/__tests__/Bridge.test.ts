import { createServer } from "node:http";
import { WebSocketService } from "@/services/websocket";
import { createMessage } from "@buddy/protocol";
import { Effect, Layer } from "effect";
import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";
import { workspaceStore } from "../../../../workspace/workspaceStore";
import { UiEventPayload } from "../../../shared/schema";
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

// Helper to create workspace event message
function mkMsg(event: UiEventPayload) {
  return createMessage("EVENT", {
    eventType: "workspaceEvent",
    data: { userId: "user-1", event },
    __tag: "EventPayload" as const,
  });
}

describe("LlmWorkspaceBridge (integration)", () => {
  beforeEach(() => {
    workspaceStore.send({ type: "RESET" });
  });

  it("dispatches event into store", async () => {
    // Use the same pattern as the working invalid test
    const AppLayer = Layer.merge(
      WebSocketService.Default,
      LlmWorkspaceBridge.Default,
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        console.log("[BridgeTest] Starting test within Effect runtime");

        // 1. Get services
        const wsService = yield* WebSocketService;
        const bridge = yield* LlmWorkspaceBridge;
        console.log("[BridgeTest] Got services");

        // 2. Connect WebSocket
        yield* wsService.connect(TEST_URL);
        console.log("[BridgeTest] Connected WebSocket");

        // 3. Start bridge
        yield* bridge.start();
        console.log("[BridgeTest] Started bridge");

        // 4. Send workspace event messages
        // First, send TAB_ADDED event
        const tabEvent: UiEventPayload = {
          type: "TAB_ADDED",
          tabId: "t0",
          name: "Test Tab",
        };
        const tabMessage = createMessage("EVENT", {
          eventType: "workspaceEvent",
          data: { userId: "user-1", event: tabEvent },
          __tag: "EventPayload" as const,
        });
        console.log("[BridgeTest] Sending TAB_ADDED message");
        yield* wsService.send(tabMessage);

        // Now send CHAT_APP_ADDED event
        const ev: UiEventPayload = {
          type: "CHAT_APP_ADDED",
          tabId: "t0",
          appId: "a1",
        };
        const message = createMessage("EVENT", {
          eventType: "workspaceEvent",
          data: { userId: "user-1", event: ev },
          __tag: "EventPayload" as const,
        });
        console.log("[BridgeTest] Sending CHAT_APP_ADDED message");
        yield* wsService.send(message);

        // 5. Wait for processing within the Effect runtime
        console.log("[BridgeTest] Waiting for messages to be processed...");
        yield* Effect.sleep("500 millis");

        // 6. Cleanup
        yield* wsService.disconnect();
        console.log("[BridgeTest] Disconnected WebSocket");
      }).pipe(Effect.provide(AppLayer), Effect.timeout("10 seconds")),
    );

    // 7. Verify store state after Effect completes
    const state = workspaceStore.getSnapshot().context;
    console.log("[BridgeTest] Final store state:", state);

    expect(state.chatApps).toBeDefined();
    expect(state.chatApps).toEqual({
      a1: {
        id: "a1",
        workspaceId: "default-workspace",
        status: "stashed",
        isArchived: false,
        lastActiveAt: expect.any(Date),
        config: {
          id: "a1",
          name: "Chat App a1",
          agentId: "default-agent",
          theme: {},
        },
      },
    });
  });
});
