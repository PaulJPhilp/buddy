import type { Effect } from "effect";
import type { UiEventPayload } from "../../shared/schema";
import type { WorkspaceEventPublishError } from "./errors";

export interface WorkspaceEventPublisherApi {
  /**
   * Publish a UI event to a specific user via WebSocket.
   */
  readonly publishEvent: (
    userId: string,
    event: UiEventPayload,
  ) => Effect.Effect<void, WorkspaceEventPublishError>;
}
