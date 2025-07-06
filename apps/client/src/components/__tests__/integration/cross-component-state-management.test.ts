import { AppComponent } from "@/components/app";
import { ChatAppComponent } from "@/components/chatapp";
import type { AppDomainModel, WorkspaceModel } from "@domain/index";
import { ChatAppsManager } from "@managers/chatapps";
import { CoreManager } from "@managers/core";
import { ConfigService } from "@services/config";
import { Effect, Either, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AgentConfig,
  AppComponentConfig,
  AppConfig,
  ChatAppConfig,
  WorkspaceConfig,
} from "../../app";
import type { ChatAppComponentError } from "../../chatapp/errors";
import { CoreComponent } from "../../core";
import { WorkspaceComponent } from "../../workspace";

// Mock fetch for testing
const mockFetch = vi.fn() as any;
mockFetch.preconnect = vi.fn();
global.fetch = mockFetch;

describe("Cross-Component State Management", () => {
  // Test configurations
  const testAppConfig: AppComponentConfig = {
    id: "test-app",
    name: "Test App",
    configPath: "./test-app.json",
    autoLoadConfig: false,
    autoRenderShell: false,
    debugMode: true,
  };

  const testWorkspaceConfig: WorkspaceConfig = {
    id: "workspace-1",
    name: "Test Workspace",
    description: "A test workspace for cross-component testing",
    chatappIds: ["chatapp-1", "chatapp-2"],
    agentIds: ["agent-1", "agent-2"],
    isDefault: true,
  };

  const testChatApps: ChatAppConfig[] = [
    {
      id: "chatapp-1",
      name: "Test Chat App 1",
      description: "First test chat app",
      type: "chat",
      config: {},
      agentIds: ["agent-1"],
    },
    {
      id: "chatapp-2",
      name: "Test Chat App 2",
      description: "Second test chat app",
      type: "chat",
      config: {},
      agentIds: ["agent-2"],
    },
  ];

  const testAgents: AgentConfig[] = [
    {
      id: "agent-1",
      name: "Test Agent 1",
      description: "First test agent",
      type: "llm",
      config: {
        provider: "openai",
        model: "gpt-4",
      },
    },
    {
      id: "agent-2",
      name: "Test Agent 2",
      description: "Second test agent",
      type: "llm",
      config: {
        provider: "anthropic",
        model: "claude-3",
      },
    },
  ];

  const mockAppConfig: AppConfig = {
    app: {
      name: "Test Buddy",
      version: "1.0.0",
      debugMode: true,
    },
    workspaces: [testWorkspaceConfig],
    chatapps: testChatApps,
    agents: testAgents,
  };

  // Create test layer with all required services
  const TestLayer = Layer.mergeAll(
    CoreManager.Default,
    CoreComponent.Default,
    ConfigService.Default,
    ChatAppsManager.Default,
    WorkspaceComponent.Default,
    ChatAppComponent.Default,
    AppComponent.Default
  );

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockAppConfig)),
      json: () => Promise.resolve(mockAppConfig),
    });
  });

  describe("App-Workspace State Coordination", () => {
    it("should coordinate app and workspace initialization", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize app component
          yield* appComponent.initialize(testAppConfig);
          const appState = yield* appComponent.getState();

          // Initialize workspace component
          yield* workspaceComponent.initialize({
            id: "test-workspace-component",
            name: "Test Workspace Component",
          });
          const workspaceState = yield* workspaceComponent.getState();

          return {
            appInitialized: appState.isInitialized,
            workspaceInitialized: workspaceState.isInitialized,
            appLoading: appState.isLoading,
            workspaceLoading: workspaceState.isLoading,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.appInitialized).toBe(true);
      expect(result.workspaceInitialized).toBe(true);
      expect(result.appLoading).toBe(false);
      expect(result.workspaceLoading).toBe(false);
    });

    it("should propagate configuration from app to workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize and load config
          yield* appComponent.initialize(testAppConfig);
          const loadedConfig = yield* appComponent.loadConfig(
            "./test-app.json"
          );

          // Check workspace received the data
          const workspaceState = yield* workspaceComponent.getState();
          const availableWorkspaces =
            yield* workspaceComponent.getWorkspaceConfig();
          const availableChatApps =
            yield* workspaceComponent.getAvailableChatApps();
          const availableAgents =
            yield* workspaceComponent.getAvailableAgents();

          return {
            configLoaded: loadedConfig,
            workspaceState,
            availableWorkspaces: availableWorkspaces
              ? [availableWorkspaces]
              : [],
            availableChatApps,
            availableAgents,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.configLoaded.workspaces).toHaveLength(1);
      expect(result.configLoaded.chatapps).toHaveLength(2);
      expect(result.configLoaded.agents).toHaveLength(2);

      expect(result.availableWorkspaces).toHaveLength(1);
      expect(result.availableChatApps).toHaveLength(2);
      expect(result.availableAgents).toHaveLength(2);
    });

    it("should coordinate workspace switching between app and workspace components", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;

          // Setup
          yield* appComponent.initialize(testAppConfig);
          yield* appComponent.loadConfig("./test-app.json");

          // Switch workspace through app component
          yield* appComponent.setCurrentWorkspace("workspace-1");

          // Check states
          const appCurrentWorkspace = yield* appComponent.getCurrentWorkspace();
          const workspaceCurrentConfig =
            yield* workspaceComponent.getWorkspaceConfig();
          const appState = yield* appComponent.getState();
          const workspaceState = yield* workspaceComponent.getState();

          return {
            appCurrentWorkspace,
            workspaceCurrentConfig,
            appCurrentId: appState.currentWorkspaceId,
            workspaceCurrentId: workspaceCurrentConfig?.id,
            workspaceLoaded: workspaceState.isWorkspaceLoaded,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.appCurrentWorkspace?.id).toBe("workspace-1");
      expect(result.workspaceCurrentConfig?.id).toBe("workspace-1");
      expect(result.appCurrentId).toBe("workspace-1");
      expect(result.workspaceCurrentId).toBe("workspace-1");
      expect(result.workspaceLoaded).toBe(true);
    });
  });

  describe("Workspace-ChatApp State Coordination", () => {
    it("should coordinate chat app activation between workspace and chatapp components", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppComponent = yield* ChatAppComponent;

          // Setup app and workspace
          yield* appComponent.initialize(testAppConfig);
          yield* appComponent.loadConfig("./test-app.json");
          yield* appComponent.setCurrentWorkspace("workspace-1");

          // Initialize chat app component
          yield* chatAppComponent.initialize({
            id: "test-chatapp-component",
            name: "Test ChatApp Component",
            chatAppId: "chatapp-1",
          });

          // Load chat app through chat app component
          yield* chatAppComponent.loadChatApp(testChatApps[0]);

          // Activate chat app through workspace
          yield* workspaceComponent.activateChatApp("chatapp-1");

          // Check states
          const workspaceActiveChatApps =
            yield* workspaceComponent.getActiveChatApps();
          const chatAppConfig = yield* chatAppComponent.getChatAppConfig();
          const chatAppState = yield* chatAppComponent.getState();
          const workspaceState = yield* workspaceComponent.getState();

          return {
            workspaceActiveChatApps,
            chatAppConfig,
            chatAppLoaded: chatAppState.isChatAppLoaded,
            workspaceActiveChatAppIds: workspaceState.activeChatApps.map(
              (app) => app.id
            ),
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.workspaceActiveChatApps).toHaveLength(1);
      expect(result.workspaceActiveChatApps[0].id).toBe("chatapp-1");
      expect(result.chatAppConfig?.id).toBe("chatapp-1");
      expect(result.chatAppLoaded).toBe(true);
      expect(result.workspaceActiveChatAppIds).toContain("chatapp-1");
    });

    it("should coordinate agent loading between workspace and chatapp components", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppComponent = yield* ChatAppComponent;

          // Setup
          yield* appComponent.initialize(testAppConfig);
          yield* appComponent.loadConfig("./test-app.json");
          yield* appComponent.setCurrentWorkspace("workspace-1");

          // Initialize and load chat app
          yield* chatAppComponent.initialize({
            id: "test-chatapp-component",
            name: "Test ChatApp Component",
            chatAppId: "chatapp-1",
          });
          yield* chatAppComponent.loadChatApp(testChatApps[0]);

          // Load agents through chat app component
          yield* chatAppComponent.loadAgents(testAgents);

          // Check agent coordination
          const workspaceAgents =
            yield* workspaceComponent.getAvailableAgents();
          const chatAppAgents = yield* chatAppComponent.getAssignedAgents();
          const hasAgent1 = yield* chatAppComponent.hasAgent("agent-1");
          const hasAgent2 = yield* chatAppComponent.hasAgent("agent-2");

          return {
            workspaceAgents,
            chatAppAgents,
            hasAgent1,
            hasAgent2,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.workspaceAgents).toHaveLength(2);
      expect(result.chatAppAgents).toHaveLength(1); // Only agent-1 is assigned to chatapp-1
      expect(result.chatAppAgents[0].id).toBe("agent-1");
      expect(result.hasAgent1).toBe(true);
      expect(result.hasAgent2).toBe(false); // agent-2 is not assigned to chatapp-1
    });
  });

  describe("Full Stack State Coordination", () => {
    it("should coordinate state changes across all three components", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize all components
          yield* appComponent.initialize(testAppConfig);
          yield* chatAppComponent.initialize({
            id: "test-chatapp-component",
            name: "Test ChatApp Component",
            chatAppId: "chatapp-1",
          });

          // Load configuration through app
          yield* appComponent.loadConfig("./test-app.json");

          // Set workspace through app
          yield* appComponent.setCurrentWorkspace("workspace-1");

          // Load chat app through chatapp component
          yield* chatAppComponent.loadChatApp(testChatApps[0]);
          yield* chatAppComponent.loadAgents(testAgents);

          // Activate chat app through workspace
          yield* workspaceComponent.activateChatApp("chatapp-1");

          // Render UIs
          yield* appComponent.renderAppShell();
          yield* workspaceComponent.renderWorkspaceUI();
          yield* chatAppComponent.renderChatAppUI();

          // Open chat app window
          yield* chatAppComponent.openWindow();

          // Get final states
          const appState = yield* appComponent.getState();
          const workspaceState = yield* workspaceComponent.getState();
          const chatAppState = yield* chatAppComponent.getState();

          return {
            appState,
            workspaceState,
            chatAppState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // Verify app state
      expect(result.appState.isInitialized).toBe(true);
      expect(result.appState.isConfigLoaded).toBe(true);
      expect(result.appState.isAppShellRendered).toBe(true);
      expect(result.appState.currentWorkspaceId).toBe("workspace-1");

      // Verify workspace state
      expect(result.workspaceState.isInitialized).toBe(true);
      expect(result.workspaceState.isWorkspaceLoaded).toBe(true);
      expect(result.workspaceState.isUIRendered).toBe(true);
      expect(result.workspaceState.workspaceConfig?.id).toBe("workspace-1");
      expect(result.workspaceState.activeChatApps).toHaveLength(1);

      // Verify chat app state
      expect(result.chatAppState.isInitialized).toBe(true);
      expect(result.chatAppState.isChatAppLoaded).toBe(true);
      expect(result.chatAppState.isUIRendered).toBe(true);
      expect(result.chatAppState.chatAppConfig?.id).toBe("chatapp-1");
      expect(result.chatAppState.uiState.isWindowOpen).toBe(true);
    });

    it("should handle configuration updates propagating through all components", async () => {
      const updatedWorkspace: WorkspaceConfig = {
        ...testWorkspaceConfig,
        name: "Updated Test Workspace",
        description: "Updated description",
      };

      const updatedAppConfig: AppConfig = {
        ...mockAppConfig,
        workspaces: [updatedWorkspace],
        app: {
          ...mockAppConfig.app,
          name: "Updated Test Buddy",
        },
      };

      // Mock updated config
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(updatedAppConfig)),
        json: () => Promise.resolve(updatedAppConfig),
      });

      const result = await Effect.runPromise(
        (
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            const workspaceComponent = yield* WorkspaceComponent;

            // Initial setup
            yield* appComponent.initialize(testAppConfig);
            yield* appComponent.loadConfig("./test-app.json");
            yield* appComponent.setCurrentWorkspace("workspace-1");

            const initialAppConfig = yield* appComponent.getAppConfig();
            const initialWorkspaceConfig =
              yield* workspaceComponent.getWorkspaceConfig();

            // Reload configuration
            const updatedConfig = yield* appComponent.reloadConfig();

            // Check updated states
            const finalAppConfig = yield* appComponent.getAppConfig();
            const finalWorkspaceConfig =
              yield* workspaceComponent.getWorkspaceConfig();

            return {
              initialAppName: initialAppConfig?.app.name,
              initialWorkspaceName: initialWorkspaceConfig?.name,
              updatedAppName: finalAppConfig?.app.name,
              updatedWorkspaceName: finalWorkspaceConfig?.name,
              configReloaded: updatedConfig.app.name,
            };
          }) as Effect.Effect<
            {
              initialAppName: string | undefined;
              initialWorkspaceName: any;
              updatedAppName: string | undefined;
              updatedWorkspaceName: any;
              configReloaded: string;
            },
            unknown,
            never
          >
        ).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialAppName).toBe("Test Buddy");
      expect(result.initialWorkspaceName).toBe("Test Workspace");
      expect(result.updatedAppName).toBe("Updated Test Buddy");
      expect(result.updatedWorkspaceName).toBe("Updated Test Workspace");
      expect(result.configReloaded).toBe("Updated Test Buddy");
    });
  });

  describe("Error State Coordination", () => {
    it("should handle errors gracefully without corrupting shared state", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppComponent = yield* ChatAppComponent;

          // Setup successfully
          yield* appComponent.initialize(testAppConfig);
          yield* appComponent.loadConfig("./test-app.json");
          yield* appComponent.setCurrentWorkspace("workspace-1");

          // Initialize chat app component
          yield* chatAppComponent.initialize({
            id: "test-chatapp-component",
            name: "Test ChatApp Component",
            chatAppId: "chatapp-1",
          });

          // Get initial states
          const initialAppState = yield* appComponent.getState();
          const initialWorkspaceState = yield* workspaceComponent.getState();

          // Try to activate non-existent chat app - should fail
          const activationResult = yield* Effect.either(
            workspaceComponent.activateChatApp("non-existent-chatapp")
          );

          // Try to set invalid workspace - should fail
          const workspaceResult = yield* Effect.either(
            appComponent.setCurrentWorkspace("non-existent-workspace")
          );

          // Get final states
          const finalAppState = yield* appComponent.getState();
          const finalWorkspaceState = yield* workspaceComponent.getState();

          return {
            activationResult,
            workspaceResult,
            initialAppState,
            initialWorkspaceState,
            finalAppState,
            finalWorkspaceState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // Verify errors occurred
      expect(result.activationResult._tag).toBe("Left");
      expect(result.workspaceResult._tag).toBe("Left");

      // Verify states remained consistent
      expect(result.finalAppState.isInitialized).toBe(true);
      expect(result.finalAppState.isConfigLoaded).toBe(true);
      expect(result.finalAppState.currentWorkspaceId).toBe("workspace-1"); // Should remain unchanged

      expect(result.finalWorkspaceState.isInitialized).toBe(true);
      expect(result.finalWorkspaceState.isWorkspaceLoaded).toBe(true);
      expect(result.finalWorkspaceState.workspaceConfig?.id).toBe(
        "workspace-1"
      ); // Should remain unchanged
    });

    it("should recover from component failures without affecting others", async () => {
      const result = await Effect.runPromise(
        (
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            const workspaceComponent = yield* WorkspaceComponent;
            const chatAppComponent = yield* ChatAppComponent;

            // Setup successfully
            yield* appComponent.initialize(testAppConfig);
            yield* appComponent.loadConfig("./test-app.json");
            yield* appComponent.setCurrentWorkspace("workspace-1");

            // Initialize chat app component
            yield* chatAppComponent.initialize({
              id: "test-chatapp-component",
              name: "Test ChatApp Component",
              chatAppId: "chatapp-1",
            });

            // Load chat app and render UI
            yield* chatAppComponent.loadChatApp(testChatApps[0]);
            yield* chatAppComponent.renderChatAppUI();

            // Simulate chat app component failure by trying invalid operation
            const invalidResult = yield* Effect.either(
              chatAppComponent.loadChatApp({
                ...testChatApps[0],
                id: "", // Invalid ID
              })
            );

            // Verify other components still work
            const appWorkspaces = yield* appComponent.getWorkspaces();
            const workspaceConfig =
              yield* workspaceComponent.getWorkspaceConfig();
            const appShellRendered = yield* appComponent.isAppShellRendered();

            // Verify chat app component can recover
            const recoveryResult = yield* Effect.either(
              chatAppComponent.loadChatApp(testChatApps[0])
            );

            return {
              invalidResult,
              appWorkspaces,
              workspaceConfig,
              appShellRendered,
              recoveryResult,
            };
          }) as Effect.Effect<
            {
              invalidResult: Either.Either<void, ChatAppComponentError>;
              appWorkspaces: WorkspaceModel[];
              workspaceConfig: any;
              appShellRendered: boolean;
              recoveryResult: Either.Either<void, ChatAppComponentError>;
            },
            unknown,
            never
          >
        ).pipe(Effect.provide(TestLayer))
      );

      // Verify error occurred
      expect(result.invalidResult._tag).toBe("Left");

      // Verify other components unaffected
      expect(result.appWorkspaces).toHaveLength(1);
      expect(result.workspaceConfig?.id).toBe("workspace-1");

      // Verify recovery worked
      expect(result.recoveryResult._tag).toBe("Right");
    });
  });

  describe("State Persistence and Cleanup", () => {
    it("should maintain state consistency during component cleanup", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const appComponent = yield* AppComponent;
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppComponent = yield* ChatAppComponent;

          // Setup and verify
          yield* appComponent.initialize(testAppConfig);
          yield* appComponent.loadConfig("./test-app.json");
          yield* appComponent.setCurrentWorkspace("workspace-1");

          yield* chatAppComponent.initialize({
            id: "test-chatapp-component",
            name: "Test ChatApp Component",
            chatAppId: "chatapp-1",
          });

          // Get states before cleanup
          const beforeAppState = yield* appComponent.getState();
          const beforeWorkspaceState = yield* workspaceComponent.getState();
          const beforeChatAppState = yield* chatAppComponent.getState();

          // Cleanup chat app component only
          yield* chatAppComponent.cleanup();

          // Verify other components still functional
          const afterAppState = yield* appComponent.getState();
          const afterWorkspaceState = yield* workspaceComponent.getState();
          const afterChatAppState = yield* chatAppComponent.getState();

          return {
            beforeAppState,
            beforeWorkspaceState,
            beforeChatAppState,
            afterAppState,
            afterWorkspaceState,
            afterChatAppState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // Verify states before cleanup
      expect(result.beforeAppState.isInitialized).toBe(true);
      expect(result.beforeWorkspaceState.isInitialized).toBe(true);
      expect(result.beforeChatAppState.isInitialized).toBe(true);

      // Verify app and workspace still functional after chatapp cleanup
      expect(result.afterAppState.isInitialized).toBe(true);
      expect(result.afterAppState.isConfigLoaded).toBe(true);
      expect(result.afterWorkspaceState.isInitialized).toBe(true);
      expect(result.afterWorkspaceState.isWorkspaceLoaded).toBe(true);

      // Verify chat app component was reset
      expect(result.afterChatAppState.isInitialized).toBe(false);
      expect(result.afterChatAppState.isChatAppLoaded).toBe(false);
      expect(result.afterChatAppState.chatAppConfig).toBeNull();
    });
  });
});
