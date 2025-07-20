import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatAppsManager } from "../../../managers/chatapps";
import { CoreManager } from "../../../managers/core";
import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { CoreComponent } from "../../core";
import { WorkspaceComponent } from "../index";
import type { WorkspaceComponentConfig, WorkspaceConfig } from "../types";

// Mock fetch for testing
const mockFetch = vi.fn() as any;
mockFetch.preconnect = vi.fn();
global.fetch = mockFetch;

describe("WorkspaceComponent UI Rendering", () => {
  // Test data
  const testWorkspaceConfig: WorkspaceConfig = {
    id: "test-workspace",
    name: "Test Workspace",
    description: "A test workspace for UI rendering",
    chatappIds: ["chat-1", "chat-2"],
    agentIds: ["agent-1", "agent-2"],
    isDefault: true,
    maxExpandedApps: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const testChatApps: ChatAppConfig[] = [
    {
      id: "chat-1",
      name: "Test Chat 1",
      description: "First test chat app",
      version: "1.0.0",
      agentId: "agent-1",
      workspaceId: "test-workspace",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "chat-2",
      name: "Test Chat 2",
      description: "Second test chat app",
      version: "1.0.0",
      agentId: "agent-2",
      workspaceId: "test-workspace",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const testAgents: AgentConfig[] = [
    {
      id: "agent-1",
      name: "Test Agent 1",
      description: "First test agent",
      version: "1.0.0",
      provider: "openai",
      model: "gpt-4",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "agent-2",
      name: "Test Agent 2",
      description: "Second test agent",
      version: "1.0.0",
      provider: "anthropic",
      model: "claude-3",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
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

  // Create a proper layer composition
  // Dependencies: CoreManager (no deps) -> CoreComponent (no deps) -> ChatAppsManager (CoreManager) -> WorkspaceComponent (CoreComponent, ChatAppsManager)
  const TestLayer = Layer.mergeAll(
    CoreManager.Default,
    CoreComponent.Default,
    ChatAppsManager.Default,
    WorkspaceComponent.Default
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UI Rendering Lifecycle", () => {
    it("should initialize workspace component for UI rendering", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize component
          yield* workspaceComponent.initialize(testConfig);
          const state = yield* workspaceComponent.getState();

          return {
            isInitialized: state.isInitialized,
            isUIRendered: state.isUIRendered,
            isWorkspaceLoaded: state.isWorkspaceLoaded,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isInitialized).toBe(true);
      expect(result.isUIRendered).toBe(false);
      expect(result.isWorkspaceLoaded).toBe(false);
    });

    it("should load workspace configuration before rendering UI", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize and load workspace
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          const state = yield* workspaceComponent.getState();
          const config = yield* workspaceComponent.getWorkspaceConfig();

          return {
            state,
            config,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.state.isWorkspaceLoaded).toBe(true);
      expect(result.config?.id).toBe("test-workspace");
      expect(result.config?.name).toBe("Test Workspace");
    });

    it("should render workspace UI after workspace is loaded", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize, load workspace, then render UI
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.renderWorkspaceUI();

          const isRendered = yield* workspaceComponent.isUIRendered();
          const state = yield* workspaceComponent.getState();

          return {
            isRendered,
            isWorkspaceLoaded: state.isWorkspaceLoaded,
            isUIRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isRendered).toBe(true);
      expect(result.isWorkspaceLoaded).toBe(true);
      expect(result.isUIRendered).toBe(true);
    });

    it("should fail to render UI without loaded workspace", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize but don't load workspace
          yield* workspaceComponent.initialize(testConfig);

          // Try to render UI - should fail
          const renderResult = yield* Effect.either(
            workspaceComponent.renderWorkspaceUI()
          );

          return {
            renderResult,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.renderResult._tag).toBe("Left");
      if (result.renderResult._tag === "Left") {
        expect(result.renderResult.left.message).toContain(
          "Cannot render UI before workspace is loaded"
        );
      }
    });
  });

  describe("UI State Management", () => {
    it("should track UI rendering state correctly", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize
          yield* workspaceComponent.initialize(testConfig);
          const initialState = yield* workspaceComponent.getState();

          // Load workspace
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          const loadedState = yield* workspaceComponent.getState();

          // Render UI
          yield* workspaceComponent.renderWorkspaceUI();
          const renderedState = yield* workspaceComponent.getState();

          return {
            initialState,
            loadedState,
            renderedState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // Initial state
      expect(result.initialState.isInitialized).toBe(true);
      expect(result.initialState.isWorkspaceLoaded).toBe(false);
      expect(result.initialState.isUIRendered).toBe(false);

      // After loading workspace
      expect(result.loadedState.isWorkspaceLoaded).toBe(true);
      expect(result.loadedState.isUIRendered).toBe(false);

      // After rendering UI
      expect(result.renderedState.isWorkspaceLoaded).toBe(true);
      expect(result.renderedState.isUIRendered).toBe(true);
    });

    it("should update UI state when workspace is switched", async () => {
      const newWorkspaceConfig: WorkspaceConfig = {
        ...testWorkspaceConfig,
        id: "new-workspace",
        name: "New Workspace",
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize and load first workspace
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.renderWorkspaceUI();

          const firstRenderState = yield* workspaceComponent.getState();

          // Switch to new workspace
          yield* workspaceComponent.switchWorkspace(newWorkspaceConfig);
          const switchedState = yield* workspaceComponent.getState();

          // Check if UI is still rendered after switch
          const isStillRendered = yield* workspaceComponent.isUIRendered();

          return {
            firstRenderState,
            switchedState,
            isStillRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // UI should remain rendered after workspace switch
      expect(result.firstRenderState.isUIRendered).toBe(true);
      expect(result.switchedState.isUIRendered).toBe(true);
      expect(result.isStillRendered).toBe(true);

      // Workspace config should be updated
      expect(result.switchedState.workspaceConfig?.id).toBe("new-workspace");
    });
  });

  describe("UI Integration with ChatApps", () => {
    it("should render UI with loaded chat apps", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          const chatAppsManager = yield* ChatAppsManager;

          // Initialize and load workspace
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);

          // Load chat apps
          yield* workspaceComponent.loadChatApps(testChatApps);

          // Render UI
          yield* workspaceComponent.renderWorkspaceUI();

          // Get state
          const workspaceState = yield* workspaceComponent.getState();
          const availableChatApps =
            yield* workspaceComponent.getAvailableChatApps();
          const chatAppsManagerState = yield* chatAppsManager.getState();

          return {
            workspaceState,
            availableChatApps,
            chatAppsManagerState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.workspaceState.isUIRendered).toBe(true);
      expect(result.availableChatApps).toHaveLength(2);
      expect(result.chatAppsManagerState.stats.totalApps).toBeGreaterThan(0);
    });

    it("should handle chat app activation in UI context", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Setup workspace with chat apps
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);
          yield* workspaceComponent.renderWorkspaceUI();

          // Activate a chat app
          yield* workspaceComponent.activateChatApp("chat-1");

          const activeChatApps = yield* workspaceComponent.getActiveChatApps();
          const state = yield* workspaceComponent.getState();

          return {
            activeChatApps,
            isUIRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isUIRendered).toBe(true);
      expect(result.activeChatApps).toHaveLength(1);
      expect(result.activeChatApps[0].id).toBe("chat-1");
    });
  });

  describe("UI Error Handling", () => {
    it("should handle UI rendering errors gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initialize but don't load workspace
          yield* workspaceComponent.initialize(testConfig);

          // Try to render UI without workspace - should fail
          const renderResult = yield* Effect.either(
            workspaceComponent.renderWorkspaceUI()
          );

          // State should remain consistent
          const state = yield* workspaceComponent.getState();

          return {
            renderResult,
            state,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.renderResult._tag).toBe("Left");
      expect(result.state.isUIRendered).toBe(false);
      expect(result.state.isInitialized).toBe(true);
    });

    it("should maintain UI state consistency during errors", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Setup successful UI rendering
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.renderWorkspaceUI();

          const successState = yield* workspaceComponent.getState();

          // Try to activate non-existent chat app - should fail
          const activationResult = yield* Effect.either(
            workspaceComponent.activateChatApp("non-existent")
          );

          // UI state should remain consistent
          const finalState = yield* workspaceComponent.getState();

          return {
            successState,
            activationResult,
            finalState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.successState.isUIRendered).toBe(true);
      expect(result.activationResult._tag).toBe("Left");
      expect(result.finalState.isUIRendered).toBe(true); // Should remain rendered
    });
  });

  describe("UI Performance and Updates", () => {
    it("should handle multiple UI state updates efficiently", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Setup workspace
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.loadChatApps(testChatApps);
          yield* workspaceComponent.loadAgents(testAgents);

          const beforeRender = Date.now();

          // Render UI
          yield* workspaceComponent.renderWorkspaceUI();

          const afterRender = Date.now();

          // Perform multiple state updates
          yield* workspaceComponent.activateChatApp("chat-1");
          yield* workspaceComponent.activateChatApp("chat-2");

          const finalState = yield* workspaceComponent.getState();
          const activeChatApps = yield* workspaceComponent.getActiveChatApps();

          return {
            renderTime: afterRender - beforeRender,
            finalState,
            activeChatApps,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.renderTime).toBeLessThan(1000); // Should be fast
      expect(result.finalState.isUIRendered).toBe(true);
      expect(result.activeChatApps).toHaveLength(2);
    });

    it("should handle configuration updates and re-render", async () => {
      const updatedWorkspaceConfig: WorkspaceConfig = {
        ...testWorkspaceConfig,
        maxExpandedApps: 5,
        description: "Updated workspace description",
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;

          // Initial setup and render
          yield* workspaceComponent.initialize(testConfig);
          yield* workspaceComponent.loadWorkspace(testWorkspaceConfig);
          yield* workspaceComponent.renderWorkspaceUI();

          const initialConfig = yield* workspaceComponent.getWorkspaceConfig();

          // Update workspace configuration
          yield* workspaceComponent.switchWorkspace(updatedWorkspaceConfig);

          const updatedConfig = yield* workspaceComponent.getWorkspaceConfig();
          const state = yield* workspaceComponent.getState();

          return {
            initialConfig,
            updatedConfig,
            isUIStillRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialConfig?.maxExpandedApps).toBe(3);
      expect(result.updatedConfig?.maxExpandedApps).toBe(5);
      expect(result.updatedConfig?.description).toBe(
        "Updated workspace description"
      );
      expect(result.isUIStillRendered).toBe(true);
    });
  });
});
