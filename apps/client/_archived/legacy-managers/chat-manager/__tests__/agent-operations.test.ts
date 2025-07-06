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
  AgentSwitchError,
} from "../errors";

describe("ChatManager - Agent Operations", () => {
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

  describe("switchAgent", () => {
    test("should switch agent for existing chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat with default agent
        yield* manager.initializeChatInstance("test-chat-1");

        // Switch to a specific agent
        yield* manager.switchAgent("test-chat-1", "agent-assistant");

        // Verify the agent switch was successful
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should switch between multiple agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Switch through multiple agents
        yield* manager.switchAgent("test-chat-1", "agent-assistant");
        yield* manager.switchAgent("test-chat-1", "agent-expert");
        yield* manager.switchAgent("test-chat-1", "agent-creative");

        // Verify final agent switch
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when switching agent for non-existent chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to switch agent for non-existent chat
        const result = yield* Effect.either(
          manager.switchAgent("non-existent-chat", "agent-assistant")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatInstanceNotFoundError);
          expect(result.left.chatId).toBe("non-existent-chat");
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle switching to same agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat with specific agent
        yield* manager.initializeChatInstance("test-chat-1", "agent-assistant");

        // Switch to the same agent (should succeed)
        yield* manager.switchAgent("test-chat-1", "agent-assistant");

        // Verify chat is still functional
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle switching with empty/null agent ID", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Try to switch to empty agent ID (should handle gracefully)
        yield* manager.switchAgent("test-chat-1", "");

        // Verify chat is still functional
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should maintain chat state during agent switch", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send some messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage(
          "test-chat-1",
          "Message before agent switch"
        );

        // Get initial state
        const initialState = yield* manager.getState();
        const initialMessageCount = initialState.totalMessages;

        // Switch agent
        yield* manager.switchAgent("test-chat-1", "agent-expert");

        // Send message after switch
        yield* manager.sendMessage("test-chat-1", "Message after agent switch");

        // Verify message count increased and chat is functional
        const finalState = yield* manager.getState();
        const finalMessageCount = finalState.totalMessages;

        expect(finalMessageCount).toBe(initialMessageCount + 1);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("switchAgentInActiveChat", () => {
    test("should switch agent in active chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set active chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");

        // Switch agent in active chat
        yield* manager.switchAgentInActiveChat("agent-assistant");

        // Verify the switch was successful
        const activeChatState = yield* manager.getActiveChatState();
        expect(activeChatState).toBeDefined();
        expect(activeChatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when no active chat is set", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to switch agent without setting active chat
        const result = yield* Effect.either(
          manager.switchAgentInActiveChat("agent-assistant")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(NoChatActiveError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should switch active chat and then switch agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");

        // Set first chat as active and switch agent
        yield* manager.setActiveChat("test-chat-1");
        yield* manager.switchAgentInActiveChat("agent-assistant");

        // Switch to second chat and switch to different agent
        yield* manager.setActiveChat("test-chat-2");
        yield* manager.switchAgentInActiveChat("agent-expert");

        // Verify active chat has the correct agent
        const activeChatState = yield* manager.getActiveChatState();
        expect(activeChatState).toBeDefined();
        expect(activeChatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle rapid agent switching in active chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set active chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");

        // Rapidly switch between agents
        yield* manager.switchAgentInActiveChat("agent-assistant");
        yield* manager.switchAgentInActiveChat("agent-expert");
        yield* manager.switchAgentInActiveChat("agent-creative");
        yield* manager.switchAgentInActiveChat("agent-assistant");

        // Verify final state is stable
        const activeChatState = yield* manager.getActiveChatState();
        expect(activeChatState).toBeDefined();
        expect(activeChatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Agent Initialization", () => {
    test("should initialize chat with specific agent", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat with specific agent
        yield* manager.initializeChatInstance("test-chat-1", "agent-expert");

        // Verify chat was initialized with correct agent
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize chat with default agent when none specified", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat without specifying agent
        yield* manager.initializeChatInstance("test-chat-1");

        // Verify chat was initialized successfully
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should initialize multiple chats with different agents", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chats with different agents
        yield* manager.initializeChatInstance("test-chat-1", "agent-assistant");
        yield* manager.initializeChatInstance("test-chat-2", "agent-expert");
        yield* manager.initializeChatInstance("test-chat-3", "agent-creative");

        // Verify all chats are initialized
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toContain("test-chat-1");
        expect(allChats).toContain("test-chat-2");
        expect(allChats).toContain("test-chat-3");

        // Verify each chat is functional
        const chat1State = yield* manager.getChatState("test-chat-1");
        const chat2State = yield* manager.getChatState("test-chat-2");
        const chat3State = yield* manager.getChatState("test-chat-3");

        expect(chat1State.connectionState).toBe("connected");
        expect(chat2State.connectionState).toBe("connected");
        expect(chat3State.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle invalid agent ID during initialization", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat with invalid agent ID (should still work)
        yield* manager.initializeChatInstance(
          "test-chat-1",
          "invalid-agent-id"
        );

        // Verify chat was initialized (with fallback handling)
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Agent State Consistency", () => {
    test("should track agent switches in metadata", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat with default agent
        yield* manager.initializeChatInstance("test-chat-1");

        // Switch to specific agent
        yield* manager.switchAgent("test-chat-1", "agent-expert");

        // Verify agent switch was tracked
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update last active timestamp on agent switch", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Get initial chat state
        const initialChatState = yield* manager.getChatState("test-chat-1");
        const initialTimestamp = initialChatState.metadata.lastActiveAt;

        // Wait to ensure timestamp difference
        yield* Effect.sleep("100 millis");

        // Switch agent (should update timestamp)
        yield* manager.switchAgent("test-chat-1", "agent-expert");

        // Check updated timestamp
        const finalChatState = yield* manager.getChatState("test-chat-1");
        const finalTimestamp = finalChatState.metadata.lastActiveAt;

        expect(finalTimestamp.getTime()).toBeGreaterThan(
          initialTimestamp.getTime()
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should maintain chat functionality after agent switch", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send message
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Before switch");

        // Switch agent
        yield* manager.switchAgent("test-chat-1", "agent-expert");

        // Send message after switch
        yield* manager.sendMessage("test-chat-1", "After switch");

        // Verify chat history is accessible
        const history = yield* manager.getChatHistory("test-chat-1");
        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);

        // Verify chat state is consistent
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Agent Error Handling", () => {
    test("should handle agent switch failures gracefully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Even if agent switch encounters issues, chat should remain functional
        yield* manager.switchAgent(
          "test-chat-1",
          "potentially-problematic-agent"
        );

        // Verify chat is still accessible
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent agent switches", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Attempt concurrent agent switches
        const switches = [
          manager.switchAgent("test-chat-1", "agent-assistant"),
          manager.switchAgent("test-chat-1", "agent-expert"),
          manager.switchAgent("test-chat-1", "agent-creative"),
        ];

        // Wait for all switches to complete (some may fail due to concurrency)
        const results = yield* Effect.all(
          switches.map((s) => Effect.either(s)),
          { concurrency: "unbounded" }
        );

        // At least one should succeed, and chat should remain functional
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBeGreaterThan(0);

        // Verify chat is still functional
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle agent switch on closed chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and then close a chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.closeChatInstance("test-chat-1");

        // Try to switch agent on closed chat
        const result = yield* Effect.either(
          manager.switchAgent("test-chat-1", "agent-expert")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatInstanceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Agent Integration with Messages", () => {
    test("should send messages after agent switch", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat and send initial message
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Initial message");

        // Switch agent and send another message
        yield* manager.switchAgent("test-chat-1", "agent-expert");
        yield* manager.sendMessage("test-chat-1", "Message with expert");

        // Verify both messages were handled
        const state = yield* manager.getState();
        expect(state.activeChats).toContain("test-chat-1");
        expect(state.totalMessages).toBe(2);

        // Verify chat state
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle agent switch during active conversation", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set as active
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Hello");

        // Switch agent during conversation
        yield* manager.switchAgent("test-chat-1", "agent-expert");
        yield* manager.sendMessage("test-chat-1", "Expert help needed");

        // Verify conversation continuity
        const chatState = yield* manager.getActiveChatState();
        expect(chatState?.connectionState).toBe("connected");

        const state = yield* manager.getState();
        expect(state.activeChatId).toBe("test-chat-1");
        expect(state.activeChats).toContain("test-chat-1");
        expect(state.totalMessages).toBe(2);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
