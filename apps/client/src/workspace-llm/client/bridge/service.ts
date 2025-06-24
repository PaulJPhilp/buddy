// LlmWorkspaceBridge service for processing workspace events from WebSocket
import { WebSocketService } from "@/services/websocket";
import { parseMessage } from "@buddy/protocol";
import type {
  EventPayload,
  WebSocketMessage,
} from "@buddy/protocol/src/WebSocketMessage";
import { Effect, Layer, Stream } from "effect";
import type { UIEvent } from "../../../workspace/types";
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

/** Transform external schema events to internal UIEvent format */
function transformEvent(externalEvent: UiEventPayload): UIEvent | null {
  switch (externalEvent.type) {
    case "CHAT_APP_ADDED": {
      // Transform tabId-based event to workspaceId-based event
      // For now, we'll use the current workspace or default workspace
      const currentState = workspaceStore.getSnapshot().context;
      const workspaceId =
        currentState.currentWorkspaceId || "default-workspace";

      // Create a default config for the chat app
      const config = {
        id: externalEvent.appId,
        name: `Chat App ${externalEvent.appId}`,
        agentId: "default-agent",
        theme: {},
      };

      const transformedEvent: UIEvent = {
        type: "CHAT_APP_ADDED",
        workspaceId,
        appId: externalEvent.appId,
        config,
      };

      return transformedEvent;
    }

    case "CHAT_APP_EXPANDED": {
      const currentState = workspaceStore.getSnapshot().context;
      const workspaceId =
        currentState.currentWorkspaceId || "default-workspace";

      const transformedEvent: UIEvent = {
        type: "CHAT_APP_EXPANDED",
        workspaceId,
        appId: externalEvent.appId,
      };

      return transformedEvent;
    }

    case "CHAT_APP_COMPACTED": {
      const currentState = workspaceStore.getSnapshot().context;
      const workspaceId =
        currentState.currentWorkspaceId || "default-workspace";

      const transformedEvent: UIEvent = {
        type: "CHAT_APP_COMPACTED",
        workspaceId,
        appId: externalEvent.appId,
      };

      return transformedEvent;
    }

    case "CHAT_APP_CLOSED": {
      const currentState = workspaceStore.getSnapshot().context;
      const workspaceId =
        currentState.currentWorkspaceId || "default-workspace";

      const transformedEvent: UIEvent = {
        type: "CHAT_APP_REMOVED",
        workspaceId,
        appId: externalEvent.appId,
      };

      return transformedEvent;
    }

    default:
      // Skip unhandled event types (like TAB_ADDED which aren't needed by workspace store)
      return null;
  }
}

export class LlmWorkspaceBridge extends Effect.Service<LlmWorkspaceBridge>()(
  "LlmWorkspaceBridge",
  {
    scoped: Effect.gen(function* () {
      console.log("[Bridge] Service construction started");
      let isStarted = false;
      let fiber = null;

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

          console.log("[Bridge] About to start stream processing");

          // Use a continuous stream processing approach
          fiber = yield* Effect.fork(
            Effect.gen(function* () {
              console.log("[Bridge] Stream processing fiber started");

              // Process the stream continuously
              yield* Stream.runForEach(ws.messageStream, (message) =>
                Effect.sync(() => {
                  console.log(
                    "[Bridge] [STREAM] Processing message:",
                    message.type,
                    message,
                  );
                  if (
                    message.type === "EVENT" &&
                    typeof message.payload === "object" &&
                    (message.payload as any).eventType === "workspaceEvent"
                  ) {
                    const externalEvent = message.payload.data.event;
                    console.log(
                      "[Bridge] [STREAM] Received external event:",
                      externalEvent.type,
                      externalEvent,
                    );

                    // Transform the event to internal format
                    const internalEvent = transformEvent(externalEvent);

                    if (internalEvent) {
                      console.log(
                        "[Bridge] [STREAM] Dispatching transformed event to workspaceStore:",
                        internalEvent.type,
                        internalEvent,
                      );
                      workspaceStore.send(internalEvent);
                      console.log(
                        "[Bridge] [STREAM] Event dispatched successfully:",
                        internalEvent.type,
                      );
                    } else {
                      console.log(
                        "[Bridge] [STREAM] Event transformation returned null, skipping:",
                        externalEvent.type,
                      );
                    }
                  }
                }),
              );
              console.log("[Bridge] Stream processing completed");
            }),
          );

          console.log("[Bridge] Stream processing fiber forked");

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

          // Interrupt the background fiber if it exists
          if (fiber) {
            yield* fiber.interrupt();
            fiber = null;
            console.log("[Bridge] stop: interrupted stream fiber");
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
