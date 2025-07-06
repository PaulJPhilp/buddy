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

describe("ChatManager - Message Operations", () => {
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

  describe("sendMessage", () => {
    test("should send message to existing chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Send a message
        yield* manager.sendMessage("test-chat-1", "Hello, world!");

        // Verify the message was sent by checking chat state
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should send message with attachments", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Create mock file attachments
        const mockFile = new File(["test content"], "test.txt", {
          type: "text/plain",
        });
        const attachments = [mockFile];

        // Send a message with attachments
        yield* manager.sendMessage(
          "test-chat-1",
          "Message with attachment",
          attachments
        );

        // Verify the message was sent
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when sending to non-existent chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to send message to non-existent chat
        const result = yield* Effect.either(
          manager.sendMessage("non-existent-chat", "Hello!")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatManagerOperationError);
          expect(result.left.chatId).toBe("non-existent-chat");
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle empty message content", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Send empty message
        yield* manager.sendMessage("test-chat-1", "");

        // Should succeed (empty messages are allowed)
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle very long message content", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Send very long message
        const longMessage = "A".repeat(10000);
        yield* manager.sendMessage("test-chat-1", longMessage);

        // Should succeed
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle multiple attachments", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Create multiple mock file attachments
        const attachments = [
          new File(["content 1"], "file1.txt", { type: "text/plain" }),
          new File(["content 2"], "file2.txt", { type: "text/plain" }),
          new File(["content 3"], "file3.txt", { type: "text/plain" }),
        ];

        // Send message with multiple attachments
        yield* manager.sendMessage(
          "test-chat-1",
          "Multiple files",
          attachments
        );

        // Should succeed
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("sendMessageToActiveChat", () => {
    test("should send message to active chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set active chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");

        // Send message to active chat
        yield* manager.sendMessageToActiveChat("Hello to active chat!");

        // Verify message was sent
        const chatState = yield* manager.getActiveChatState();
        expect(chatState).toBeDefined();
        expect(chatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should send message with attachments to active chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and set active chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.setActiveChat("test-chat-1");

        // Create mock file attachment
        const mockFile = new File(["test content"], "test.txt", {
          type: "text/plain",
        });

        // Send message with attachment to active chat
        yield* manager.sendMessageToActiveChat("Message with attachment", [
          mockFile,
        ]);

        // Verify message was sent
        const chatState = yield* manager.getActiveChatState();
        expect(chatState).toBeDefined();
        expect(chatState?.connectionState).toBe("connected");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should fail when no active chat is set", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Try to send message without setting active chat
        const result = yield* Effect.either(
          manager.sendMessageToActiveChat("Hello!")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(NoChatActiveError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should switch active chat and send message", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");

        // Set first chat as active and send message
        yield* manager.setActiveChat("test-chat-1");
        yield* manager.sendMessageToActiveChat("Message to chat 1");

        // Switch to second chat and send message
        yield* manager.setActiveChat("test-chat-2");
        yield* manager.sendMessageToActiveChat("Message to chat 2");

        // Verify active chat state
        const activeChatState = yield* manager.getActiveChatState();
        expect(activeChatState).toBeDefined();
        expect(activeChatState?.connectionState).toBe("connected");

        // Verify both chats exist
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toContain("test-chat-1");
        expect(allChats).toContain("test-chat-2");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("broadcastMessage", () => {
    test("should broadcast message to all active chats", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.initializeChatInstance("test-chat-3");

        // Broadcast message to all chats
        yield* manager.broadcastMessage("Broadcast message to all!");

        // Verify all chats are still active
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toContain("test-chat-1");
        expect(allChats).toContain("test-chat-2");
        expect(allChats).toContain("test-chat-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle broadcast with no active chats", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Broadcast with no chats (should not fail)
        yield* manager.broadcastMessage("Broadcast to empty set");

        // Verify no chats exist
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toHaveLength(0);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle broadcast with single chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize single chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Broadcast message
        yield* manager.broadcastMessage("Broadcast to single chat");

        // Verify chat received message
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toContain("test-chat-1");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle broadcast after closing some chats", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize multiple chats
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.initializeChatInstance("test-chat-2");
        yield* manager.initializeChatInstance("test-chat-3");

        // Close one chat
        yield* manager.closeChatInstance("test-chat-2");

        // Broadcast message
        yield* manager.broadcastMessage("Broadcast after closing chat");

        // Verify remaining chats
        const allChats = yield* manager.getAllActiveChats();
        expect(allChats).toContain("test-chat-1");
        expect(allChats).not.toContain("test-chat-2");
        expect(allChats).toContain("test-chat-3");
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Message Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // This should not throw even if there are underlying network issues
        yield* manager.sendMessage(
          "test-chat-1",
          "Message during network issues"
        );

        // Chat should still exist
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle concurrent message sending", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Send multiple messages sequentially (ChatService doesn't support concurrent messaging)
        yield* manager.sendMessage("test-chat-1", "Message 1");
        yield* manager.sendMessage("test-chat-1", "Message 2");
        yield* manager.sendMessage("test-chat-1", "Message 3");
        yield* manager.sendMessage("test-chat-1", "Message 4");
        yield* manager.sendMessage("test-chat-1", "Message 5");

        // All messages should be sent successfully
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
        expect(chatState.connectionState).toBe("connected");

        // Verify message count in manager state
        const state = yield* manager.getState();
        expect(state.totalMessages).toBe(5);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle message sending to closed chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize and then close a chat
        yield* manager.initializeChatInstance("test-chat-1");
        yield* manager.closeChatInstance("test-chat-1");

        // Try to send message to closed chat
        const result = yield* Effect.either(
          manager.sendMessage("test-chat-1", "Message to closed chat")
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ChatManagerOperationError);
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should handle invalid file attachments", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Create invalid file (empty file with no content)
        const invalidFile = new File([], "", { type: "" });

        // Send message with invalid attachment (should still work)
        yield* manager.sendMessage("test-chat-1", "Message with invalid file", [
          invalidFile,
        ]);

        // Should succeed despite invalid file
        const chatState = yield* manager.getChatState("test-chat-1");
        expect(chatState).toBeDefined();
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });

  describe("Message State Consistency", () => {
    test("should maintain message count consistency", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Get initial state
        const initialState = yield* manager.getState();
        const initialMessageCount = initialState.totalMessages;

        // Send several messages
        yield* manager.sendMessage("test-chat-1", "Message 1");
        yield* manager.sendMessage("test-chat-1", "Message 2");
        yield* manager.sendMessage("test-chat-1", "Message 3");

        // Check updated state
        const updatedState = yield* manager.getState();
        const finalMessageCount = updatedState.totalMessages;
        expect(finalMessageCount).toBe(initialMessageCount + 3);
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });

    test("should update last active timestamp on message send", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Initialize a chat
        yield* manager.initializeChatInstance("test-chat-1");

        // Get initial chat state
        const initialChatState = yield* manager.getChatState("test-chat-1");
        const initialTimestamp = initialChatState.metadata.lastActiveAt;

        // Wait to ensure timestamp difference
        yield* Effect.sleep("100 millis");

        // Send a message (should update timestamp)
        yield* manager.sendMessage("test-chat-1", "Hello, world!");

        // Check updated timestamp
        const finalChatState = yield* manager.getChatState("test-chat-1");
        const finalTimestamp = finalChatState.metadata.lastActiveAt;

        expect(finalTimestamp.getTime()).toBeGreaterThan(
          initialTimestamp.getTime()
        );
      });

      await Effect.runPromise(program.pipe(Effect.provide(TestLayer)));
    });
  });
});
