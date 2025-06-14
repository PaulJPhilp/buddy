import {
  BuddyBootstrapConfig,
  BuddyBootstrapSchema,
} from "@/schemas/BuddyBootstrapSchema";
import { AgentService } from "@/services/agent";
import { AppService } from "@/services/app";
import { loadAndInitializeConfiguration } from "@/services/configuration";
import { ThemesService } from "@/services/themes/ThemesService";
import { ToolbarService } from "@/services/toolbar";
import { Effect, Layer, Schema } from "effect";

// Create service layer for bootstrap operations
const bootstrapServiceLayer = Layer.mergeAll(
  AgentService.Default,
  AppService.Default,
  ThemesService.Default,
  ToolbarService.Default,
);

// Simpler bootstrap initialization that actually completes
const initializeBootstrapConfig = (configObj: unknown) =>
  Effect.gen(function* () {
    console.log("🔧 Bootstrap: Starting config validation...");

    // Decode and validate the config
    const config = yield* Schema.decodeUnknown(BuddyBootstrapSchema)(
      configObj,
    ).pipe(
      Effect.mapError(
        (e) => new Error(`Config validation failed: ${String(e)}`),
      ),
    );

    console.log("✅ Bootstrap: Config validated successfully");
    console.log("📋 Bootstrap: Config contains:", {
      agents: config.agents?.length || 0,
      toolbars: config.toolbars?.length || 0,
      themes: Object.keys(config.themes || {}).length,
      chatApps: config.chatApps?.length || 0,
    });

    // Initialize agents
    const agentsService = yield* AgentService;
    if (config.agents?.length) {
      console.log(`🤖 Bootstrap: Creating ${config.agents.length} agents...`);
      for (const agent of config.agents) {
        yield* agentsService
          .create(agent)
          .pipe(
            Effect.mapError(
              (e) => new Error(`Agent creation failed: ${String(e)}`),
            ),
          );
      }
      console.log("✅ Bootstrap: Agents created");
    }

    // Initialize toolbars
    const toolbarsService = yield* ToolbarService;
    if (config.toolbars?.length) {
      console.log(
        `🔧 Bootstrap: Creating ${config.toolbars.length} toolbars...`,
      );
      for (const toolbar of config.toolbars) {
        yield* toolbarsService
          .create(toolbar)
          .pipe(
            Effect.mapError(
              (e) => new Error(`Toolbar creation failed: ${String(e)}`),
            ),
          );
      }
      console.log("✅ Bootstrap: Toolbars created");
    }

    // Initialize themes
    const themesService = yield* ThemesService;
    console.log("🎨 Bootstrap: Checking themes...", {
      hasThemes: !!config.themes,
      themesType: typeof config.themes,
      themesKeys: config.themes ? Object.keys(config.themes) : [],
      themesLength: config.themes ? Object.keys(config.themes).length : 0,
    });
    if (config.themes && Object.keys(config.themes).length > 0) {
      console.log(
        `🎨 Bootstrap: Creating ${Object.keys(config.themes).length} themes...`,
      );
      console.log("🎨 Bootstrap: Theme data:", config.themes);
      for (const [themeId, themeObj] of Object.entries(config.themes)) {
        console.log(`🎨 Bootstrap: Setting theme ${themeId}:`, themeObj);
        yield* themesService
          .setTheme(themeId, themeObj)
          .pipe(
            Effect.mapError(
              (e) =>
                new Error(`Theme creation failed for ${themeId}: ${String(e)}`),
            ),
          );
        console.log(`✅ Bootstrap: Theme ${themeId} set successfully`);

        // Verify the theme was actually stored
        const storedTheme = yield* themesService.getTheme(themeId);
        console.log(
          `🔍 Bootstrap: Verification - theme ${themeId} retrieved:`,
          storedTheme,
        );
      }

      // Save all themes to localStorage
      console.log("💾 Bootstrap: Saving themes to localStorage...");
      yield* themesService
        .saveThemes()
        .pipe(
          Effect.mapError(
            (e) => new Error(`Theme persistence failed: ${String(e)}`),
          ),
        );
      console.log(
        "✅ Bootstrap: All themes created, verified, and saved to localStorage",
      );
    }

    // Initialize chat apps (clear existing first to avoid duplicates)
    const appsService = yield* AppService;
    if (config.chatApps?.length) {
      console.log(
        `💬 Bootstrap: Creating ${config.chatApps.length} chat apps...`,
      );

      const existingApps = yield* appsService.getAll();
      const existingIds = new Set(existingApps.map((a) => a.id));

      for (const app of config.chatApps) {
        if (existingIds.has(app.id)) {
          console.log(
            `💬 Bootstrap: Chat app ${app.id} already exists – skipping`,
          );
          continue;
        }
        console.log(`💬 Bootstrap: Creating chat app ${app.id}:`, app);
        yield* appsService
          .create(app)
          .pipe(
            Effect.mapError(
              (e) => new Error(`Chat app creation failed: ${String(e)}`),
            ),
          );
        console.log(`✅ Bootstrap: Chat app ${app.id} created`);

        // Auto-add to UI by dispatching the event
        // This ensures the chat app appears in the UI immediately
        if (typeof window !== "undefined") {
          console.log(`📱 Bootstrap: Auto-adding ${app.id} to UI`);
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: app }),
          );
        }
      }
      console.log("✅ Bootstrap: All chat apps created and added to UI");
    }

    console.log("🎉 Bootstrap: All services initialized successfully!");
    return "bootstrap_complete";
  });

/**
 * Loads a Buddy bootstrap config from a file and initializes the runtime.
 * Only allowed in development mode (process.env.NODE_ENV === 'development').
 */
export function handleBootstrapFileDevOnly(file: File) {
  if (process.env.NODE_ENV !== "development") {
    // Silently ignore or log
    console.warn(
      "Buddy bootstrap loading from disk is only allowed in development mode.",
    );
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const json = event.target?.result as string;
    // Save to localStorage
    localStorage.setItem("buddy:bootstrap", json);
    // Initialize runtime immediately
    try {
      const configObj = JSON.parse(json);
      void Effect.runPromise(
        initializeBootstrapConfig(configObj).pipe(
          Effect.provide(bootstrapServiceLayer),
        ),
      );
    } catch (error) {
      console.error("❌ Bootstrap: Failed to parse config JSON:", error);
    }
  };
  reader.readAsText(file);
}

/**
 * On startup, only initialize from localStorage if in dev mode.
 */
export function initializeBootstrapFromLocalStorageDevOnly() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const json = localStorage.getItem("buddy:bootstrap");
  if (json) {
    console.log(
      "🚀 DevBootstrapLoader: Found bootstrap config, initializing...",
    );
    try {
      const configObj = JSON.parse(json);
      void Effect.runPromise(
        initializeBootstrapConfig(configObj).pipe(
          Effect.provide(bootstrapServiceLayer),
        ),
      )
        .then((result) => {
          console.log(
            "✅ DevBootstrapLoader: Bootstrap initialization completed:",
            result,
          );
        })
        .catch((error) => {
          console.error(
            "❌ DevBootstrapLoader: Bootstrap initialization failed:",
            error,
          );
        });
    } catch (error) {
      console.error(
        "❌ DevBootstrapLoader: Failed to parse bootstrap config:",
        error,
      );
    }
  } else {
    console.log(
      "ℹ️ DevBootstrapLoader: No bootstrap config found in localStorage",
    );
  }
}
