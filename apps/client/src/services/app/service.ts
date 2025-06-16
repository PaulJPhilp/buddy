import { ChatAppConfig } from "@/types/global";
import { Effect, Schema } from "effect";
import { AgentService, AgentServiceApi } from "../agent";
import { ConfigLifecycleService } from "../config-lifecycle";
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
    const configLifecycle = yield* ConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;

    console.log("✅ AppService: All dependencies obtained");

    // Initialize ConfigLifecycleService
    yield* configLifecycle.loadConfigs().pipe(
      Effect.catchAll((e) => {
        console.warn("Failed to load configs on AppService init:", e);
        return Effect.succeed([]);
      }),
    );

    const serviceApi: AppServiceApi = {
      getAll: () =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getAll called");

          // Delegate to ConfigLifecycleService with graceful error handling
          const configs = yield* configLifecycle.loadConfigs().pipe(
            Effect.catchAll((e) => {
              console.warn(
                "Failed to load configs in getAll, returning empty array:",
                e,
              );
              return Effect.succeed([]);
            }),
          );

          console.log(
            "✅ AppService: getAll completed with",
            configs.length,
            "configs",
          );
          return configs;
        }),

      getById: (id: string) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getById called for", id);

          // Delegate to ConfigLifecycleService with graceful error handling
          const configs = yield* configLifecycle.loadConfigs().pipe(
            Effect.catchAll((e) => {
              console.warn(
                "Failed to load configs in getById, returning empty array:",
                e,
              );
              return Effect.succeed([]);
            }),
          );
          const config = configs.find((c) => c.id === id);

          console.log("✅ AppService: getById result:", !!config);
          return config;
        }),

      create: (app: ChatAppConfig) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: create called for", app.id);

          // AppService validation (business logic)
          const validApp = yield* ChatAppConfig.parseEffect(app).pipe(
            Effect.mapError(
              (cause) =>
                new AppConfigValidationError({
                  message: "Invalid app config format",
                  cause,
                }),
            ),
          );

          yield* validateReferences(agentService, toolbarService, validApp);

          // Delegate to ConfigLifecycleService
          yield* configLifecycle.addConfig(validApp).pipe(
            Effect.mapError(
              (cause) =>
                new AppConfigPersistenceError({
                  message: "Failed to save app config",
                  operation: "save",
                  cause,
                }),
            ),
          );

          console.log("✅ AppService: create completed for", app.id);
        }),

      update: (id: string, patch: Partial<ChatAppConfig>) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: update called for", id);

          // Delegate to ConfigLifecycleService (use updateConfigImmediate for compatibility)
          yield* configLifecycle.updateConfigImmediate(id, patch).pipe(
            Effect.mapError(
              (cause) =>
                new AppConfigPersistenceError({
                  message: "Failed to update app config",
                  operation: "save",
                  cause,
                }),
            ),
          );

          console.log("✅ AppService: update completed for", id);
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: delete called for", id);

          // Delegate to ConfigLifecycleService
          yield* configLifecycle.deleteConfig(id).pipe(
            Effect.mapError(
              (cause) =>
                new AppConfigPersistenceError({
                  message: "Failed to delete app config",
                  operation: "delete",
                  cause,
                }),
            ),
          );

          console.log("✅ AppService: delete completed for", id);
        }),
    };

    console.log("✅ AppService: Facade service initialized");
    return serviceApi;
  }),
  dependencies: [
    ConfigLifecycleService.Default,
    AgentService.Default,
    ToolbarService.Default,
  ],
}) {}
