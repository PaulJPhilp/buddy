console.log("[Bridge] service.ts file loaded - VERSION 2024-01-16-15:30");
import { WebSocketService } from "@/services/websocket";
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
  console.log("[Bridge] isWorkspaceEvent check:");
  console.log("  msg.type:", msg.type);
  console.log("  typeof msg.payload:", typeof msg.payload);
  console.log("  msg.payload:", msg.payload);
  console.log("  msg.payload.eventType:", (msg.payload as any)?.eventType);

  const result =
    msg.type === "EVENT" &&
    typeof msg.payload === "object" &&
    (msg.payload as EventPayload).eventType === "workspaceEvent";

  console.log("  isWorkspaceEvent result:", result);
  return result;
}

export class LlmWorkspaceBridge extends Effect.Service<LlmWorkspaceBridge>()(
  "LlmWorkspaceBridge",
  {
    scoped: Effect.gen(function* () {
      console.log("[Bridge] Service construction started");
      let isStarted = false;
      let messageCallback: ((message: WebSocketMessage) => void) | null = null;

      const startWithWebSocket = (ws: WebSocketService) => {
        console.log(
          "[Bridge] [startWithWebSocket] method called, creating Effect",
        );
        return Effect.gen(function* () {
          console.log("[Bridge] [startWithWebSocket] Effect generator entered");
          if (isStarted) {
            console.log(
              "[Bridge] startWithWebSocket: already started, returning Effect.void",
            );
            return yield* Effect.void;
          }

          console.log(
            "[Bridge] Using provided WebSocketService instance:",
            (ws as any).instanceId,
          );

          // Create message callback function
          messageCallback = (message: WebSocketMessage) => {
            console.log(
              "[Bridge] [CALLBACK] Received message:",
              message.id,
              message.type,
            );

            // Message is already parsed by WebSocketService, no need to parse again
            if (!isWorkspaceEvent(message)) {
              console.log(
                "[Bridge] [CALLBACK] Not a workspace event, ignoring:",
                message.type,
                (message.payload as any)?.eventType,
              );
              return;
            }

            const event = message.payload.data.event;
            console.log(
              "[Bridge] [CALLBACK] Dispatching event to workspaceStore:",
              event.type,
              event,
            );
            workspaceStore.send(event);
            console.log(
              "[Bridge] [CALLBACK] Event dispatched successfully:",
              event.type,
            );
          };

          // Register the callback with WebSocketService
          console.log(
            "[Bridge] [startWithWebSocket] Registering message callback",
          );
          yield* ws.addMessageCallback(messageCallback);
          console.log(
            "[Bridge] [startWithWebSocket] Message callback registered",
          );

          isStarted = true;
          console.log(
            "[Bridge] [startWithWebSocket] method returning Effect.void",
          );
          return yield* Effect.void;
        });
      };

      const start = () => {
        console.log(
          "[Bridge] [start] method called - getting WebSocketService from context",
        );
        return Effect.gen(function* () {
          const ws = yield* WebSocketService;
          console.log(
            "[Bridge] [start] Got WebSocketService from context:",
            (ws as any).instanceId,
          );
          return yield* startWithWebSocket(ws);
        });
      };

      const stop = () =>
        Effect.gen(function* () {
          console.log("[Bridge] stop called, isStarted:", isStarted);
          if (!isStarted) {
            console.log("[Bridge] stop: already stopped, returning void");
            return;
          }

          // Remove the message callback if it exists
          if (messageCallback) {
            const ws = yield* WebSocketService;
            yield* ws.removeMessageCallback(messageCallback);
            messageCallback = null;
            console.log("[Bridge] stop: removed message callback");
          }

          isStarted = false;
          console.log("[Bridge] stop: stopped");
        });

      const noop = () => {
        console.log("[Bridge] noop called");
        return Effect.void;
      };

      const serviceObj = {
        noop,
        start,
        startWithWebSocket,
      } satisfies LlmWorkspaceBridgeApi;
      console.log("[Bridge] Service construction returning:", serviceObj);
      return serviceObj;
    }),
    dependencies: [WebSocketService.Default],
  },
) {}
