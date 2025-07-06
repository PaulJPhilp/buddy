import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Import working services from the services directory
import { AgentRegistryService } from "@/services/agent-registry";
import { AgentKitBridge } from "@/services/agentkit-bridge";
import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { UrlService } from "@/services/url";
import { WebSocketService } from "@/services/websocket";

// Import types for validation
import type { ChatAppConfig } from "@/types/global";

/**
 * Application Startup Flow Integration Test
 *
 * This test validates the core service layer initialization:
 * 1. Service Layer Initialization - Effect services boot up with proper dependencies
 * 2. Basic Configuration Loading - Services can load their configurations
 * 3. Service Communication - Services can communicate with each other
 * 4. Ready State - Core services reach operational state
 */
describe("Application Startup Flow", () => {
  // Create a test layer with working services only
  const testLayer = Layer.mergeAll(
    // Platform services
    FetchHttpClient.layer,

    // Core services (no dependencies)
    AppService.Default,
    ConfigService.Default,
    WebSocketService.Default,

    // Service dependencies
    UrlService.Default,
    MdxService.Default,
    ChatBridge.Default,
    AgentKitBridge.Default,

    // Main services
    ChatService.Default,
    AgentRegistryService.Default
  );

  let cleanup: (() => Effect.Effect<void, never, never>) | null = null;

  beforeEach(async () => {
    cleanup = null;
  });

  afterEach(async () => {
    if (cleanup) {
      await Effect.runPromise(cleanup().pipe(Effect.provide(testLayer)));
    }
  });

  describe("Core Service Initialization", () => {
    it("should initialize all core services successfully", async () => {
      console.log("🚀 Testing core service initialization...");

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          console.log("📋 Phase 1: Initializing core services...");

          // Phase 1: Core Service Initialization
          const appService = yield* AppService;
          const configService = yield* ConfigService;
          const urlService = yield* UrlService;
          const chatService = yield* ChatService;
          const agentRegistry = yield* AgentRegistryService;

          // Verify services are initialized
          expect(appService).toBeDefined();
          expect(configService).toBeDefined();
          expect(urlService).toBeDefined();
          expect(chatService).toBeDefined();
          expect(agentRegistry).toBeDefined();

          console.log("✅ All core services initialized successfully");

          return {
            success: true,
            servicesInitialized: 5,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.success).toBe(true);
      expect(result.servicesInitialized).toBe(5);
      console.log("✅ Core service initialization test passed!");
    });

    it("should load application configuration through services", async () => {
      console.log("🧪 Testing configuration loading...");

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          console.log("⚙️ Loading application configuration...");

          // Test that AppService can load configurations
          const appService = yield* AppService;
          const configs = yield* appService.getAll();

          expect(Array.isArray(configs)).toBe(true);
          console.log(`📊 Loaded ${configs.length} application configurations`);

          // Test that ConfigService is operational
          const configService = yield* ConfigService;
          const config = yield* configService.loadConfig();

          expect(config).toBeDefined();
          console.log("📝 Configuration service operational");

          return {
            success: true,
            configCount: configs.length,
            configLoaded: true,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.success).toBe(true);
      expect(result.configLoaded).toBe(true);
      console.log("✅ Configuration loading test passed!");
    });

    it("should demonstrate service communication", async () => {
      console.log("🔗 Testing service communication...");

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          console.log("🌐 Testing service interactions...");

          // Test that services can work together
          const urlService = yield* UrlService;
          const baseUrl = yield* urlService.getBaseUrl;

          expect(typeof baseUrl).toBe("string");
          console.log(`🔗 Base URL configured: ${baseUrl}`);

          const chatService = yield* ChatService;
          const chatState = yield* chatService.getState();

          expect(chatState).toBeDefined();
          console.log("💬 Chat service state accessible");

          const agentRegistry = yield* AgentRegistryService;
          const agents = yield* agentRegistry.getAllAgents();

          expect(Array.isArray(agents)).toBe(true);
          console.log(
            `🤖 Agent registry accessible with ${agents.length} agents`
          );

          return {
            success: true,
            baseUrlConfigured: baseUrl.length > 0,
            chatStateAccessible: !!chatState,
            agentRegistryAccessible: true,
            agentCount: agents.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.success).toBe(true);
      expect(result.baseUrlConfigured).toBe(true);
      expect(result.chatStateAccessible).toBe(true);
      expect(result.agentRegistryAccessible).toBe(true);
      console.log("✅ Service communication test passed!");
    });

    it("should handle service errors gracefully", async () => {
      console.log("⚠️ Testing error handling...");

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          console.log("🛡️ Testing service error handling...");

          const agentRegistry = yield* AgentRegistryService;

          // Test error handling by trying to get a non-existent agent
          const agentResult = yield* Effect.either(
            agentRegistry.getAgentById("non-existent-agent-id")
          );

          // Should handle the error gracefully - getAgentById returns Option<Agent>
          expect(agentResult._tag).toBe("Right");
          if (agentResult._tag === "Right") {
            // The result should be None for non-existent agent
            expect(agentResult.right._tag).toBe("None");
          }

          console.log("🛡️ Error handling working correctly");

          return {
            success: true,
            errorHandlingWorking: true,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.success).toBe(true);
      expect(result.errorHandlingWorking).toBe(true);
      console.log("✅ Error handling test passed!");
    });
  });
});
