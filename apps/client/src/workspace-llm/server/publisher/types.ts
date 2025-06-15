import type { UiEventPayload } from "../../shared/schema";

export interface WorkspaceEventEnvelope {
  readonly eventType: "workspaceEvent";
  readonly userId: string;
  readonly event: UiEventPayload;
}
