import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoreComponent } from "../../core";
import { ChatAppComponent } from "../index";
import type {
  ChatAppComponentConfig,
  WindowPosition,
  WindowSize,
} from "../types";

// Mock fetch for testing
const mockFetch = vi.fn() as any;
mockFetch.preconnect = vi.fn();
global.fetch = mockFetch;

describe("ChatAppComponent UI Integration", () => {
  // Test data
  const testChatAppConfig: ChatAppConfig = {
    id: "test-chatapp",
    name: "Test Chat App",
    description: "A test chat app for UI integration",
    version: "1.0.0",
    agentId: "agent-1",
    toolbarId: "default-toolbar",
    themeId: "default-theme",
    workspaceId: "test-workspace",
    isDefault: false,
    isShared: false,
    isArchived: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const testAgents: AgentConfig[] = [
    {
      id: "agent-1",
      name: "Test Agent 1",
      description: "Primary agent for chat app",
      version: "1.0.0",
      provider: "openai",
      model: "gpt-4",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "agent-2",
      name: "Test Agent 2",
      description: "Secondary agent for testing",
      version: "1.0.0",
      provider: "anthropic",
      model: "claude-3",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const testConfig: ChatAppComponentConfig = {
    id: "test-chatapp-component",
    name: "Test ChatApp Component",
    chatAppId: "test-chatapp",
    autoLoadAgents: true,
    autoRenderUI: false,
    debugMode: true,
    defaultWindowSize: { width: 800, height: 600 },
    defaultWindowPosition: { x: 100, y: 100 },
  };

  // Create proper layer composition
  const TestLayer = Layer.mergeAll(
    CoreComponent.Default,
    ChatAppComponent.Default
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UI Rendering Lifecycle", () => {
    it("should initialize chatapp component for UI rendering", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize component
          yield* chatAppComponent.initialize(testConfig);
          const state = yield* chatAppComponent.getState();

          return {
            isInitialized: state.isInitialized,
            isUIRendered: state.isUIRendered,
            isChatAppLoaded: state.isChatAppLoaded,
            windowSize: state.uiState.windowSize,
            windowPosition: state.uiState.windowPosition,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isInitialized).toBe(true);
      expect(result.isUIRendered).toBe(false);
      expect(result.isChatAppLoaded).toBe(false);
      expect(result.windowSize).toEqual(testConfig.defaultWindowSize);
      expect(result.windowPosition).toEqual(testConfig.defaultWindowPosition);
    });

    it("should load chatapp configuration before rendering UI", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize and load chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);

          const state = yield* chatAppComponent.getState();
          const config = yield* chatAppComponent.getChatAppConfig();

          return {
            state,
            config,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.state.isChatAppLoaded).toBe(true);
      expect(result.config?.id).toBe("test-chatapp");
      expect(result.config?.name).toBe("Test Chat App");
    });

    it("should render chatapp UI after chatapp is loaded", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize, load chatapp, then render UI
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.renderChatAppUI();

          const isRendered = yield* chatAppComponent.isUIRendered();
          const state = yield* chatAppComponent.getState();

          return {
            isRendered,
            isChatAppLoaded: state.isChatAppLoaded,
            isUIRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.isRendered).toBe(true);
      expect(result.isChatAppLoaded).toBe(true);
      expect(result.isUIRendered).toBe(true);
    });

    it("should fail to render UI without loaded chatapp", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize but don't load chatapp
          yield* chatAppComponent.initialize(testConfig);

          // Try to render UI - should fail
          const renderResult = yield* Effect.either(
            chatAppComponent.renderChatAppUI()
          );

          return {
            renderResult,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.renderResult._tag).toBe("Left");
      if (result.renderResult._tag === "Left") {
        expect(result.renderResult.left.message).toContain(
          "Cannot render UI before chat app is loaded"
        );
      }
    });
  });

  describe("Window Management UI", () => {
    it("should manage window open/close states", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);

          // Initially window should be closed
          const initialOpen = yield* chatAppComponent.isWindowOpen();

          // Open window
          yield* chatAppComponent.openWindow();
          const afterOpen = yield* chatAppComponent.isWindowOpen();

          // Close window
          yield* chatAppComponent.closeWindow();
          const afterClose = yield* chatAppComponent.isWindowOpen();

          return {
            initialOpen,
            afterOpen,
            afterClose,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialOpen).toBe(false);
      expect(result.afterOpen).toBe(true);
      expect(result.afterClose).toBe(false);
    });

    it("should handle window minimize/maximize operations", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp and open window
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.openWindow();

          // Get initial window state
          const initialState = yield* chatAppComponent.getWindowState();

          // Minimize window
          yield* chatAppComponent.minimizeWindow();
          const minimizedState = yield* chatAppComponent.getWindowState();

          // Maximize window
          yield* chatAppComponent.maximizeWindow();
          const maximizedState = yield* chatAppComponent.getWindowState();

          // Restore window
          yield* chatAppComponent.restoreWindow();
          const restoredState = yield* chatAppComponent.getWindowState();

          return {
            initialState,
            minimizedState,
            maximizedState,
            restoredState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialState.isMinimized).toBe(false);
      expect(result.initialState.isMaximized).toBe(false);

      expect(result.minimizedState.isMinimized).toBe(true);
      expect(result.maximizedState.isMaximized).toBe(true);

      expect(result.restoredState.isMinimized).toBe(false);
      expect(result.restoredState.isMaximized).toBe(false);
    });

    it("should handle window positioning and sizing", async () => {
      const newPosition: WindowPosition = { x: 200, y: 300 };
      const newSize: WindowSize = { width: 1000, height: 800 };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.openWindow();

          // Get initial state
          const initialState = yield* chatAppComponent.getWindowState();

          // Move window
          yield* chatAppComponent.moveWindow(newPosition);
          const afterMove = yield* chatAppComponent.getWindowState();

          // Resize window
          yield* chatAppComponent.resizeWindow(newSize);
          const afterResize = yield* chatAppComponent.getWindowState();

          return {
            initialState,
            afterMove,
            afterResize,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialState.position).toEqual(
        testConfig.defaultWindowPosition
      );
      expect(result.initialState.size).toEqual(testConfig.defaultWindowSize);

      expect(result.afterMove.position).toEqual(newPosition);
      expect(result.afterResize.size).toEqual(newSize);
    });

    it("should handle window focus and blur", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);

          // Initially window should not be focused (not open yet)
          const beforeOpen = yield* chatAppComponent.isWindowFocused();

          // Open window (should auto-focus)
          yield* chatAppComponent.openWindow();
          const afterOpen = yield* chatAppComponent.isWindowFocused();

          // Blur window
          yield* chatAppComponent.blurWindow();
          const afterBlur = yield* chatAppComponent.isWindowFocused();

          // Focus window again
          yield* chatAppComponent.focusWindow();
          const afterFocus = yield* chatAppComponent.isWindowFocused();

          return {
            beforeOpen,
            afterOpen,
            afterBlur,
            afterFocus,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.beforeOpen).toBe(false);
      expect(result.afterOpen).toBe(true); // Opening window should focus it
      expect(result.afterBlur).toBe(false);
      expect(result.afterFocus).toBe(true);
    });
  });

  describe("Agent Integration UI", () => {
    it("should render UI with loaded agents", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize and load chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);

          // Load agents
          yield* chatAppComponent.loadAgents(testAgents);

          // Render UI
          yield* chatAppComponent.renderChatAppUI();

          // Get state
          const state = yield* chatAppComponent.getState();
          const assignedAgents = yield* chatAppComponent.getAssignedAgents();
          const hasAgent1 = yield* chatAppComponent.hasAgent("agent-1");
          const hasAgent3 = yield* chatAppComponent.hasAgent("agent-3");

          return {
            state,
            assignedAgents,
            hasAgent1,
            hasAgent3,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.state.isUIRendered).toBe(true);
      expect(result.assignedAgents).toHaveLength(1); // Only agent-1 is assigned to this chatapp
      expect(result.assignedAgents[0].id).toBe("agent-1");
      expect(result.hasAgent1).toBe(true);
      expect(result.hasAgent3).toBe(false); // agent-3 is not assigned to this chatapp
    });

    it("should handle agent changes in UI context", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp with agents
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.loadAgents(testAgents);
          yield* chatAppComponent.renderChatAppUI();

          // Initial agents
          const initialAgents = yield* chatAppComponent.getAssignedAgents();

          // Reload with different agents (only agent-2)
          const updatedChatAppConfig = {
            ...testChatAppConfig,
            name: "Updated Chat App",
            description: "Updated description for testing",
            agentId: "agent-2",
            toolbarId: "default-toolbar",
            themeId: "default-theme",
          };
          yield* chatAppComponent.loadChatApp(updatedChatAppConfig);
          yield* chatAppComponent.loadAgents(testAgents);

          const updatedAgents = yield* chatAppComponent.getAssignedAgents();
          const state = yield* chatAppComponent.getState();

          return {
            initialAgents,
            updatedAgents,
            isUIStillRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialAgents).toHaveLength(1);
      expect(result.initialAgents[0].id).toBe("agent-1");

      expect(result.updatedAgents).toHaveLength(1);
      expect(result.updatedAgents[0].id).toBe("agent-2");

      expect(result.isUIStillRendered).toBe(true);
    });
  });

  describe("Conversation Management UI", () => {
    it("should track conversations in UI context", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.renderChatAppUI();

          // Initial conversation count
          const initialCount = yield* chatAppComponent.getConversationCount();

          // Start conversations
          yield* chatAppComponent.startConversation();
          const afterFirst = yield* chatAppComponent.getConversationCount();

          yield* chatAppComponent.startConversation();
          const afterSecond = yield* chatAppComponent.getConversationCount();

          // End a conversation
          yield* chatAppComponent.endConversation();
          const afterEnd = yield* chatAppComponent.getConversationCount();

          return {
            initialCount,
            afterFirst,
            afterSecond,
            afterEnd,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialCount).toBe(0);
      expect(result.afterFirst).toBe(1);
      expect(result.afterSecond).toBe(2);
      expect(result.afterEnd).toBe(1);
    });

    it("should track activity updates", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.renderChatAppUI();

          // Get initial activity
          const initialActivity = yield* chatAppComponent.getLastActivity();

          // Wait a bit and update activity
          yield* Effect.sleep("10 millis");
          yield* chatAppComponent.updateActivity();

          const updatedActivity = yield* chatAppComponent.getLastActivity();

          return {
            initialActivity,
            updatedActivity,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.updatedActivity).toBeGreaterThan(result.initialActivity);
    });
  });

  describe("UI State Management", () => {
    it("should track UI state changes comprehensively", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize
          yield* chatAppComponent.initialize(testConfig);
          const initialState = yield* chatAppComponent.getState();

          // Load chatapp
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          const loadedState = yield* chatAppComponent.getState();

          // Render UI
          yield* chatAppComponent.renderChatAppUI();
          const renderedState = yield* chatAppComponent.getState();

          // Open window
          yield* chatAppComponent.openWindow();
          const windowOpenState = yield* chatAppComponent.getState();

          return {
            initialState,
            loadedState,
            renderedState,
            windowOpenState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      // Initial state
      expect(result.initialState.isInitialized).toBe(true);
      expect(result.initialState.isChatAppLoaded).toBe(false);
      expect(result.initialState.isUIRendered).toBe(false);
      expect(result.initialState.uiState.isWindowOpen).toBe(false);

      // After loading chatapp
      expect(result.loadedState.isChatAppLoaded).toBe(true);
      expect(result.loadedState.isUIRendered).toBe(false);

      // After rendering UI
      expect(result.renderedState.isUIRendered).toBe(true);
      expect(result.renderedState.uiState.isWindowOpen).toBe(false);

      // After opening window
      expect(result.windowOpenState.uiState.isWindowOpen).toBe(true);
    });

    it("should handle UI state updates correctly", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);

          // Get initial UI state
          const initialUIState = yield* chatAppComponent.getUIState();

          // Update UI state
          yield* chatAppComponent.setUIState({
            isWindowOpen: true,
            isFocused: true,
            zIndex: 999,
            windowPosition: { x: 300, y: 400 },
          });

          const updatedUIState = yield* chatAppComponent.getUIState();

          return {
            initialUIState,
            updatedUIState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialUIState.isWindowOpen).toBe(false);
      expect(result.initialUIState.isFocused).toBe(false);
      expect(result.initialUIState.zIndex).not.toBe(999);

      expect(result.updatedUIState.isWindowOpen).toBe(true);
      expect(result.updatedUIState.isFocused).toBe(true);
      expect(result.updatedUIState.zIndex).toBe(999);
      expect(result.updatedUIState.windowPosition).toEqual({ x: 300, y: 400 });
    });
  });

  describe("UI Error Handling", () => {
    it("should handle UI rendering errors gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initialize but don't load chatapp
          yield* chatAppComponent.initialize(testConfig);

          // Try to render UI without chatapp - should fail
          const renderResult = yield* Effect.either(
            chatAppComponent.renderChatAppUI()
          );

          // State should remain consistent
          const state = yield* chatAppComponent.getState();

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
          const chatAppComponent = yield* ChatAppComponent;

          // Setup successful UI rendering
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.renderChatAppUI();

          const successState = yield* chatAppComponent.getState();

          // Try to load invalid chatapp config - should fail
          const invalidConfig = { ...testChatAppConfig, id: "" };
          const loadResult = yield* Effect.either(
            chatAppComponent.loadChatApp(invalidConfig)
          );

          // UI state should remain consistent
          const finalState = yield* chatAppComponent.getState();

          return {
            successState,
            loadResult,
            finalState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.successState.isUIRendered).toBe(true);
      expect(result.loadResult._tag).toBe("Left");
      expect(result.finalState.isUIRendered).toBe(true); // Should remain rendered
      expect(result.finalState.chatAppConfig?.id).toBe("test-chatapp"); // Should keep original config
    });
  });

  describe("UI Performance and Complex Operations", () => {
    it("should handle multiple UI operations efficiently", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Setup chatapp
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.loadAgents(testAgents);

          const beforeRender = Date.now();

          // Render UI
          yield* chatAppComponent.renderChatAppUI();

          const afterRender = Date.now();

          // Perform multiple window operations
          yield* chatAppComponent.openWindow();
          yield* chatAppComponent.focusWindow();
          yield* chatAppComponent.moveWindow({ x: 500, y: 500 });
          yield* chatAppComponent.resizeWindow({ width: 1200, height: 900 });

          // Start conversations
          yield* chatAppComponent.startConversation();
          yield* chatAppComponent.startConversation();

          const finalState = yield* chatAppComponent.getState();
          const windowState = yield* chatAppComponent.getWindowState();

          return {
            renderTime: afterRender - beforeRender,
            finalState,
            windowState,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.renderTime).toBeLessThan(1000); // Should be fast
      expect(result.finalState.isUIRendered).toBe(true);
      expect(result.finalState.conversationCount).toBe(2);
      expect(result.windowState.isOpen).toBe(true);
      expect(result.windowState.isFocused).toBe(true);
      // Position is validated to fit within screen bounds (1920x1080 screen, 1200x900 window)
      // Max Y = 1080 - 900 = 180, so Y gets clamped from 500 to 180
      expect(result.windowState.position).toEqual({ x: 500, y: 180 });
      expect(result.windowState.size).toEqual({ width: 1200, height: 900 });
    });

    it("should handle chatapp reconfiguration and re-render", async () => {
      const updatedChatAppConfig = {
        ...testChatAppConfig,
        name: "Updated Chat App",
        description: "Updated description for testing",
        agentId: "agent-2",
        toolbarId: "default-toolbar",
        themeId: "default-theme",
      };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const chatAppComponent = yield* ChatAppComponent;

          // Initial setup and render
          yield* chatAppComponent.initialize(testConfig);
          yield* chatAppComponent.loadChatApp(testChatAppConfig);
          yield* chatAppComponent.loadAgents(testAgents);
          yield* chatAppComponent.renderChatAppUI();

          const initialConfig = yield* chatAppComponent.getChatAppConfig();
          const initialAgents = yield* chatAppComponent.getAssignedAgents();

          // Update chatapp configuration
          yield* chatAppComponent.loadChatApp(updatedChatAppConfig);
          yield* chatAppComponent.loadAgents(testAgents);

          const updatedConfig = yield* chatAppComponent.getChatAppConfig();
          const updatedAgents = yield* chatAppComponent.getAssignedAgents();
          const state = yield* chatAppComponent.getState();

          return {
            initialConfig,
            initialAgents,
            updatedConfig,
            updatedAgents,
            isUIStillRendered: state.isUIRendered,
          };
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.initialConfig?.name).toBe("Test Chat App");
      expect(result.initialAgents[0].id).toBe("agent-1");

      expect(result.updatedConfig?.name).toBe("Updated Chat App");
      expect(result.updatedConfig?.description).toBe(
        "Updated description for testing"
      );
      expect(result.updatedAgents[0].id).toBe("agent-2");

      expect(result.isUIStillRendered).toBe(true);
    });
  });
});
