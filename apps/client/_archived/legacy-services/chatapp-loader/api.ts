import type { ChatAppEntry } from "@/workspace/types";
import type { Effect } from "effect";
import type { ChatError } from "./errors";

export interface ChatAppLoaderService {
  readonly getAppsForWorkspace: (
    workspaceId: string,
  ) => Effect.Effect<ChatAppEntry[], ChatError>;
}
