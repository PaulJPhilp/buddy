import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatAppsManager } from "@managers/chatapps";
import { CoreManager } from "@managers/core";
import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { CoreComponent } from "@/components/core";
import { WorkspaceComponent } from "../index";
import type { WorkspaceComponentConfig, WorkspaceConfig } from "../types";

// Mock fetch for testing
const mockFetch = vi.fn() as any;
mockFetch.preconnect = vi.fn();
global.fetch = mockFetch;

describe("WorkspaceComponent Integration", () => {
  const testWorkspaceConfig: WorkspaceConfig = {
    id: "test-workspace",
    name: "Test Workspace",
    description: "A test workspace",
    chatappIds: ["chat-1", "chat-2"],
    agentIds: ["agent-1", "agent-2"],
    isDefault: true,
  };

  const testChatApps: ChatAppConfig[] = [
    {
      id: "chat-1",
      name: "Test Chat 1",
      description: "First test chat app",
      type: "general",
      config: {},
      agentIds: ["agent-1"],
    },
    {
      id: "chat-2",
      name: "Test Chat 2",
      description: "Second test chat app",
      type: "general",
      config: {},
      agentIds: ["agent-2"],
    },
  ];

  const testAgents: AgentConfig[] = [
    {
      id: "agent-1",
      name: "Test Agent 1",
      description: "First test agent",
      type: "assistant",
      config: {
        provider: "openai",
        model: "gpt-4",
      },
    },
    {
      id: "agent-2",
      name: "Test Agent 2",
      description: "Second test agent",
      type: "assistant",
      config: {
        provider: "anthropic",
        model: "claude-3",
      },
    },
  ];

  const testConfig: WorkspaceComponentConfig = {
    id: "test-workspace-component",
    name: "Test Workspace Component",
    workspaceId: "test-workspace",
    autoLoadChatApps: true,
    autoLoadAgents: true,
    autoRenderUI: false,
    debugMode: true,
  };

  // Create a layer that provides all services needed for testing
  const TestLayer = Layer.merge(
    Layer.provide(
      Layer.provide(
        Layer.provide(WorkspaceComponent.Default, ChatAppsManager.Default),
        CoreManager.Default
      ),
      CoreComponent.Default
    ),
    Layer.provide(
      Layer.provide(ChatAppsManager.Default, CoreManager.Default),
      CoreComponent.Default
    )
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize workspace component successfully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.initialize(testConfig);

          const state = yield* workspaceComponent.getState();
          return state;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isInitialized).toBe(true);
      expect(result.workspaceConfig).toBeNull();
      expect(result.availableChatApps).toHaveLength(0);
      expect(result.availableAgents).toHaveLength(0);
    });
  });

  describe("Workspace Management", () => {
    it("should load workspace configuration", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          const state = yield* workspaceComponent.getState();
          const config = yield* workspaceComponent.getWorkspaceConfig();
          return { state, config };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.state.isWorkspaceLoaded).toBe(true);
      expect(result.config).toEqual(testWorkspaceConfig);
      expect(result.config?.name).toBe("Test Workspace");
    });

    it("should switch workspaces", async () => {
      const newWorkspaceConfig: WorkspaceConfig = {
        ...testWorkspaceConfig,
        id: "new-workspace",
        name: "New Workspace",
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.initialize(testConfig);

          // Load initial workspace
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          const initialConfig = yield* workspaceComponent.getWorkspaceConfig();

          // Switch to new workspace
          yield* workspaceComponent.switchWorkspace(newWorkspaceConfig);
          const newConfig = yield* workspaceComponent.getWorkspaceConfig();

          return { initialConfig, newConfig };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialConfig?.id).toBe("test-workspace");
      expect(result.newConfig?.id).toBe("new-workspace");
      expect(result.newConfig?.name).toBe("New Workspace");
    });
  });

  describe("ChatApp Integration with ChatAppsManager", () => {
    it("should load chat apps and register them with ChatAppsManager", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppsManager = yield* ChatAppsManager;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          // Load chat apps (should register with ChatAppsManager)
          yield* workspaceComponent.loadChatApps(testChatApps);

          // Check WorkspaceComponent state
          const workspaceState = yield* workspaceComponent.getState();
          const availableChatApps =
            yield* workspaceComponent.getAvailableChatApps();

          // Check ChatAppsManager state
          const chatAppsManagerState = yield* chatAppsManager.getState();
          const registeredApps = yield* chatAppsManager.getAllChatApps();

          return {
            workspaceState,
            availableChatApps,
            chatAppsManagerState,
            registeredApps,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // WorkspaceComponent should have chat apps
      expect(result.availableChatApps).toHaveLength(2);
      expect(result.availableChatApps.map((app) => app.id)).toEqual([
        "chat-1",
        "chat-2",
      ]);

      // ChatAppsManager should have registered apps
      expect(result.registeredApps).toHaveLength(2);
      expect(result.registeredApps.map((app) => app.id)).toEqual([
        "chat-1",
        "chat-2",
      ]);
      expect(result.chatAppsManagerState.stats.totalApps).toBe(2);
    });

    it("should activate chat apps through ChatAppsManager", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppsManager = yield* ChatAppsManager;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);

          // Activate a chat app
          yield* workspaceComponent.activateChatApp("chat-1");

          // Check states
          const workspaceState = yield* workspaceComponent.getState();
          const activeChatApps = yield* workspaceComponent.getActiveChatApps();
          const chatAppInstance = yield* chatAppsManager.getChatAppInstance(
            "chat-1"
          );

          return { workspaceState, activeChatApps, chatAppInstance };
        }).pipe(Effect.provide(TestLayer))
      );

      // WorkspaceComponent should show active chat app
      expect(result.workspaceState.activeChatAppIds).toContain("chat-1");
      expect(result.activeChatApps).toHaveLength(1);
      expect(result.activeChatApps[0].id).toBe("chat-1");

      // ChatAppsManager should show expanded status
      expect(result.chatAppInstance.status).toBe("expanded");
    });

    it("should deactivate chat apps through ChatAppsManager", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppsManager = yield* ChatAppsManager;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);

          // Activate then deactivate a chat app
          yield* workspaceComponent.activateChatApp("chat-1");
          yield* workspaceComponent.deactivateChatApp("chat-1");

          // Check states
          const workspaceState = yield* workspaceComponent.getState();
          const activeChatApps = yield* workspaceComponent.getActiveChatApps();
          const chatAppInstance = yield* chatAppsManager.getChatAppInstance(
            "chat-1"
          );

          return { workspaceState, activeChatApps, chatAppInstance };
        }).pipe(Effect.provide(TestLayer))
      );

      // WorkspaceComponent should not show active chat app
      expect(result.workspaceState.activeChatAppIds).not.toContain("chat-1");
      expect(result.activeChatApps).toHaveLength(0);

      // ChatAppsManager should show stashed status
      expect(result.chatAppInstance.status).toBe("stashed");
    });
  });

  describe("Agent Management", () => {
    it("should load agents for workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadAgents(testAgents);

          const availableAgents =
            yield* workspaceComponent.getAvailableAgents();
          return availableAgents;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(2);
      expect(result.map((agent) => agent.id)).toEqual(["agent-1", "agent-2"]);
    });

    it("should get agents for specific chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);
          yield* workspaceComponent.loadAgents(testAgents);

          const agentsForChat1 = yield* workspaceComponent.getAgentsForChatApp(
            "chat-1"
          );
          return agentsForChat1;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("agent-1");
    });
  });

  describe("UI Rendering", () => {
    it("should render workspace UI", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          // Render UI
          yield* workspaceComponent.renderWorkspaceUI();

          const isRendered = yield* workspaceComponent.isUIRendered();
          const state = yield* workspaceComponent.getState();

          return { isRendered, state };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isRendered).toBe(true);
      expect(result.state.isUIRendered).toBe(true);
    });

    it("should fail to render UI before workspace is loaded", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);

          // Try to render UI without loading workspace (should fail)
          const renderResult = yield* workspaceComponent
            .renderWorkspaceUI()
            .pipe(Effect.either);

          return renderResult;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("WorkspaceUIError");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid workspace configuration", async () => {
      const invalidConfig: WorkspaceConfig = {
        ...testWorkspaceConfig,
        id: "", // Invalid empty ID
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);

          // Try to load invalid workspace
          const loadResult = yield* workspaceComponent
            .loadWorkspace(invalidConfig)
            .pipe(Effect.either);

          return loadResult;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("WorkspaceValidationError");
      }
    });

    it("should handle activating non-existent chat app", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);

          // Try to activate non-existent chat app
          const activateResult = yield* workspaceComponent
            .activateChatApp("non-existent")
            .pipe(Effect.either);

          return activateResult;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("WorkspaceChatAppError");
      }
    });
  });

  describe("Operation Tracking", () => {
    it("should track operations", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          const lastOperation = yield* workspaceComponent.getLastOperation();
          return lastOperation;
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result).toBe("load_config");
    });
  });
});
