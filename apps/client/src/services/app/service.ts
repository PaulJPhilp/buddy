import { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { AppServiceApi } from "./api";

/**
 * Minimal AppService for fast loading during development
 * This bypasses the slow dependency initialization to get tests working
 */
export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  effect: Effect.succeed({
    getAll: () => {
      console.log(
        "🔧 AppService: getAll() called - returning empty array (fast mode)",
      );
      return Effect.succeed([]);
    },

    getById: (id: string) => {
      return Effect.succeed(undefined);
    },

    create: (app: ChatAppConfig) => Effect.succeed(undefined),

    update: (id: string, patch: Partial<ChatAppConfig>) =>
      Effect.succeed(undefined),

    delete: (id: string) => Effect.succeed(undefined),
  }),
  dependencies: [], // No dependencies = fast loading
}) {}
