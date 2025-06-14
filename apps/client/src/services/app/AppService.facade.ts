import { Chunk, Effect, Option, Schema } from "effect";
import {
  ChatAppConfig,
  ChatAppConfigSchema,
} from "../../schemas/ChatAppConfigSchema";
import { defaultChatTheme } from "../../themes/themeTypes";
import { AgentService, AgentServiceApi } from "../agent";
import { EnhancedConfigLifecycleService } from "../config-lifecycle";
import { ThemesService, ThemesServiceApi } from "../themes/ThemesService";
import { ToolbarService, ToolbarServiceApi } from "../toolbar";

/**
 * @file AppService facade implementation using ConfigLifecycleService
 * @module services/app/AppService
 *
 * This facade maintains the existing AppServiceApi interface while delegating
 * file operations to ConfigLifecycleService. It handles business logic like
 * reference validation and theme management.
 */

export interface AppServiceApi {
  getAll(): Effect.Effect<readonly ChatAppConfig[]>;
  getById(id: string): Effect.Effect<ChatAppConfig | undefined>;
  create(app: ChatAppConfig): Effect.Effect<void>;
  update(id: string, app: Partial<ChatAppConfig>): Effect.Effect<void>;
  delete(id: string): Effect.Effect<void>;
}

// Business logic: Validate references to other services
const validateReferences = (
  agents: AgentServiceApi,
  toolbars: ToolbarServiceApi,
  themes: ThemesServiceApi,
  app: ChatAppConfig,
) =>
  Effect.all([
    agents.getById(app.agentId),
    toolbars.getById(app.toolbarId),
    themes.getTheme(app.themeId),
  ]).pipe(Effect.map((_) => void 0));

// Business logic: Ensure theme exists for config
const ensureThemeExists = (
  themesService: ThemesServiceApi,
  themeId: string,
  configName?: string,
) =>
  Effect.gen(function* () {
    const theme = yield* themesService.getTheme(themeId);
    if (!theme) {
      console.log(`🔧 AppService: Creating default theme for ${themeId}`);
      yield* themesService.setTheme(themeId, {
        ...defaultChatTheme,
        themeName: configName || "Default Theme",
      });

      // Save the newly created theme
      yield* themesService.saveThemes({ chatIds: [themeId] }).pipe(
        Effect.catchAll((e) => {
          console.warn(`Failed to save theme ${themeId}:`, e);
          return Effect.void;
        }),
      );
      console.log(`✅ AppService: Default theme created for ${themeId}`);
    }
  });

// Business logic: Validate and enrich configs with themes
const validateAndEnrichConfigs = (
  themesService: ThemesServiceApi,
  configs: ChatAppConfig[],
) =>
  Effect.gen(function* () {
    for (const config of configs) {
      yield* ensureThemeExists(themesService, config.themeId, config.name);
    }
    return configs;
  });

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    console.log("🔧 AppService: Starting facade service initialization");

    // Get all dependencies
    const configLifecycle = yield* EnhancedConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;
    const themesService = yield* ThemesService;

    console.log("✅ AppService: All dependencies obtained");

    // Initialize ConfigLifecycleService
    yield* configLifecycle.loadConfigs().pipe(
      Effect.catchAll((e) => {
        console.warn("Failed to load configs on AppService init:", e);
        return Effect.succeed([]);
      }),
    );

    const serviceApi = {
      getAll: () =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getAll called");

          // Delegate to ConfigLifecycleService
          const configs = yield* configLifecycle.loadConfigs();

          // Apply business logic (theme enrichment, validation)
          const enrichedConfigs = yield* validateAndEnrichConfigs(
            themesService,
            configs,
          );

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

          // Delegate to ConfigLifecycleService
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
    EnhancedConfigLifecycleService.Default,
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
  ],
}) {}
