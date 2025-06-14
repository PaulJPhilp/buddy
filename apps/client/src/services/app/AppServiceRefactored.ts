import { Effect, Schema } from "effect";
import {
  ChatAppConfig,
  ChatAppConfigSchema,
} from "../../schemas/ChatAppConfigSchema";
import { defaultChatTheme } from "../../themes/themeTypes";
import { AgentService, AgentServiceApi } from "../agent";
import { ConfigLifecycleService } from "../config-lifecycle";
import { ThemesService, ThemesServiceApi } from "../themes/ThemesService";
import { ToolbarService, ToolbarServiceApi } from "../toolbar";

/**
 * @file Refactored AppService using facade pattern with ConfigLifecycleService
 * @module services/app/AppServiceRefactored
 *
 * This version delegates file operations to ConfigLifecycleService while
 * maintaining the existing AppServiceApi interface for backward compatibility.
 */

export interface AppServiceApi {
  getAll(): Effect.Effect<readonly ChatAppConfig[]>;
  getById(id: string): Effect.Effect<ChatAppConfig | undefined>;
  create(app: ChatAppConfig): Effect.Effect<void>;
  update(id: string, app: Partial<ChatAppConfig>): Effect.Effect<void>;
  delete(id: string): Effect.Effect<void>;
}

// Helper function to validate references (unchanged)
const validateReferences = (
  agents: AgentServiceApi,
  toolbars: ToolbarServiceApi,
  themes: ThemesServiceApi,
  app: ChatAppConfig,
) =>
  Effect.all([
    Effect.flatMap(agents.getById(app.agentId), (a) =>
      a ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid agentId")),
    ),
    Effect.flatMap(toolbars.getById(app.toolbarId), (t) =>
      t ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid toolbarId")),
    ),
    Effect.flatMap(
      themes
        .getTheme(app.themeId)
        .pipe(Effect.catchAll(() => Effect.succeed(undefined))),
      (th) =>
        th ? Effect.succeed(void 0) : Effect.fail(new Error("Invalid themeId")),
    ),
  ]).pipe(Effect.map((_) => void 0));

// Helper to ensure theme exists (business logic)
const ensureThemeExists = (
  themesService: ThemesServiceApi,
  themeId: string,
  configName: string,
) =>
  Effect.gen(function* () {
    const theme = yield* themesService.getTheme(themeId);
    if (!theme) {
      console.log(`Creating default theme for ${themeId}`);
      yield* themesService.setTheme(themeId, {
        ...defaultChatTheme,
        themeName: configName || "Default Theme",
      });
    }
  });

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    console.log("🔧 AppService: Starting facade service initialization");

    // Get all dependencies
    const configLifecycle = yield* ConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;
    const themesService = yield* ThemesService;

    console.log("✅ AppService: All dependencies obtained");

    // Business logic: Validate and enrich configs
    const validateAndEnrichConfigs = (configs: ChatAppConfig[]) =>
      Effect.gen(function* () {
        for (const config of configs) {
          // Ensure theme exists for each config
          yield* ensureThemeExists(themesService, config.themeId, config.name);
        }
        return configs;
      });

    // Facade API implementation
    const serviceApi = {
      getAll: () =>
        Effect.gen(function* () {
          console.log(
            "🔧 AppService: getAll called (delegating to ConfigLifecycleService)",
          );

          // Delegate to ConfigLifecycleService
          const configs = yield* configLifecycle.loadConfigs();

          // Apply AppService business logic
          const enrichedConfigs = yield* validateAndEnrichConfigs(configs);

          console.log(
            "✅ AppService: getAll completed with",
            enrichedConfigs.length,
            "configs",
          );
          return enrichedConfigs;
        }),

      getById: (id: string) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getById called for", id);

          // Load all configs and find the one we want
          const configs = yield* configLifecycle.loadConfigs();
          const config = configs.find((c) => c.id === id);

          if (config) {
            // Ensure theme exists for this config
            yield* ensureThemeExists(
              themesService,
              config.themeId,
              config.name,
            );
          }

          console.log("✅ AppService: getById result:", !!config);
          return config;
        }),

      create: (app: ChatAppConfig) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: create called for", app.id);

          // AppService validation (business logic)
          const validApp = yield* Schema.decode(ChatAppConfigSchema)(app);
          yield* validateReferences(
            agentService,
            toolbarService,
            themesService,
            validApp,
          );

          // Delegate to ConfigLifecycleService
          yield* configLifecycle.addConfig(validApp);

          // AppService post-processing
          yield* ensureThemeExists(
            themesService,
            validApp.themeId,
            validApp.name,
          );

          console.log("✅ AppService: create completed for", app.id);
        }).pipe(
          Effect.catchAll((e) => {
            console.warn("Failed to create app config:", e);
            return Effect.void;
          }),
        ),

      update: (id: string, patch: Partial<ChatAppConfig>) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: update called for", id);

          // Delegate to ConfigLifecycleService
          yield* configLifecycle.updateConfig(id, patch);

          // If theme was updated, ensure it exists
          if (patch.themeId) {
            yield* ensureThemeExists(
              themesService,
              patch.themeId,
              patch.name || "Updated Config",
            );
          }

          console.log("✅ AppService: update completed for", id);
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: delete called for", id);

          // Delegate to ConfigLifecycleService
          yield* configLifecycle.deleteConfig(id);

          console.log("✅ AppService: delete completed for", id);
        }),
    } satisfies AppServiceApi;

    console.log("✅ AppService: Facade service initialized");
    return serviceApi;
  }),
  dependencies: [
    ConfigLifecycleService.Default,
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
  ],
}) {}
