import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatManager } from "../../src/managers/chat/service";
import { ChatAppsManager } from "../../src/managers/chatapps/service";
import { CoreManager } from "../../src/managers/core/service";
import { ConfigService } from "../../src/services/config/service";

// Chat commands
import {
  SendMessage,
  SetChatState,
  StartConversation,
} from "../../src/managers/chat/commands";

// ChatApps commands
import {
  ExpandChatApp,
  RegisterChatApp,
  SetChatAppStatus,
} from "../../src/managers/chatapps/commands";

// Core commands
import {
  InitializeCoreManager,
  SetCoreState,
  StartCoreManager,
} from "../../src/managers/core/commands";

describe("Command-Driven Architecture Integration", () => {
  const testLayer = Layer.mergeAll(
    ConfigService.Default,
    ChatManager.Default,
    ChatAppsManager.Default,
    CoreManager.Default
  );

  it("should handle CoreManager commands", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;

      // Test initialization command
      yield* coreManager.dispatch(
        new InitializeCoreManager({
          _tag: "InitializeCoreManager",
          config: {
            id: "test-core",
            name: "Test Core Manager",
            autoStart: true,
            debugMode: true,
          },
        })
      );

      // Wait a bit for async command processing
      yield* Effect.sleep("100 millis");

      // Verify state was updated
      const state = yield* coreManager.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isRunning).toBe(true); // autoStart was true

      // Test state update command
      yield* coreManager.dispatch(
        new SetCoreState({
          _tag: "SetCoreState",
          updates: { isLoading: true },
        })
      );

      yield* Effect.sleep("100 millis");

      const updatedState = yield* coreManager.getState();
      expect(updatedState.isLoading).toBe(true);

      // Test start command (should be idempotent)
      yield* coreManager.dispatch(
        new StartCoreManager({
          _tag: "StartCoreManager",
        })
      );

      yield* Effect.sleep("100 millis");

      const finalState = yield* coreManager.getState();
      expect(finalState.isRunning).toBe(true);
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });

  it("should handle ChatManager commands", async () => {
    const program = Effect.gen(function* () {
      const chatManager = yield* ChatManager;

      // Test state update command
      yield* chatManager.dispatch(
        new SetChatState({
          _tag: "SetChatState",
          updates: { isLoading: true },
        })
      );

      yield* Effect.sleep("100 millis");

      const state = yield* chatManager.getState();
      expect(state.isLoading).toBe(true);

      // Test conversation creation command
      const conversationId = `conv_${Date.now()}_test`;
      yield* chatManager.dispatch(
        new StartConversation({
          _tag: "StartConversation",
          conversationId,
          agentId: "test-agent",
          title: "Test Conversation",
        })
      );

      yield* Effect.sleep("100 millis");

      const conversations = yield* chatManager.getAllConversations();
      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations[0].title).toBe("Test Conversation");

      // Test message sending command
      const testConversationId = conversations[0].id;
      const messageId = `msg_${Date.now()}_test`;
      yield* chatManager.dispatch(
        new SendMessage({
          _tag: "SendMessage",
          messageId,
          conversationId: testConversationId,
          content: "Hello, test message!",
        })
      );

      yield* Effect.sleep("100 millis");

      const messages = yield* chatManager.getMessages(testConversationId);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].content).toBe("Hello, test message!");
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });

  it("should handle ChatAppsManager commands", async () => {
    const program = Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Test app registration command
      yield* chatAppsManager.dispatch(
        new RegisterChatApp({
          _tag: "RegisterChatApp",
          workspaceId: "test-workspace",
          appId: "test-app",
          config: { name: "Test App" },
        })
      );

      yield* Effect.sleep("100 millis");

      const apps = yield* chatAppsManager.getAllChatApps();
      expect(apps.length).toBeGreaterThan(0);
      expect(apps[0].id).toBe("test-app");
      expect(apps[0].workspaceId).toBe("test-workspace");

      // Test status change command
      yield* chatAppsManager.dispatch(
        new SetChatAppStatus({
          _tag: "SetChatAppStatus",
          appId: "test-app",
          status: "expanded",
        })
      );

      yield* Effect.sleep("100 millis");

      const app = yield* chatAppsManager.getChatAppInstance("test-app");
      expect(app.status).toBe("expanded");

      // Test expand command (should be idempotent)
      yield* chatAppsManager.dispatch(
        new ExpandChatApp({
          _tag: "ExpandChatApp",
          appId: "test-app",
        })
      );

      yield* Effect.sleep("100 millis");

      const expandedApp = yield* chatAppsManager.getChatAppInstance("test-app");
      expect(expandedApp.status).toBe("expanded");
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });

  it("should handle commands across all managers simultaneously", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      const chatManager = yield* ChatManager;
      const chatAppsManager = yield* ChatAppsManager;

      // Dispatch commands to all managers simultaneously
      yield* Effect.all([
        coreManager.dispatch(
          new InitializeCoreManager({
            _tag: "InitializeCoreManager",
            config: {
              id: "multi-test-core",
              name: "Multi Test Core",
              autoStart: false,
            },
          })
        ),
        chatManager.dispatch(
          new StartConversation({
            _tag: "StartConversation",
            conversationId: `conv_${Date.now()}_multi`,
            agentId: "multi-test-agent",
            title: "Multi Test Conversation",
          })
        ),
        chatAppsManager.dispatch(
          new RegisterChatApp({
            _tag: "RegisterChatApp",
            workspaceId: "multi-test-workspace",
            appId: "multi-test-app",
            config: { name: "Multi Test App" },
          })
        ),
      ]);

      // Wait for async processing
      yield* Effect.sleep("200 millis");

      // Verify all operations completed successfully
      const coreState = yield* coreManager.getState();
      expect(coreState.isInitialized).toBe(true);

      const conversations = yield* chatManager.getAllConversations();
      const multiTestConv = conversations.find(
        (c) => c.title === "Multi Test Conversation"
      );
      expect(multiTestConv).toBeDefined();

      const apps = yield* chatAppsManager.getAllChatApps();
      const multiTestApp = apps.find((a) => a.id === "multi-test-app");
      expect(multiTestApp).toBeDefined();
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });

  it("should maintain backward compatibility with direct method calls", async () => {
    const program = Effect.gen(function* () {
      const coreManager = yield* CoreManager;
      const chatManager = yield* ChatManager;
      const chatAppsManager = yield* ChatAppsManager;

      // Test direct method calls still work
      yield* coreManager.initialize({
        id: "direct-test-core",
        name: "Direct Test Core",
        autoStart: true,
      });

      const coreState = yield* coreManager.getState();
      expect(coreState.isInitialized).toBe(true);
      expect(coreState.isRunning).toBe(true);

      // Test chat manager direct methods
      const conversationId = yield* chatManager.startConversation(
        "direct-agent",
        "Direct Test Message"
      );

      // Wait for async command processing
      yield* Effect.sleep("100 millis");

      const conversation = yield* chatManager.getConversation(conversationId);
      expect(conversation.id).toBe(conversationId);

      // Test chat apps manager direct methods
      const app = yield* chatAppsManager.registerChatApp(
        "direct-workspace",
        "direct-app",
        { name: "Direct Test App" }
      );
      expect(app.id).toBe("direct-app");
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });

  it("should handle command errors gracefully", async () => {
    const program = Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager;

      // Try to operate on non-existent app
      yield* chatAppsManager.dispatch(
        new SetChatAppStatus({
          _tag: "SetChatAppStatus",
          appId: "non-existent-app",
          status: "expanded",
        })
      );

      yield* Effect.sleep("100 millis");

      // Should not crash, error should be handled gracefully
      const state = yield* chatAppsManager.getState();
      expect(state.lastError).toBeDefined();
      expect(state.lastError).toContain("not found");
    });

    await Effect.runPromise(Effect.provide(program, testLayer));
  });
});
