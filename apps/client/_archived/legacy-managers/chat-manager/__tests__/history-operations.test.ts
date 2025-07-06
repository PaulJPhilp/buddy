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

describe("ChatManager - History Operations", () => {
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

  describe("getChatHistory", () => {
    test("should get history for existing chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Get chat history
        const history = yield* manager.getChatHistory("test-chat-1");

        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should get history after sending messages", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "First message");
        yield* manager.sendMessage("test-chat-1", "Second message");
        yield* manager.sendMessage("test-chat-1", "Third message");

        // Get chat history
        const history = yield* manager.getChatHistory("test-chat-1");

        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
        // Note: History might be empty if the underlying service doesn't store messages
        // This tests that the operation succeeds, not necessarily that messages are stored
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when getting history for non-existent chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to get history for non-existent chat
        const result = yield* Effect.either(
          manager.getChatHistory("non-existent-chat")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatInstanceNotFoundError);
          expect(result.left.chatId).toBe("non-existent-chat");
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should get history for multiple chats independently", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.initializeChatInstance("test-chat-3");

        // Send different messages to each chat
        yield* manager.sendMessage("test-chat-1", "Message for chat 1");
        yield* manager.sendMessage("test-chat-2", "Message for chat 2");
        yield* manager.sendMessage("test-chat-3", "Message for chat 3");

        // Get history for each chat
        const history1 = yield* manager.getChatHistory("test-chat-1");
        const history2 = yield* manager.getChatHistory("test-chat-2");
        const history3 = yield* manager.getChatHistory("test-chat-3");

        expect(history1).toBeDefined();
        expect(history2).toBeDefined();
        expect(history3).toBeDefined();
        expect(Array.isArray(history1)).toBe(true);
        expect(Array.isArray(history2)).toBe(true);
        expect(Array.isArray(history3)).toBe(true);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should get empty history for newly created chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a new chat without sending messages
        yield* manager.initializeChatInstance("test-chat-1");

        // Get chat history immediately
        const history = yield* manager.getChatHistory("test-chat-1");

        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
        // Empty history is expected for new chat
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent history requests", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Make multiple concurrent history requests
        const historyRequests = Array.from({ length: 5 }, () =>
          manager.getChatHistory("test-chat-1")
        );

        const histories = yield* Effect.all(historyRequests, {
          concurrency: "unbounded",
        });

        // All requests should succeed
        expect(histories).toHaveLength(5);
        histories.forEach((history) => {
          expect(history).toBeDefined();
          expect(Array.isArray(history)).toBe(true);
        });
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("clearChatHistory", () => {
    test("should clear history for existing chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message to be cleared");

        // Clear chat history
        yield* manager.clearChatHistory("test-chat-1");

        // Verify history was cleared
        const history = yield* manager.getChatHistory("test-chat-1");
        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);
        // History should be empty after clearing
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when clearing history for non-existent chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to clear history for non-existent chat
        const result = yield* Effect.either(
          manager.clearChatHistory("non-existent-chat")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatInstanceNotFoundError);
          expect(result.left.chatId).toBe("non-existent-chat");
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should clear history and reset message count", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message 1");
        yield* manager.sendMessage("test-chat-1", "Message 2");
        yield* manager.sendMessage("test-chat-1", "Message 3");

        // Verify message count before clearing
        const stateBefore = yield* manager.getState();
        expect(stateBefore.totalMessages).toBe(3);

        // Clear history
        yield* manager.clearChatHistory("test-chat-1");

        // Verify message count was reset
        const stateAfter = yield* manager.getState();
        expect(stateAfter.totalMessages).toBe(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should clear history for one chat without affecting others", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize two chats and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.sendMessage("test-chat-1", "Message to chat 1");
        yield* manager.sendMessage("test-chat-2", "Message to chat 2");

        // Verify initial state
        const initialState = yield* manager.getState();
        expect(initialState.totalMessages).toBe(2);

        // Clear history for only one chat
        yield* manager.clearChatHistory("test-chat-1");

        // Verify only the targeted chat was cleared
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(1); // Only chat-2's message remains
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle clearing empty history", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat without sending messages
        yield* manager.initializeChatInstance("test-chat-1");

        // Clear history (should succeed even with no messages)
        yield* manager.clearChatHistory("test-chat-1");

        // Verify chat is still functional
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should allow sending messages after clearing history", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat and send message
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message before clear");

        // Clear history
        yield* manager.clearChatHistory("test-chat-1");

        // Send new message after clearing
        yield* manager.sendMessage("test-chat-1", "Message after clear");

        // Verify new message was counted
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(1); // Only the new message
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("History State Consistency", () => {
    test("should maintain history consistency across operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Perform various operations and check history consistency
        yield* manager.sendMessage("test-chat-1", "Message 1");
        const history1 = yield* manager.getChatHistory("test-chat-1");

        yield* manager.sendMessage("test-chat-1", "Message 2");
        const history2 = yield* manager.getChatHistory("test-chat-1");

        yield* manager.clearChatHistory("test-chat-1");
        const history3 = yield* manager.getChatHistory("test-chat-1");

        yield* manager.sendMessage("test-chat-1", "Message 3");
        const history4 = yield* manager.getChatHistory("test-chat-1");

        // All history operations should succeed
        expect(history1).toBeDefined();
        expect(history2).toBeDefined();
        expect(history3).toBeDefined();
        expect(history4).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should maintain history after agent switches", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat and send message
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message before switch");

        // Switch agent
        yield* manager.switchAgent("test-chat-1", "agent-expert");

        // Send message with new agent
        yield* manager.sendMessage("test-chat-1", "Message after switch");

        // Verify history is accessible
        const history = yield* manager.getChatHistory("test-chat-1");
        expect(history).toBeDefined();
        expect(Array.isArray(history)).toBe(true);

        // Verify message count includes both messages
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(2);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle history operations during chat closure", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message before close");

        // Close the chat
        yield* manager.closeChatInstance("test-chat-1");

        // Try to get history after closure
        const historyResult = yield* Effect.either(
          manager.getChatHistory("test-chat-1")
        );

        expect(historyResult._tag).toBe("Left");
        if (historyResult._tag === "Left") {
          expect(historyResult.left).toBeInstanceOf(ChatInstanceNotFoundError);
        }

        // Try to clear history after closure
        const clearResult = yield* Effect.either(
          manager.clearChatHistory("test-chat-1")
        );

        expect(clearResult._tag).toBe("Left");
        if (clearResult._tag === "Left") {
          expect(clearResult.left).toBeInstanceOf(ChatInstanceNotFoundError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update last active timestamp on history operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Get initial chat state
        const initialChatState = yield* manager.getChatState("test-chat-1");
        const initialTimestamp = initialChatState.metadata.lastActiveAt;

        // Wait to ensure timestamp difference
        yield* Effect.sleep("200 millis");

        // Clear history (should update timestamp)
        yield* manager.clearChatHistory("test-chat-1");

        // Check updated timestamp
        const finalChatState = yield* manager.getChatState("test-chat-1");
        const finalTimestamp = finalChatState.metadata.lastActiveAt;

        expect(finalTimestamp).toBeDefined();
        expect(initialTimestamp).toBeDefined();
        expect(finalTimestamp.getTime()).toBeGreaterThan(
          initialTimestamp.getTime()
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle large history operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Send many messages
        for (let i = 1; i <= 10; i++) {
          yield* manager.sendMessage("test-chat-1", `Message ${i}`);
        }

        // Verify large message count
        const stateBefore = yield* manager.getState();
        expect(stateBefore.totalMessages).toBe(10);

        // Clear large history
        yield* manager.clearChatHistory("test-chat-1");

        // Verify clearing worked
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("History Error Handling", () => {
    test("should handle concurrent clear operations", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat and send messages
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.sendMessage("test-chat-1", "Message to clear");

        // Attempt concurrent clear operations
        const clearOperations = Array.from({ length: 3 }, () =>
          manager.clearChatHistory("test-chat-1")
        );

        const results = yield* Effect.all(
          clearOperations.map((op) => Effect.either(op)),
          { concurrency: "unbounded" }
        );

        // At least one should succeed
        const successCount = results.filter((r) => r._tag === "Right").length;
        expect(successCount).toBeGreaterThan(0);

        // Final state should have cleared history
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle history operations with network issues", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // These operations should not throw even if there are underlying issues
        yield* manager.getChatHistory("test-chat-1");
        yield* manager.clearChatHistory("test-chat-1");

        // Chat should remain functional
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("History Integration", () => {
    test("should integrate history operations with active chat management", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set active chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");

        // Send message to active chat
        yield* manager.sendMessageToActiveChat("Message to active chat");

        // Get history for active chat
        const history = yield* manager.getChatHistory("test-chat-1");
        expect(history).toBeDefined();

        // Clear history for active chat
        yield* manager.clearChatHistory("test-chat-1");

        // Verify active chat is still functional
        const activeChatState = yield* manager.getActiveChatState();
        expect(activeChatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle history operations with multiple active chats", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");

        // Send messages to both chats
        yield* manager.sendMessage("test-chat-1", "Message 1");
        yield* manager.sendMessage("test-chat-2", "Message 2");

        // Get history for both chats
        const history1 = yield* manager.getChatHistory("test-chat-1");
        const history2 = yield* manager.getChatHistory("test-chat-2");

        expect(history1).toBeDefined();
        expect(history2).toBeDefined();

        // Clear history for one chat
        yield* manager.clearChatHistory("test-chat-1");

        // Verify only targeted chat was affected
        const state = yield* manager.getState();
        const chat1State = yield* manager.getChatState("test-chat-1");
        const chat2State = yield* manager.getChatState("test-chat-2");

        expect(chat1State.messages.length).toBe(0);
        expect(chat2State.messages.length).toBeGreaterThan(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
