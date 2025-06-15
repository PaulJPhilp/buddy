import { ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { AppServiceError } from "./errors";

export interface AppServiceApi {
  readonly getAll: () => Effect.Effect<
    readonly ChatAppConfig[],
    AppServiceError
  >;
  readonly getById: (
    id: string,
  ) => Effect.Effect<ChatAppConfig | undefined, AppServiceError>;
  readonly create: (app: ChatAppConfig) => Effect.Effect<void, AppServiceError>;
  readonly update: (
    id: string,
    app: Partial<ChatAppConfig>,
  ) => Effect.Effect<void, AppServiceError>;
  readonly delete: (id: string) => Effect.Effect<void, AppServiceError>;
}
