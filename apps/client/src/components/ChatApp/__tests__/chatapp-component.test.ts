import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect, Layer, TestContext } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { CoreComponent } from "../../core";
import {
  CHATAPP_OPERATIONS,
  ChatAppAgentError,
  ChatAppComponent,
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppConversationError,
  ChatAppLoadError,
  ChatAppUIError,
  ChatAppWindowError,
  createDefaultChatAppState,
  createDefaultUIState,
} from "../index";

describe("ChatAppComponent", () => {
  const testChatAppConfig: ChatAppConfig = {
    id: "test-chatapp",
    name: "Test Chat App",
    description: "A test chat app for component testing",
    type: "chat",
    config: {},
    agentIds: ["agent-1"],
  };

  const testAgents: AgentConfig[] = [
    {
      id: "agent-1",
      name: "Test Agent 1",
      description: "First test agent",
      type: "llm",
      config: {},
    },
    {
      id: "agent-2",
      name: "Test Agent 2",
      description: "Second test agent",
      type: "llm",
      config: {},
    },
    {
      id: "agent-3",
      name: "Test Agent 3",
      description: "Third test agent",
      type: "llm",
      config: {},
    },
  ];

  const testComponentConfig: ChatAppComponentConfig = {
    id: "test-chatapp-component",
    name: "Test ChatApp Component",
    chatAppId: "test-chatapp",
  };

  const TestLayer = Layer.provide(
    ChatAppComponent.Default,
    CoreComponent.Default
  );

  beforeEach(() => {
    // Reset any global state if needed
  });

  describe("initialization", () => {
    it("should initialize with default state", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        const state = yield* chatAppComponent.getState();

        expect(state.isInitialized).toBe(true);
        expect(state.chatAppConfig).toBe(null);
        expect(state.assignedAgents).toEqual([]);
        expect(state.isChatAppLoaded).toBe(false);
        expect(state.isUIRendered).toBe(false);
        expect(state.conversationCount).toBe(0);
        expect(state.uiState.windowSize).toEqual(
          testComponentConfig.defaultWindowSize || { width: 800, height: 600 }
        );
        expect(state.uiState.windowPosition).toEqual(
          testComponentConfig.defaultWindowPosition || { x: 100, y: 100 }
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should handle initialization errors", async () => {
      const invalidConfig = {
        ...testComponentConfig,
        chatAppId: "", // Invalid empty ID
      };

      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(invalidConfig);
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer)))
      ).rejects.toThrow();
    });
  });

  describe("chat app configuration", () => {
    it("should load chat app configuration", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        const config = yield* chatAppComponent.getChatAppConfig();
        const state = yield* chatAppComponent.getState();

        expect(config).toEqual(testChatAppConfig);
        expect(state.isChatAppLoaded).toBe(true);
        expect(state.chatAppConfig).toEqual(testChatAppConfig);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should validate chat app configuration", async () => {
      const invalidConfig = {
        ...testChatAppConfig,
        id: "", // Invalid empty ID
      };

      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.loadChatApp(invalidConfig);
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer)))
      ).rejects.toThrow("Chat app must have an ID");
    });

    it("should reload chat app configuration", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.loadChatApp(testChatAppConfig);
        yield* chatAppComponent.reloadChatApp();

        const config = yield* chatAppComponent.getChatAppConfig();
        expect(config).toEqual(testChatAppConfig);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should fail to reload when no config is loaded", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.reloadChatApp();
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer)))
      ).rejects.toThrow("No chat app config to reload");
    });
  });

  describe("agent management", () => {
    it("should load agents for chat app", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.loadAgents(testAgents);

        const assignedAgents = yield* chatAppComponent.getAssignedAgents();

        expect(assignedAgents).toHaveLength(1); // Only agent-1 is assigned to this chatapp
        expect(assignedAgents.map((a) => a.id)).toEqual(["agent-1"]);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should check if chat app has specific agent", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);
        yield* chatAppComponent.loadAgents(testAgents);

        const hasAgent1 = yield* chatAppComponent.hasAgent("agent-1");
        const hasAgent3 = yield* chatAppComponent.hasAgent("agent-3");

        expect(hasAgent1).toBe(true);
        expect(hasAgent3).toBe(false); // agent-3 is not assigned to this chatapp
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should fail to load agents without chat app", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.loadAgents(testAgents);
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer)))
      ).rejects.toThrow("No chat app loaded");
    });
  });

  describe("window management", () => {
    it("should open and close window", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        // Initially closed
        let isOpen = yield* chatAppComponent.isWindowOpen();
        expect(isOpen).toBe(false);

        // Open window
        yield* chatAppComponent.openWindow();
        isOpen = yield* chatAppComponent.isWindowOpen();
        expect(isOpen).toBe(true);

        const windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.isOpen).toBe(true);
        expect(windowState.isFocused).toBe(true);

        // Close window
        yield* chatAppComponent.closeWindow();
        isOpen = yield* chatAppComponent.isWindowOpen();
        expect(isOpen).toBe(false);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should minimize and restore window", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.openWindow();

        // Minimize
        yield* chatAppComponent.minimizeWindow();
        let windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.isMinimized).toBe(true);
        expect(windowState.isFocused).toBe(false);

        // Restore
        yield* chatAppComponent.restoreWindow();
        windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.isMinimized).toBe(false);
        expect(windowState.isFocused).toBe(true);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should maximize and restore window", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.openWindow();

        // Maximize
        yield* chatAppComponent.maximizeWindow();
        let windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.isMaximized).toBe(true);
        expect(windowState.isFocused).toBe(true);

        // Restore
        yield* chatAppComponent.restoreWindow();
        windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.isMaximized).toBe(false);
        expect(windowState.isFocused).toBe(true);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should move and resize window", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.openWindow();

        // Move window
        const newPosition = { x: 300, y: 250 };
        yield* chatAppComponent.moveWindow(newPosition);

        let windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.position).toEqual(newPosition);

        // Resize window
        const newSize = { width: 1200, height: 800 };
        yield* chatAppComponent.resizeWindow(newSize);

        windowState = yield* chatAppComponent.getWindowState();
        expect(windowState.size).toEqual(newSize);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should focus and blur window", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.openWindow();

        // Focus window
        yield* chatAppComponent.focusWindow();
        let isFocused = yield* chatAppComponent.isWindowFocused();
        expect(isFocused).toBe(true);

        // Blur window
        yield* chatAppComponent.blurWindow();
        isFocused = yield* chatAppComponent.isWindowFocused();
        expect(isFocused).toBe(false);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("UI rendering", () => {
    it("should render chat app UI", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.renderChatAppUI();

        const isRendered = yield* chatAppComponent.isUIRendered();
        expect(isRendered).toBe(true);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should fail to render UI without chat app", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        yield* chatAppComponent.renderChatAppUI();
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer)))
      ).rejects.toThrow("Cannot render UI before chat app is loaded");
    });
  });

  describe("conversation management", () => {
    it("should start and end conversations", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        // Start conversation
        yield* chatAppComponent.startConversation();

        let count = yield* chatAppComponent.getConversationCount();
        expect(count).toBe(1);

        // Start another conversation
        yield* chatAppComponent.startConversation();
        count = yield* chatAppComponent.getConversationCount();
        expect(count).toBe(2);

        // End conversation
        yield* chatAppComponent.endConversation();
        // Note: ending doesn't decrease count, it just logs the end
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should track activity", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        const initialActivity = yield* chatAppComponent.getLastActivity();

        // Wait a bit and update activity
        yield* Effect.sleep(10);
        yield* chatAppComponent.updateActivity();

        const newActivity = yield* chatAppComponent.getLastActivity();
        expect(newActivity).toBeGreaterThan(initialActivity);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("operation tracking", () => {
    it("should track operations", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.executeOperation(
          CHATAPP_OPERATIONS.OPEN_WINDOW
        );

        const lastOperation = yield* chatAppComponent.getLastOperation();
        expect(lastOperation).toBe(CHATAPP_OPERATIONS.OPEN_WINDOW);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("state management", () => {
    it("should get and set state", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        const initialState = yield* chatAppComponent.getState();
        expect(initialState.isInitialized).toBe(true);

        // Add small delay to ensure timestamp difference
        yield* Effect.sleep(1);

        yield* chatAppComponent.setState({
          conversationCount: 5,
        });

        const updatedState = yield* chatAppComponent.getState();
        expect(updatedState.conversationCount).toBe(5);
        expect(updatedState.lastUpdated).toBeGreaterThan(
          initialState.lastUpdated
        );
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should manage UI state", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);

        const initialUIState = yield* chatAppComponent.getUIState();
        expect(initialUIState.isWindowOpen).toBe(false);

        yield* chatAppComponent.setUIState({
          isWindowOpen: true,
          zIndex: 10,
        });

        const updatedUIState = yield* chatAppComponent.getUIState();
        expect(updatedUIState.isWindowOpen).toBe(true);
        expect(updatedUIState.zIndex).toBe(10);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("cleanup", () => {
    it("should cleanup properly", async () => {
      const program = Effect.gen(function* () {
        const chatAppComponent = yield* ChatAppComponent;
        yield* chatAppComponent.initialize(testComponentConfig);
        yield* chatAppComponent.loadChatApp(testChatAppConfig);

        yield* chatAppComponent.cleanup();

        const state = yield* chatAppComponent.getState();
        expect(state).toEqual(createDefaultChatAppState());

        const lastOperation = yield* chatAppComponent.getLastOperation();
        expect(lastOperation).toBe(null);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer))
      );
      expect(result).toBeUndefined();
    });
  });
});
