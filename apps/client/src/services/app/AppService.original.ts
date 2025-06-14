import { Chunk, Effect, Option, Ref, Schema } from "effect";
import {
  ChatAppConfig,
  ChatAppConfigSchema,
} from "../../schemas/ChatAppConfigSchema";

import { AgentService, AgentServiceApi } from "../agent";
import { ThemesService, ThemesServiceApi } from "../themes/ThemesService";
import { ToolbarService, ToolbarServiceApi } from "../toolbar";

/**
 * @file Implements the AppService which provides access to chat app configs.
 * @module services/app/AppService
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!! WARNING: This file uses the Effect.Service pattern and MUST NOT    !!!
 * !!! be modified by AI agents unless explicitly instructed. The pattern!!!
 * !!! used here is the canonical implementation.                        !!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

export interface AppServiceApi {
  getAll(): Effect.Effect<readonly ChatAppConfig[]>;
  getById(id: string): Effect.Effect<ChatAppConfig | undefined>;
  create(app: ChatAppConfig): Effect.Effect<void>;
  update(id: string, app: Partial<ChatAppConfig>): Effect.Effect<void>;
  delete(id: string): Effect.Effect<void>;
}

// Helper function to validate references
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

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    console.log("🔧 AppService: Starting service initialization");

    console.log("🔧 AppService: Getting AgentService");
    const agentService = yield* AgentService;
    console.log("✅ AppService: AgentService obtained:", !!agentService);

    console.log("🔧 AppService: Getting ToolbarService");
    const toolbarService = yield* ToolbarService;
    console.log("✅ AppService: ToolbarService obtained:", !!toolbarService);

    console.log("🔧 AppService: Getting ThemesService");
    const themesService = yield* ThemesService;
    console.log("✅ AppService: ThemesService obtained:", !!themesService);

    // No longer using localStorage for persistence
    console.log("🔧 AppService: Using in-memory storage only");

    // Helper to return empty data (no localStorage)
    const loadFromStorage = Effect.sync(() => {
      console.log("🔧 AppService: loadFromStorage called (in-memory only)");
      return Chunk.empty<ChatAppConfig>();
    });
    console.log(
      "🔧 AppService: loadFromStorage function created:",
      !!loadFromStorage,
    );

    // Helper to save (no-op since we're not using localStorage)
    const saveToStorage = (chunk: Chunk.Chunk<ChatAppConfig>) =>
      Effect.sync(() => {
        console.log("🔧 AppService: saveToStorage called (no-op)");
        // No longer saving to localStorage
      });

    // Initialize ref with empty data
    console.log("🔧 AppService: Creating refs");
    const ref = yield* Ref.make<Chunk.Chunk<ChatAppConfig>>(Chunk.empty());
    console.log("🔧 AppService: ref created:", !!ref);
    const isLoaded = yield* Ref.make(false);
    console.log("🔧 AppService: isLoaded created:", !!isLoaded);

    // Lazy load from localStorage on first access
    const ensureLoaded = Effect.gen(function* () {
      console.log("🔧 AppService: ensureLoaded called");
      const loaded = yield* Ref.get(isLoaded);
      console.log("🔧 AppService: isLoaded value:", loaded);
      if (!loaded) {
        console.log("🔧 AppService: Loading data from storage");
        const data = yield* loadFromStorage;
        console.log("🔧 AppService: Data loaded:", data);
        yield* Ref.set(ref, data);
        console.log("🔧 AppService: Data set in ref");
        yield* Ref.set(isLoaded, true);
        console.log("🔧 AppService: isLoaded set to true");
      }
    });
    console.log(
      "🔧 AppService: ensureLoaded function created:",
      !!ensureLoaded,
    );

    // After ensureLoaded, check integrity of all configs and themes
    const checkConfigIntegrity = Effect.gen(function* () {
      console.log("🔧 AppService: Starting integrity check...");
      yield* ensureLoaded;
      const chunk = yield* Ref.get(ref);
      const configs = Chunk.toArray(chunk);
      console.log(
        `🔧 AppService: Checking integrity for ${configs.length} configs`,
      );
      const themesService = yield* ThemesService;

      // Load themes (no longer from localStorage)
      console.log("🔧 AppService: Loading themes...");
      yield* themesService.loadThemes().pipe(
        Effect.catchAll((e) => {
          console.warn("Failed to load themes:", e);
          return Effect.succeed({});
        }),
      );
      console.log("✅ AppService: Themes loaded");

      for (const config of configs) {
        console.log(
          `🔧 AppService: Checking theme for config ${config.id}, themeId: ${config.themeId}`,
        );
        const theme = yield* themesService.getTheme(config.themeId);
        console.log(
          `🔧 AppService: Theme found for ${config.themeId}:`,
          !!theme,
        );
        if (!theme) {
          console.log(
            `🔧 AppService: Creating default theme for ${config.themeId}`,
          );
          yield* themesService.setTheme(config.themeId, {
            // Create a minimal theme
            colors: {
              primary: "#3b82f6",
              secondary: "#e5e7eb",
              background: "#ffffff",
              text: "#111827",
            },
            themeName: config.name || "Default Theme",
          });
          console.log(
            `✅ AppService: Default theme created for ${config.themeId}`,
          );

          // Save the newly created theme
          yield* themesService.saveThemes({ chatIds: [config.themeId] }).pipe(
            Effect.catchAll((e) => {
              console.warn(`Failed to save theme ${config.themeId}:`, e);
              return Effect.void;
            }),
          );
        } else {
          console.log(
            `✅ AppService: Theme already exists for ${config.themeId}`,
          );
        }
      }
      console.log("✅ AppService: Integrity check completed");
    });
    // Run integrity check at startup
    yield* checkConfigIntegrity;

    console.log("🔧 AppService: Creating service API object");
    const serviceApi = {
      getAll: () =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getAll called");
          yield* ensureLoaded;
          console.log("🔧 AppService: ensureLoaded completed");
          const chunk = yield* Ref.get(ref);
          console.log("🔧 AppService: chunk retrieved:", chunk);
          const result = Chunk.toArray(chunk);
          console.log("🔧 AppService: getAll result:", result);
          return result;
        }),
      getById: (id: string) =>
        Effect.gen(function* () {
          console.log("🔧 AppService: getById called with id:", id);
          yield* ensureLoaded;
          console.log("🔧 AppService: ensureLoaded completed for getById");
          const chunk = yield* Ref.get(ref);
          console.log("🔧 AppService: chunk retrieved for getById:", chunk);
          const found = Chunk.findFirst(chunk, (a) => a.id === id);
          console.log("🔧 AppService: found option:", found);
          const result = Option.getOrUndefined(found);
          console.log("🔧 AppService: getById result:", result);
          return result;
        }),
      create: (app: ChatAppConfig) =>
        Effect.gen(function* () {
          const validApp = yield* Schema.decode(ChatAppConfigSchema)(app);
          yield* validateReferences(
            agentService,
            toolbarService,
            themesService,
            validApp,
          );
          const newChunk = yield* Ref.updateAndGet(ref, (chunk) =>
            Chunk.append(chunk, validApp),
          );
          yield* saveToStorage(newChunk);
        }).pipe(
          Effect.catchAll((e) => {
            console.warn(
              "Failed to create app config due to validation/decode error",
              e,
            );
            return Effect.void;
          }),
        ),
      update: (id: string, patch: Partial<ChatAppConfig>) =>
        Effect.gen(function* () {
          const newChunk = yield* Ref.updateAndGet(ref, (chunk) =>
            Chunk.map(chunk, (app) =>
              app.id === id ? { ...app, ...patch } : app,
            ),
          );
          yield* saveToStorage(newChunk);
        }),
      delete: (id: string) =>
        Effect.gen(function* () {
          const newChunk = yield* Ref.updateAndGet(ref, (chunk) =>
            Chunk.filter(chunk, (app) => app.id !== id),
          );
          yield* saveToStorage(newChunk);
        }),
    } satisfies AppServiceApi;

    console.log("🔧 AppService: Service API created:", !!serviceApi);
    console.log("🔧 AppService: Returning service API");
    return serviceApi;
  }),
  dependencies: [
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
  ],
}) {}
