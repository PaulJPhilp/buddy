import { ChatAppConfig } from "@/types/global";
import { Context, Effect, Layer } from "effect";
import { useMemo } from "react";

// Browser HTTP client for Effect platform
import { FetchHttpClient } from "@effect/platform";

// Effect service imports (browser-compatible only)
// import { AgentService } from "@/services/agent"; // Node.js only (FileSystem dependency)
import { AgentManager } from "@/managers/agent-manager";
import { ChatAppsManager } from "@/managers/chat-apps-manager";
import { ChatManager } from "@/managers/chat-manager";
import { AgentRegistryService } from "@/services/agent-registry";
import { AgentKitBridge } from "@/services/agentkit-bridge/service";
import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { UrlService } from "@/services/url";

import { AppManager } from "@/managers/app-manager";
import { WorkspaceManager } from "@/managers/workspace-component";
import { MdxService } from "@/services/mdx";
import { ToolbarService } from "@/services/toolbar";

const minimalServiceLayer = Layer.mergeAll(
  FetchHttpClient.layer, // Provides HttpClient for browser
  AppService.Default
  // AgentService.Default,
  // AgentRegistryService.Default,
  // ToolbarService.Default,
  // ChatService.Default,
  // ChatBridge.Default,
  // AgentKitBridge.Default,
  // WebSocketService.Default,
  // MdxService.Default,
  // UrlService.Default,
);

// Browser-compatible service layer (excludes Node.js-only services)
const sharedServiceLayer = Layer.mergeAll(
  FetchHttpClient.layer, // Provides HttpClient for browser
  AppService.Default,
  // AgentService.Default, // Removed: depends on FileSystem (Node.js only)
  AgentManager.Default,
  AgentRegistryService.Default,
  ChatAppsManager.Default,
  ToolbarService.Default,
  ChatManager.Default,
  // ChatService.Default, // Temporarily disabled for faster loading
  ChatBridge.Default,
  AgentKitBridge.Default,
  MdxService.Default,
  UrlService.Default,
  WorkspaceManager.Default,
  AppManager.Default
);

// Global context with pre-initialized services
let globalContext: Context.Context<any> | null = null;
let contextPromise: Promise<Context.Context<any>> | null = null;

