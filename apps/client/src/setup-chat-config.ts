import { Effect, Layer } from "effect";
import { ChatAppConfig } from "./schemas/ChatAppConfigSchema";
import { AgentService } from "./services/agent";
import { AppService } from "./services/app";
import { EnhancedConfigLifecycleServiceLive } from "./services/config-lifecycle";
import { ThemesService } from "./services/themes";
import { ToolbarService } from "./services/toolbar";

/**
 * Setup script to create a default chat app config in local storage
 * This follows the Effect → xState → React pattern from the README
 */

// Default chat app configuration
const defaultChatAppConfig: ChatAppConfig = {
  id: "default-chat",
  name: "Default Chat",
  agentId: "default-agent",
  toolbarId: "default-toolbar",
  themeId: "default-theme",
};

// Program to setup the chat app config
const setupChatConfig = Effect.gen(function* () {
  console.log("🚀 Setting up chat app configuration...");

  // Get service instances
  console.log("🔄 Getting AgentService...");
  const agentService = yield* AgentService;
  console.log("✅ AgentService obtained:", !!agentService);
  console.log("🔍 AgentService methods:", Object.keys(agentService || {}));

  console.log("🔄 Getting ToolbarService...");
  const toolbarService = yield* ToolbarService;
  console.log("✅ ToolbarService obtained:", !!toolbarService);
  console.log("🔍 ToolbarService methods:", Object.keys(toolbarService || {}));

  console.log("🔄 Getting ThemesService...");
  const themesService = yield* ThemesService;
  console.log("✅ ThemesService obtained:", !!themesService);
  console.log("🔍 ThemesService methods:", Object.keys(themesService || {}));

  console.log("🔄 Getting AppService...");
  const appService = yield* AppService;
  console.log("✅ AppService obtained:", !!appService);
  console.log("🔍 AppService methods:", Object.keys(appService || {}));

  // Create required dependencies first
  console.log("📦 Creating default agent...");
  console.log("🔄 About to call agentService.create...");
  yield* agentService
    .create({
      id: "default-agent",
      name: "Default Agent",
      initialAgentName: "Default Agent",
      model: "gemini-1.5-flash",
      systemPrompt: "You are a helpful assistant.",
    })
    .pipe(
      Effect.catchAll((err) => {
        console.log("⚠️ Agent creation failed (ignoring):", err);
        return Effect.void;
      }),
    ); // Ignore if already exists
  console.log("✅ Agent creation completed");

  console.log("🔧 Creating default toolbar...");
  yield* toolbarService
    .create({
      id: "default-toolbar",
      name: "Default Toolbar",
      tools: [],
    })
    .pipe(Effect.catchAll(() => Effect.void)); // Ignore if already exists

  console.log("🎨 Creating default theme...");
  yield* themesService
    .setTheme("default-theme", {
      colors: {
        primary: "blue-500",
        secondary: "gray-200",
        accent: "blue-600",
        background: "white",
        text: "gray-800",
      },
      borders: {
        color: "gray-300",
        thickness: "1px",
        radius: "0.5rem",
      },
      bubbles: {
        user: {
          background: "blue-500",
          text: "white",
          radius: "rounded-xl",
        },
        agent: {
          background: "gray-200",
          text: "gray-800",
          radius: "rounded-xl",
        },
      },
      userArea: {
        background: "gray-50",
        inputRingColor: "blue-600",
      },
      header: {
        background: "blue-500",
        text: "white",
      },
      typography: {
        fontFamily: "sans-serif",
        fontSize: "1rem",
      },
    })
    .pipe(Effect.catchAll(() => Effect.void)); // Ignore if already exists

  console.log("📱 Creating chat app config...");
  yield* appService.create(defaultChatAppConfig);

  console.log("✅ Chat app config created:", defaultChatAppConfig);

  // Auto-add to UI by dispatching the event
  // This ensures the default chat app appears in the UI immediately
  if (typeof window !== "undefined") {
    console.log(`📱 Setup: Auto-adding ${defaultChatAppConfig.id} to UI`);
    window.dispatchEvent(
      new CustomEvent("buddy:addChatApp", { detail: defaultChatAppConfig }),
    );
  }

  // Verify it was created
  const apps = yield* appService.getAll();
  console.log("📋 All chat apps:", apps);

  // Debug: Check service state
  console.log("🔍 Service state check completed");

  return defaultChatAppConfig;
});

// Create the service layer with all dependencies
console.log("🔧 Creating service layer...");
console.log("🔍 AppService.Default:", AppService.Default);
console.log("🔍 AgentService.Default:", AgentService.Default);
console.log("🔍 ToolbarService.Default:", ToolbarService.Default);
console.log("🔍 ThemesService.Default:", ThemesService.Default);

const serviceLayer = Layer.mergeAll(
  AppService.Default,
  AgentService.Default,
  ToolbarService.Default,
  ThemesService.Default,
  EnhancedConfigLifecycleServiceLive,
);

console.log("✅ Service layer created:", serviceLayer);

// Export the setup function
export const runSetup = () => {
  console.log("🚀 runSetup called");
  return Effect.runPromise(
    setupChatConfig.pipe(
      Effect.provide(serviceLayer),
      Effect.catchAll((error) => {
        console.error("❌ Failed to setup chat config:", error);
        console.error("❌ Error type:", typeof error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return Effect.fail(error);
      }),
    ),
  );
};

// Export the default config for reference
export { defaultChatAppConfig };
