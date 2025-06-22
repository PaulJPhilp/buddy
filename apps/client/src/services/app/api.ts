import type { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { AppConfigLoadError } from "./errors";

export type AppServiceError = AppConfigLoadError;

export interface AppServiceApi {
  /**
   * Loads all chat app configurations from the public/configs directory
   */
  readonly getAll: () => Effect.Effect<ChatAppConfig[], AppServiceError>;

  /**
   * Gets a single chat app configuration by its ID
   */
  readonly getById: (id: string) => Effect.Effect<ChatAppConfig | undefined, AppServiceError>;

  /**
   * Creates a new chat app configuration (not implemented)
   */
  readonly create: (app: ChatAppConfig) => Effect.Effect<void>;

  /**
   * Updates an existing chat app configuration (not implemented)
   */
  readonly update: (id: string, patch: Partial<ChatAppConfig>) => Effect.Effect<void>;

  /**
   * Deletes a chat app configuration (not implemented)
   */
  readonly delete: (id: string) => Effect.Effect<void>;
}