async function getGlobalContext(): Promise<Context.Context<any>> {
  if (globalContext) {
    console.log("[useServiceLayer] Returning existing global context");
    return globalContext;
  }

  if (contextPromise) {
    console.log("[useServiceLayer] Waiting for existing context promise");
    return contextPromise;
  }

  console.log(
    "[useServiceLayer] Creating global context with pre-initialized services"
  );

  // Create an effect that initializes all services and captures them in a context
  const initializeContext = Effect.gen(function* () {
    console.log("[useServiceLayer] Starting service initialization...");

    // Get all services - this initializes them within the same scope
    console.log("[useServiceLayer] Initializing WorkspaceManager...");
    const workspaceManager = yield* WorkspaceManager;
    console.log("[useServiceLayer] ✅ WorkspaceManager initialized");

    // console.log("[useServiceLayer] Initializing ChatService...");
    // const chatService = yield* ChatService;
    // console.log("[useServiceLayer] ✅ ChatService initialized");

    console.log("[useServiceLayer] Initializing UrlService...");
    const configService = yield* UrlService;
    console.log("[useServiceLayer] ✅ UrlService initialized");

    console.log("[useServiceLayer] Initializing AppService...");
    const appService = yield* AppService;
    console.log("[useServiceLayer] ✅ AppService initialized");

    console.log("[useServiceLayer] Initializing AgentManager...");
    const agentManager = yield* AgentManager;
    console.log("[useServiceLayer] ✅ AgentManager initialized");

    console.log("[useServiceLayer] Initializing AgentRegistryService...");
    const agentRegistryService = yield* AgentRegistryService;
    console.log("[useServiceLayer] ✅ AgentRegistryService initialized");

    console.log("[useServiceLayer] Initializing ChatAppsManager...");
    const chatAppsManager = yield* ChatAppsManager;
    console.log("[useServiceLayer] ✅ ChatAppsManager initialized");

    console.log("[useServiceLayer] Initializing ToolbarService...");
    const toolbarService = yield* ToolbarService;
    console.log("[useServiceLayer] ✅ ToolbarService initialized");

    console.log("[useServiceLayer] Initializing ChatManager...");
    const chatManager = yield* ChatManager;
    console.log("[useServiceLayer] ✅ ChatManager initialized");

    console.log("[useServiceLayer] Initializing ChatBridge...");
    const chatBridge = yield* ChatBridge;
    console.log("[useServiceLayer] ✅ ChatBridge initialized");

    console.log("[useServiceLayer] Initializing AgentKitBridge...");
    const agentKitBridge = yield* AgentKitBridge;
    console.log("[useServiceLayer] ✅ AgentKitBridge initialized");

    console.log("[useServiceLayer] Initializing MdxService...");
    const mdxService = yield* MdxService;
    console.log("[useServiceLayer] ✅ MdxService initialized");

    console.log("[useServiceLayer] Initializing AppManager...");
    const appManager = yield* AppManager;
    console.log("[useServiceLayer] ✅ AppManager initialized");

    console.log("[useServiceLayer] All services initialized in shared scope");

    // Create a context with all the initialized services
    console.log("[useServiceLayer] Creating context with all services...");
    const context = Context.empty()
      .pipe(Context.add(WorkspaceManager, workspaceManager))
      // .pipe(Context.add(ChatService, chatService))
      .pipe(Context.add(UrlService, configService))
      .pipe(Context.add(AppService, appService))
      .pipe(Context.add(AgentManager, agentManager))
      .pipe(Context.add(AgentRegistryService, agentRegistryService))
      .pipe(Context.add(ChatAppsManager, chatAppsManager))
      .pipe(Context.add(ToolbarService, toolbarService))
      .pipe(Context.add(ChatManager, chatManager))
      .pipe(Context.add(ChatBridge, chatBridge))
      .pipe(Context.add(AgentKitBridge, agentKitBridge))
      .pipe(Context.add(MdxService, mdxService))
      .pipe(Context.add(AppManager, appManager));

    console.log("[useServiceLayer] ✅ Context created with all services");
    return context;
  });

  // Run the initialization once with Effect.provide()
  contextPromise = Effect.runPromise(
    initializeContext.pipe(Effect.provide(sharedServiceLayer))
  )
    .then((context) => {
      console.log("[useServiceLayer] Global context created successfully");
      globalContext = context;
      contextPromise = null;
      return context;
    })
    .catch((error) => {
      console.error(
        "[useServiceLayer] Failed to create global context:",
        error
      );
      contextPromise = null;
      throw error;
    });

  return contextPromise;
}

/**
 * React hook for constructing and providing the Effect service Layer for the chat client.
 *
 * - Lazily constructs the full service Layer used by the chat client.
 * - Provides a helper to run arbitrary effects within that Layer.
 * - The Layer is recreated whenever the provided `deps` array changes.
 *
 * @param config Optional ChatAppConfig for customizing the Layer.
 * @param deps Dependency array to control Layer recreation.
 * @returns An object with:
 *   - layer: The constructed Effect Layer.
 *   - runWithServices: Helper to run effects within the Layer.
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - Layer is memoized and recreated only when dependencies change.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */
export function useServiceLayer(
  config?: ChatAppConfig,
  deps: ReadonlyArray<unknown> = []
): {
  readonly layer: Layer.Layer<any, never, never>;
  readonly runWithServices: <A, E = never>(
    effect: Effect.Effect<A, E, any>
  ) => Promise<A>;
} {
  const layer = useMemo(() => {
    console.log("[useServiceLayer] Getting shared layer instance");
    return sharedServiceLayer;
  }, []);

  /**
   * Uses the global context with pre-initialized services to ensure singletons
   */
  const runWithServices = useMemo(() => {
    console.log("[useServiceLayer] Creating runWithServices function");
    return async function runWithServices<A, E = never>(
      effect: Effect.Effect<A, E, any>
    ): Promise<A> {
      console.log(
        "[useServiceLayer:runWithServices] Running effect with global context"
      );

      try {
        // Get the global context with pre-initialized services
        const context = await getGlobalContext();

        // Run the effect with the pre-initialized context
        const result = await Effect.runPromise(
          effect.pipe(Effect.provide(context))
        );

        console.log(
          "[useServiceLayer:runWithServices] Effect completed successfully"
        );
        return result;
      } catch (error) {
        console.error(
          "[useServiceLayer:runWithServices] Effect failed:",
          error
        );
        throw error;
      }
    };
  }, []);

  return { layer, runWithServices } as const;
}
