import { ChatAppConfig } from "@/types/global";
import { Effect, Schema } from "effect";
import { AgentService, AgentServiceApi } from "../agent";
// import { ConfigLifecycleService } from "../config-lifecycle";
import { ToolbarService, ToolbarServiceApi } from "../toolbar";
import type { AppServiceApi } from "./api";
import {
  AppConfigPersistenceError,
  AppConfigReferenceError,
  AppConfigValidationError,
} from "./errors";

/**
 * AppService facade implementation using ConfigLifecycleService
 *
 * This facade maintains the existing AppServiceApi interface while delegating
 * file operations to ConfigLifecycleService. It handles business logic like
 * reference validation and theme management.
 */

// Business logic: Validate references to other services
const validateReferences = (
  agents: AgentServiceApi,
  toolbars: ToolbarServiceApi,
  app: ChatAppConfig,
) =>
  Effect.all([
    agents.getById(app.agentId),
    toolbars.getById(app.toolbarId),
  ]).pipe(
    Effect.map((_) => void 0),
    Effect.mapError(
      (cause) =>
        new AppConfigReferenceError({
          message: "Failed to validate app config references",
          referenceType: "agent", // Could be more specific
          referenceId: app.agentId,
          cause,
        }),
    ),
  );

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    console.log("🔧 AppService: Starting facade service initialization");

    // Get all dependencies
    // const configLifecycle = yield* ConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;

    console.log("✅ AppService: All dependencies obtained");

    // Initialize ConfigLifecycleService (temporarily disabled)
    // yield* configLifecycle.loadConfigs().pipe(
    //   Effect.catchAll((e) => {
    //     console.warn("Failed to load configs on AppService init:", e);
    //     return Effect.succeed([]);
    //   }),
    // );

    const serviceApi: AppServiceApi = {
      getAll: () =>
        Effect.tryPromise({
          try: () => fetch("/api/configs").then((res) => res.json()),
          catch: (e) => new Error(`Failed to fetch chat app configs: ${e}`),
        }).pipe(
          Effect.map((data) => {
            // Optionally validate/parse each config here
            return Array.isArray(data) ? (data as ChatAppConfig[]) : [];
          }),
        ),

      getById: (id: string) => Effect.succeed(undefined),

      create: (app: ChatAppConfig) => Effect.succeed(undefined),

      update: (id: string, patch: Partial<ChatAppConfig>) =>
        Effect.succeed(undefined),

      delete: (id: string) => Effect.succeed(undefined),
    };

    console.log("✅ AppService: Facade service initialized");
    return serviceApi;
  }),
  dependencies: [
    // ConfigLifecycleService.Default,
    AgentService.Default,
    ToolbarService.Default,
  ],
}) {}
