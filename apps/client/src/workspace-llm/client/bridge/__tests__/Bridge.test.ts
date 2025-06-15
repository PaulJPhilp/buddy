import { WebSocketService } from "@/services/websocket/WebSocketService";
import { createMessage } from "@buddy/protocol";
import { Effect, Layer, Queue, Stream } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { workspaceStore } from "../../../../workspace/workspaceStore";
import { UiEventPayload } from "../../shared/schema";
import { LlmWorkspaceBridge } from "../service";
import { TEST_WS_URL } from "./setup";

// Helper to create workspace event message
function mkMsg(event: UiEventPayload) {
  return createMessage("EVENT", {
    eventType: "workspaceEvent",
    data: { userId: "user-1", event },
    __tag: "EventPayload" as const,
  });
}

describe("LlmWorkspaceBridge", () => {
  let messageQueue: Queue.Queue<ReturnType<typeof mkMsg>>;
  let layer: Layer.Layer<never, never, WebSocketService | LlmWorkspaceBridge>;

  beforeEach(async () => {
    // Reset store
    workspaceStore.send({ type: "RESET" });

    // Create fresh message queue for each test
    messageQueue = await Effect.runPromise(
      Queue.unbounded<ReturnType<typeof mkMsg>>(),
    );

    // Create mock WebSocketService
    const MockWebSocketService = Effect.gen(function* () {
      return {
        connect: () => Effect.unit,
        disconnect: () => Effect.unit,
        send: () => Effect.unit,
        messageStream: Stream.fromQueue(messageQueue),
        isConnected: true,
      };
    });

    // Create layer with mock service
    layer = Layer.merge(
      Layer.succeed(WebSocketService, MockWebSocketService),
      LlmWorkspaceBridge.Default,
    );
  });

  it("dispatches event into store", async () => {
    const ev: UiEventPayload = {
      type: "CHAT_APP_ADDED",
      tabId: "t0",
      appId: "a1",
    };

    await Effect.runPromise(
      Effect.gen(function* () {
        // Start bridge
        const bridge = yield* LlmWorkspaceBridge;
        yield* bridge.start();

        // Send test event
        yield* Queue.offer(messageQueue, mkMsg(ev));

        // Allow time for event processing
        yield* Effect.sleep("100 millis");

        // Verify store state
        const state = workspaceStore.getSnapshot().context;
        expect(state.chatApps).toBeDefined();
        expect(state.chatApps).toEqual({
          a1: {
            tabId: "t0",
            appId: "a1",
          },
        });
      }).pipe(Effect.provide(layer)),
    );
  });
});
