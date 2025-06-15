import { WebSocketService } from "@/services/websocket/WebSocketService";
import { TEST_WS_URL } from "@/services/websocket/__tests__/setup";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { UiEventPayload } from "../../shared/schema";
import { WorkspaceEventPublisher } from "../service";

describe("WorkspaceEventPublisher", () => {
  it("publishes event without throwing", async () => {
    const layer = Layer.merge(
      WebSocketService.Default,
      WorkspaceEventPublisher.Default,
    );

    const testEvent: UiEventPayload = {
      type: "TAB_ADDED",
      tabId: "t1",
      name: "Tab",
    };

    await Effect.runPromise(
      Effect.gen(function* () {
        const wsService = yield* WebSocketService;
        const pub = yield* WorkspaceEventPublisher;

        // Connect to test server
        yield* wsService.connect(TEST_WS_URL);

        // Publish event
        yield* pub.publishEvent("user-1", testEvent);

        // Cleanup
        yield* wsService.disconnect();
      }).pipe(Effect.provide(layer)),
    );

    // If we get here without throwing, the test passes
    expect(true).toBe(true);
  });
});
