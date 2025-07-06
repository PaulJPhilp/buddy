import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { ChatManager } from "../service";
import { UrlService } from "../../../services/url";
import { WebSocketService } from "../../../services/websocket";
import { ChatService } from "../../../services/chat";
import { AgentRegistryService } from "../../../services/agent-registry";
import {
  ChatManagerOperationError,
  ChatInstanceNotFoundError,
  NoChatActiveError,
} from "../errors";

describe("ChatManager - Lifecycle Operations", () => {
  const TestLayer = Layer.mergeAll(
    NodeFileSystem.layer,
    UrlService.Default,
    WebSocketService.Default,
    ChatService.Default,
    AgentRegistryService.Default,
    ChatManager.Default
  );

  let cleanup: (() => Effect.Effect<void>) | null = null;

  beforeEach(async () => {
    cleanup = null;
  });

  afterEach(async () => {
    if (cleanup) {
      await Effect.runPromise(cleanup().pipe(Effect.provide(TestLayer)));
    }
  });

  describe("initializeChatInstance", () => {
    test("should initialize chat instance successfully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat instance
        yield* manager.initializeChatInstance("test-chat-1");

        // Verify the chat was initialized
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.chatId).toBe("test-chat-1");
        expect(chatState.connectionState).toBe("connected");

        // Verify it appears in the state
        const state = yield* manager.getState();
        expect(state.activeChats).toContain("test-chat-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize chat with specific agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat with specific agent
        yield* manager.initializeChatInstance("test-chat-1", "agent-assistant");

        // Verify the chat was initialized with correct agent
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.agentId).toBe("agent-assistant");
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle multiple chat instances", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.initializeChatInstance("test-chat-3");

        // Verify all chats exist
        const state = yield* manager.getState();
        expect(state.activeChats).toContain("test-chat-1");
        expect(state.activeChats).toContain("test-chat-2");
        expect(state.activeChats).toContain("test-chat-3");

        // Verify each chat state
        const chat1State = yield* manager.getChatState("test-chat-1");
        const chat2State = yield* manager.getChatState("test-chat-2");
        const chat3State = yield* manager.getChatState("test-chat-3");

        expect(chat1State.connectionState).toBe("connected");
        expect(chat2State.connectionState).toBe("connected");
        expect(chat3State.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("closeChatInstance", () => {
    test("should close specific chat instance", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");

        // Close one chat
        yield* manager.closeChatInstance("test-chat-1");

        // Verify the specific chat was closed
        const result = yield* Effect.either(
          manager.getChatState("test-chat-1")
        );
        expect(result._tag).toBe("Left");

        // Verify other chat still exists
        const chat2State = yield* manager.getChatState("test-chat-2");
        expect(chat2State).toBeDefined();
        expect(chat2State.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle closing non-existent chat gracefully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to close non-existent chat - should succeed gracefully (no-op)
        yield* manager.closeChatInstance("non-existent-chat");

        // Verify state remains unchanged
        const state = yield* manager.getState();
        expect(state.activeChats).toHaveLength(0);
        expect(state.activeChatId).toBeNull();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("closeAllChatInstances", () => {
    test("should close all chat instances", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.initializeChatInstance("test-chat-3");

        // Close all chats
        yield* manager.clearAllChats();

        // Verify all chats are closed
        const state = yield* manager.getState();
        expect(state.activeChats).toHaveLength(0);
        expect(state.activeChatId).toBeNull();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
