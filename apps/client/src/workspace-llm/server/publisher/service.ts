import { WebSocketService } from "@/services/websocket";
import { createMessage } from "@buddy/protocol";
import { Effect } from "effect";
import { encodeUiEvent } from "../../shared/schema";
import type { WorkspaceEventPublisherApi } from "./api";
import { WorkspaceEventPublishError } from "./errors";

export class WorkspaceEventPublisher extends Effect.Service<WorkspaceEventPublisherApi>()(
  "WorkspaceEventPublisher",
  {
    scoped: Effect.gen(function* () {
      const wsService = yield* WebSocketService;

      const publishEvent: WorkspaceEventPublisherApi["publishEvent"] = (
        userId,
        event,
      ) =>
        Effect.gen(function* () {
          // Encode event to plain object
          const encoded = encodeUiEvent(event);

          const envelope = createMessage("EVENT", {
            eventType: "workspaceEvent",
            data: {
              userId,
              event: encoded,
            },
            __tag: "EventPayload" as const,
          });

          yield* wsService.send(envelope).pipe(
            Effect.mapError(
              (cause) =>
                new WorkspaceEventPublishError({
                  message: "Failed to publish workspace event",
                  cause,
                }),
            ),
          );
        });

      return {
        publishEvent,
      } satisfies WorkspaceEventPublisherApi;
    }),
    dependencies: [WebSocketService.Default],
  },
) {}
