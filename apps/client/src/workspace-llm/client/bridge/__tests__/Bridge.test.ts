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
    // Use the real WebSocketService and connect to TEST_URL
    // 1. Create a shared WebSocketService layer
    // 2. Connect WebSocketService to TEST_URL and start LlmWorkspaceBridge
    // 3. Send a workspace event message
    // 4. Wait and verify store state

    console.log("[BridgeTest] Connecting WebSocketService to", TEST_URL);

    // Create a single shared layer
    const AppLayer = Layer.merge(
      WebSocketService.Default,
      LlmWorkspaceBridge.Default,
    );

    const { wsService, bridge } = await Effect.runPromise(
      Effect.gen(function* () {
        console.log("[BridgeTest] About to get WebSocketService");
        // Get the WebSocketService first and connect it
        const service = yield* WebSocketService;
        console.log(
          "[BridgeTest] Got WebSocketService instance:",
          (service as any).instanceId,
        );
        yield* service.connect(TEST_URL);
        console.log("[BridgeTest] Connected WebSocketService");

        // Now start the Bridge - it should get the same WebSocketService instance
        console.log("[BridgeTest] Starting LlmWorkspaceBridge");
        const b = yield* LlmWorkspaceBridge;
        yield* b.start();
        console.log("[BridgeTest] Started LlmWorkspaceBridge");

        return { wsService: service, bridge: b };
      }).pipe(Effect.provide(AppLayer)),
    );

    // 3. Send a workspace event message
    // First, send TAB_ADDED event so the tab exists
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
    console.log("[BridgeTest] Sending TAB_ADDED message:", tabMessage);
    await Effect.runPromise(wsService.send(tabMessage));
    console.log("[BridgeTest] Sent TAB_ADDED message");

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
    console.log("[BridgeTest] Sending CHAT_APP_ADDED message:", message);
    await Effect.runPromise(wsService.send(message));
    console.log("[BridgeTest] Sent CHAT_APP_ADDED message");

    // 4. Wait longer and verify store state
    console.log("[BridgeTest] Waiting for messages to be processed...");
    await Effect.runPromise(Effect.sleep("500 millis"));

    let state = workspaceStore.getSnapshot().context;
    console.log("[BridgeTest] Current store state:", state);

    // If no messages received, wait a bit more
    if (Object.keys(state.chatApps).length === 0) {
      console.log("[BridgeTest] No messages received yet, waiting longer...");
      await Effect.runPromise(Effect.sleep("1000 millis"));
      state = workspaceStore.getSnapshot().context;
      console.log("[BridgeTest] Final store state:", state);
    }

    expect(state.chatApps).toBeDefined();
    expect(state.chatApps).toEqual({
      a1: {
        id: "a1",
        tabId: "t0",
        status: "compact",
      },
    });
  });
});
