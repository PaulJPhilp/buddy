import { CoreManager } from "@managers/core";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatManager } from "../service";
import type { AgentId, ConversationId, MessageId } from "../types";
import { CHAT_MANAGER_CONSTANTS } from "../types";

describe("ChatManager", () => {
  const testLayer = Layer.provide(ChatManager.Default, CoreManager.Default);

  describe("State Management", () => {
    it("should initialize with default state", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const state = yield* chatManager.getState();

        expect(state.conversations).toEqual({});
        expect(state.activeConversationId).toBeNull();
        expect(state.messageIndex).toEqual({});
        expect(state.stats.totalConversations).toBe(0);
        expect(state.stats.totalMessages).toBe(0);
        expect(state.stats.activeConversations).toBe(0);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should update state correctly", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;

        yield* chatManager.setState({
          conversations: {
            "test-id": {
              id: "test-id",
              title: "Test Conversation",
              status: "active",
              agentId: "agent-1",
              createdAt: new Date(),
              updatedAt: new Date(),
              lastActivity: new Date(),
              messageCount: 0,
              messages: [],
              isArchived: false,
            },
          },
        });

        const state = yield* chatManager.getState();
        expect(state.conversations["test-id"]).toBeDefined();
        expect(state.conversations["test-id"].title).toBe("Test Conversation");
        expect(state.stats.totalConversations).toBe(1);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should reset state to initial values", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;

        // First add some state
        const agentId: AgentId = "agent-1";
        yield* chatManager.startConversation(agentId);

        // Then reset
        yield* chatManager.resetState();

        const state = yield* chatManager.getState();
        expect(state.conversations).toEqual({});
        expect(state.stats.totalConversations).toBe(0);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Conversation Management", () => {
    it("should start a new conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);

        expect(conversationId).toBeDefined();
        expect(typeof conversationId).toBe("string");

        const conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.id).toBe(conversationId);
        expect(conversation.agentId).toBe(agentId);
        expect(conversation.status).toBe("active");
        expect(conversation.title).toBe(
          CHAT_MANAGER_CONSTANTS.DEFAULT_CONVERSATION_TITLE
        );
        expect(conversation.messageCount).toBe(0);
        expect(conversation.messages).toEqual([]);

        const state = yield* chatManager.getState();
        expect(state.activeConversationId).toBe(conversationId);
        expect(state.stats.totalConversations).toBe(1);
        expect(state.stats.activeConversations).toBe(1);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should start conversation with initial message", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";
        const initialMessage = "Hello, how can I help you?";

        const conversationId = yield* chatManager.startConversation(
          agentId,
          initialMessage
        );

        const conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(1);
        expect(conversation.messages).toHaveLength(1);
        expect(conversation.messages[0].content).toBe(initialMessage);
        expect(conversation.messages[0].role).toBe("user");

        const state = yield* chatManager.getState();
        expect(state.stats.totalMessages).toBe(1);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should end a conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);

        // Verify it's active
        let conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.status).toBe("active");

        // End the conversation
        yield* chatManager.endConversation(conversationId);

        // Verify it's ended
        conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.status).toBe("ended");

        const state = yield* chatManager.getState();
        expect(state.activeConversationId).toBeNull();
        expect(state.stats.activeConversations).toBe(0);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should get all conversations", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId1 = yield* chatManager.startConversation(agentId);
        const conversationId2 = yield* chatManager.startConversation(agentId);

        const conversations = yield* chatManager.getAllConversations();
        expect(conversations).toHaveLength(2);
        expect(conversations.map((c) => c.id)).toContain(conversationId1);
        expect(conversations.map((c) => c.id)).toContain(conversationId2);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should manage active conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        // Initially no active conversation
        let activeConversation = yield* chatManager.getActiveConversation();
        expect(activeConversation).toBeNull();

        // Start a conversation (becomes active)
        const conversationId1 = yield* chatManager.startConversation(agentId);
        activeConversation = yield* chatManager.getActiveConversation();
        expect(activeConversation?.id).toBe(conversationId1);

        // Start another conversation (becomes active)
        const conversationId2 = yield* chatManager.startConversation(agentId);
        activeConversation = yield* chatManager.getActiveConversation();
        expect(activeConversation?.id).toBe(conversationId2);

        // Set active conversation back to first one
        yield* chatManager.setActiveConversation(conversationId1);
        activeConversation = yield* chatManager.getActiveConversation();
        expect(activeConversation?.id).toBe(conversationId1);

        // Clear active conversation
        yield* chatManager.setActiveConversation(null);
        activeConversation = yield* chatManager.getActiveConversation();
        expect(activeConversation).toBeNull();
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should fail to get non-existent conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const nonExistentId: ConversationId = "non-existent";

        const result = yield* Effect.either(
          chatManager.getConversation(nonExistentId)
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ChatManagerConversationError");
          expect(result.left.message).toBe("Failed to get conversation");
        }
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Message Management", () => {
    it("should send and retrieve messages", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";
        const messageContent = "Hello, this is a test message";

        const conversationId = yield* chatManager.startConversation(agentId);
        const messageId = yield* chatManager.sendMessage(
          conversationId,
          messageContent
        );

        expect(messageId).toBeDefined();
        expect(typeof messageId).toBe("string");

        const message = yield* chatManager.getMessage(messageId);
        expect(message.id).toBe(messageId);
        expect(message.content).toBe(messageContent);
        expect(message.role).toBe("user");
        expect(message.status).toBe("sent");
        expect(message.conversationId).toBe(conversationId);

        const messages = yield* chatManager.getMessages(conversationId);
        expect(messages).toHaveLength(1);
        expect(messages[0].id).toBe(messageId);

        const conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(1);
        expect(conversation.messages).toHaveLength(1);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should update messages", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";
        const originalContent = "Original message";
        const updatedContent = "Updated message";

        const conversationId = yield* chatManager.startConversation(agentId);
        const messageId = yield* chatManager.sendMessage(
          conversationId,
          originalContent
        );

        // Update the message
        yield* chatManager.updateMessage(messageId, {
          content: updatedContent,
        });

        const message = yield* chatManager.getMessage(messageId);
        expect(message.content).toBe(updatedContent);

        // Verify the conversation's messages are also updated
        const messages = yield* chatManager.getMessages(conversationId);
        expect(messages[0].content).toBe(updatedContent);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should delete messages", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";
        const messageContent = "Message to be deleted";

        const conversationId = yield* chatManager.startConversation(agentId);
        const messageId = yield* chatManager.sendMessage(
          conversationId,
          messageContent
        );

        // Verify message exists
        let conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(1);
        expect(conversation.messages).toHaveLength(1);

        // Delete the message
        yield* chatManager.deleteMessage(messageId);

        // Verify message is deleted
        conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(0);
        expect(conversation.messages).toHaveLength(0);

        // Verify message is removed from index
        const result = yield* Effect.either(chatManager.getMessage(messageId));
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ChatManagerMessageError");
        }
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should fail to get non-existent message", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const nonExistentId: MessageId = "non-existent";

        const result = yield* Effect.either(
          chatManager.getMessage(nonExistentId)
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ChatManagerMessageError");
          expect(result.left.message).toBe("Failed to get message");
        }
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Agent Management", () => {
    it("should set and get conversation agent", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const initialAgentId: AgentId = "agent-1";
        const newAgentId: AgentId = "agent-2";

        const conversationId = yield* chatManager.startConversation(
          initialAgentId
        );

        // Verify initial agent
        let agent = yield* chatManager.getConversationAgent(conversationId);
        expect(agent).toBe(initialAgentId);

        // Change agent
        yield* chatManager.setConversationAgent(conversationId, newAgentId);

        // Verify new agent
        agent = yield* chatManager.getConversationAgent(conversationId);
        expect(agent).toBe(newAgentId);

        // Verify conversation is updated
        const conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.agentId).toBe(newAgentId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Conversation History", () => {
    it("should get conversation history with limit", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);

        // Send multiple messages
        yield* chatManager.sendMessage(conversationId, "Message 1");
        yield* chatManager.sendMessage(conversationId, "Message 2");
        yield* chatManager.sendMessage(conversationId, "Message 3");
        yield* chatManager.sendMessage(conversationId, "Message 4");

        // Get all messages
        const allMessages = yield* chatManager.getConversationHistory(
          conversationId
        );
        expect(allMessages).toHaveLength(4);

        // Get limited messages
        const limitedMessages = yield* chatManager.getConversationHistory(
          conversationId,
          2
        );
        expect(limitedMessages).toHaveLength(2);
        expect(limitedMessages[0].content).toBe("Message 3");
        expect(limitedMessages[1].content).toBe("Message 4");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should clear conversation history", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);

        // Send messages
        yield* chatManager.sendMessage(conversationId, "Message 1");
        yield* chatManager.sendMessage(conversationId, "Message 2");

        // Verify messages exist
        let conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(2);

        // Clear history
        yield* chatManager.clearConversationHistory(conversationId);

        // Verify history is cleared
        conversation = yield* chatManager.getConversation(conversationId);
        expect(conversation.messageCount).toBe(0);
        expect(conversation.messages).toHaveLength(0);

        const messages = yield* chatManager.getConversationHistory(
          conversationId
        );
        expect(messages).toHaveLength(0);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should export conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);
        yield* chatManager.sendMessage(conversationId, "Test message");

        const exportedData = yield* chatManager.exportConversation(
          conversationId
        );

        expect(typeof exportedData).toBe("string");
        const parsed = JSON.parse(exportedData);
        expect(parsed.id).toBe(conversationId);
        expect(parsed.agentId).toBe(agentId);
        expect(parsed.messages).toHaveLength(1);
        expect(parsed.messages[0].content).toBe("Test message");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Search Functionality", () => {
    it("should search conversations", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId1 = yield* chatManager.startConversation(agentId);
        const conversationId2 = yield* chatManager.startConversation(agentId);

        yield* chatManager.sendMessage(conversationId1, "Hello world");
        yield* chatManager.sendMessage(conversationId2, "Goodbye world");

        // Search for "world" - should find both
        const worldResults = yield* chatManager.searchConversations("world");
        expect(worldResults).toHaveLength(2);

        // Search for "hello" - should find one
        const helloResults = yield* chatManager.searchConversations("hello");
        expect(helloResults).toHaveLength(1);
        expect(helloResults[0].id).toBe(conversationId1);

        // Search for "goodbye" - should find one
        const goodbyeResults = yield* chatManager.searchConversations(
          "goodbye"
        );
        expect(goodbyeResults).toHaveLength(1);
        expect(goodbyeResults[0].id).toBe(conversationId2);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should search messages in conversation", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);

        yield* chatManager.sendMessage(conversationId, "Hello world");
        yield* chatManager.sendMessage(conversationId, "How are you?");
        yield* chatManager.sendMessage(conversationId, "Goodbye world");

        // Search for "world" - should find 2 messages
        const worldResults = yield* chatManager.searchMessages(
          conversationId,
          "world"
        );
        expect(worldResults).toHaveLength(2);
        expect(worldResults[0].content).toBe("Hello world");
        expect(worldResults[1].content).toBe("Goodbye world");

        // Search for "how" - should find 1 message
        const howResults = yield* chatManager.searchMessages(
          conversationId,
          "how"
        );
        expect(howResults).toHaveLength(1);
        expect(howResults[0].content).toBe("How are you?");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Statistics", () => {
    it("should get conversation statistics", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId = yield* chatManager.startConversation(agentId);
        yield* chatManager.sendMessage(conversationId, "Message 1");
        yield* chatManager.sendMessage(conversationId, "Message 2");

        const stats = yield* chatManager.getConversationStats(conversationId);
        expect(stats.messageCount).toBe(2);
        expect(stats.lastActivity).toBeInstanceOf(Date);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should get all conversation statistics", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        const conversationId1 = yield* chatManager.startConversation(agentId);
        const conversationId2 = yield* chatManager.startConversation(agentId);

        yield* chatManager.sendMessage(conversationId1, "Message 1");
        yield* chatManager.sendMessage(conversationId2, "Message 2");
        yield* chatManager.sendMessage(conversationId2, "Message 3");

        const stats = yield* chatManager.getAllConversationStats();
        expect(stats.totalConversations).toBe(2);
        expect(stats.totalMessages).toBe(3);
        expect(stats.activeConversations).toBe(2);
        expect(stats.archivedConversations).toBe(0);
        expect(stats.lastActivity).toBeInstanceOf(Date);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });

  describe("Operations", () => {
    it("should track operations", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const agentId: AgentId = "agent-1";

        // Initially no operation in progress
        let inProgress = yield* chatManager.isOperationInProgress();
        expect(inProgress).toBe(false);

        let lastOperation = yield* chatManager.getLastOperation();
        expect(lastOperation).toBeNull();

        // Start a conversation (creates operation)
        const conversationId = yield* chatManager.startConversation(agentId);

        // Check operation tracking
        inProgress = yield* chatManager.isOperationInProgress();
        expect(inProgress).toBe(true);

        lastOperation = yield* chatManager.getLastOperation();
        expect(lastOperation).toBeDefined();
        expect(lastOperation?.type).toBe("start_conversation");
        expect(lastOperation?.conversationId).toBe(conversationId);
        expect(lastOperation?.agentId).toBe(agentId);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });

    it("should execute custom operations", async () => {
      const program = Effect.gen(function* () {
        const chatManager = yield* ChatManager;

        const customOperation = {
          type: "custom_operation" as const,
          timestamp: new Date(),
          parameters: { test: "value" },
          result: "success",
        };

        const result = yield* chatManager.executeOperation(customOperation);
        expect(result).toBe("success");

        const lastOperation = yield* chatManager.getLastOperation();
        expect(lastOperation?.type).toBe("custom_operation");
        expect(lastOperation?.parameters).toEqual({ test: "value" });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );
      expect(result).toBeUndefined();
    });
  });
});
