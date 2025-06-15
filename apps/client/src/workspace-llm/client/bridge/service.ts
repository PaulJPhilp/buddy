import { WebSocketService } from "@/services/websocket/WebSocketService";
import { parseMessage } from "@buddy/protocol";
import type {
  EventPayload,
  WebSocketMessage,
} from "@buddy/protocol/src/WebSocketMessage";
import { Effect, Layer, Stream } from "effect";
import { workspaceStore } from "../../../workspace/workspaceStore";
import { UiEventPayload } from "../shared/schema";
import type { LlmWorkspaceBridgeApi } from "./api";
import { WorkspaceBridgeValidationError } from "./errors";

/** Type guard to check workspace event payload */
function isWorkspaceEvent(msg: WebSocketMessage): msg is WebSocketMessage & {
  payload: EventPayload;
} {
  return (
    msg.type === "EVENT" &&
    typeof msg.payload === "object" &&
    (msg.payload as EventPayload).eventType === "workspaceEvent"
  );
}

export class LlmWorkspaceBridge extends Effect.Service<LlmWorkspaceBridge>()(
  "LlmWorkspaceBridge",
  {
    scoped: Effect.gen(function* () {
      const ws = yield* WebSocketService;
      let isStarted = false;

      const start = () =>
        Effect.gen(function* () {
          if (isStarted) {
            return;
          }

          // Subscribe to WebSocket messages
          yield* Stream.runForEach(ws.messageStream, (message) =>
            Effect.try({
              try: () => {
                // Parse message
                const parsed = parseMessage(message);
                if (!isWorkspaceEvent(parsed)) {
                  return;
                }

                // Update workspace store
                const event = parsed.payload.data.event as UiEventPayload;
                workspaceStore.dispatch(event);
              },
              catch: (error) => {
                console.error("Failed to process message:", error);
              },
            }),
          );

          isStarted = true;
        });
      const stop = () =>
        Effect.succeed(() => {
          if (!isStarted) {
            return;
          }
          isStarted = false;
        });

      return {
        start,
        stop,
      };
    }),
    dependencies: [WebSocketService],
  },
) {}
