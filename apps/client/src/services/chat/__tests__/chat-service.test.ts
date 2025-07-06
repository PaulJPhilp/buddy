import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ChatAgentError,
  ChatBatchError,
  ChatConnectionError,
  ChatMessageProcessingError,
  ChatOperationError,
  ChatValidationError,
} from "../errors";
import { ChatService } from "../service";
import type {
  ChatAgentConfig,
  ChatBatchRequest,
  ChatConnectionConfig,
  ChatMessage,
  ChatMessageRequest,
} from "../types";

describe("ChatService", () => {
  let chatService: ChatService;
  let serviceLayer: Layer.Layer<ChatService>;

  beforeEach(async () => {
    serviceLayer = ChatService.Default;
    chatService = await Effect.runPromise(
      Effect.provide(ChatService, serviceLayer)
    );
  });

  describe("Message Processing", () => {
    it("should process valid message request", async () => {
      const request: ChatMessageRequest = {
        chatId: "test-chat-123",
        content: "Hello, world!",
        role: "user",
      };

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.processMessage(request);
          }),
          serviceLayer
        )
      );

      expect(result.message.content).toBe("Hello, world!");
      expect(result.message.role).toBe("user");
      expect(result.message.chatId).toBe("test-chat-123");
      expect(result.message.id).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it("should fail with invalid chat ID", async () => {
      const request: ChatMessageRequest = {
        chatId: "",
        content: "Hello, world!",
        role: "user",
      };

      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(
            Effect.gen(function* () {
              const service = yield* ChatService;
              return yield* service.processMessage(request);
            }),
            serviceLayer
          )
        )
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ChatMessageProcessingError);
        expect(result.left.cause).toBeInstanceOf(ChatValidationError);
      }
    });

    it("should fail with invalid message content", async () => {
      const request: ChatMessageRequest = {
        chatId: "test-chat-123",
        content: "",
        role: "user",
      };

      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(
            Effect.gen(function* () {
              const service = yield* ChatService;
              return yield* service.processMessage(request);
            }),
            serviceLayer
          )
        )
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ChatMessageProcessingError);
        expect(result.left.cause).toBeInstanceOf(ChatValidationError);
      }
    });

    it("should sanitize message content", async () => {
      const request: ChatMessageRequest = {
        chatId: "test-chat-123",
        content: "Hello <script>alert('xss')</script> world!",
        role: "user",
      };

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.processMessage(request);
          }),
          serviceLayer
        )
      );

      expect(result.message.content).toBe("Hello  world!");
    });

    it("should include metadata in response", async () => {
      const request: ChatMessageRequest = {
        chatId: "test-chat-123",
        content: "Hello, world!",
        role: "user",
        metadata: { source: "test" },
      };

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.processMessage(request);
          }),
          serviceLayer
        )
      );

      expect(result.message.metadata).toEqual({ source: "test" });
      expect(result.metadata?.operationId).toBeDefined();
      expect(result.metadata?.serviceId).toBeDefined();
    });
  });

  describe("Message Validation", () => {
    it("should validate valid message", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.validateMessage("Hello, world!");
          }),
          serviceLayer
        )
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect invalid message content", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.validateMessage("");
          }),
          serviceLayer
        )
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid message content");
    });

    it("should detect whitespace issues", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.validateMessage("  Hello, world!  ");
          }),
          serviceLayer
        )
      );

      expect(result.warnings).toContain("Message has extra whitespace");
    });
  });

  describe("Message Formatting", () => {
    it("should format message content", async () => {
      const message: ChatMessage = {
        id: "msg-123",
        content: "Hello <script>alert('xss')</script> world!",
        role: "user",
        chatId: "test-chat-123",
        timestamp: 0,
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.formatMessage(message), serviceLayer)
      );

      expect(result.content).toBe("Hello  world!");
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("should preserve message properties", async () => {
      const message: ChatMessage = {
        id: "msg-123",
        content: "Hello, world!",
        role: "user",
        chatId: "test-chat-123",
        timestamp: 1234567890,
        metadata: { source: "test" },
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.formatMessage(message), serviceLayer)
      );

      expect(result.id).toBe("msg-123");
      expect(result.role).toBe("user");
      expect(result.chatId).toBe("test-chat-123");
      expect(result.metadata?.source).toBe("test");
    });
  });

  describe("History Operations", () => {
    it("should load empty history", async () => {
      const request = {
        chatId: "test-chat-123",
        limit: 10,
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.loadHistory(request), serviceLayer)
      );

      expect(result.messages).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should search history", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          chatService.searchHistory("test-chat-123", "hello"),
          serviceLayer
        )
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it("should export history", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          chatService.exportHistory("test-chat-123", "json"),
          serviceLayer
        )
      );

      expect(typeof result).toBe("string");
      const parsed = JSON.parse(result);
      expect(parsed.chatId).toBe("test-chat-123");
      expect(parsed.format).toBe("json");
    });
  });

  describe("Connection Operations", () => {
    it("should establish connection", async () => {
      const config: ChatConnectionConfig = {
        endpoint: "ws://localhost:8080",
        protocol: "websocket",
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.establishConnection(config), serviceLayer)
      );

      expect(result.status).toBe("connected");
      expect(result.endpoint).toBe("ws://localhost:8080");
      expect(result.connectionId).toBeDefined();
    });

    it("should test connection", async () => {
      const config: ChatConnectionConfig = {
        endpoint: "ws://localhost:8080",
        protocol: "websocket",
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.testConnection(config), serviceLayer)
      );

      expect(result).toBe(true);
    });

    it("should close connection", async () => {
      const result = await Effect.runPromise(
        Effect.provide(chatService.closeConnection("conn-123"), serviceLayer)
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Agent Operations", () => {
    it("should switch agent", async () => {
      const config: ChatAgentConfig = {
        agentId: "agent-123",
        name: "Test Agent",
      };

      const result = await Effect.runPromise(
        Effect.provide(
          chatService.switchAgent("chat-123", config),
          serviceLayer
        )
      );

      expect(result.newAgentId).toBe("agent-123");
      expect(result.switchTime).toBeGreaterThan(0);
      expect(result.migrationRequired).toBe(false);
    });

    it("should get agent capabilities", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          chatService.getAgentCapabilities("agent-123"),
          serviceLayer
        )
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain("text-generation");
      expect(result).toContain("conversation");
    });

    it("should validate agent config", async () => {
      const config: ChatAgentConfig = {
        agentId: "agent-123",
        name: "Test Agent",
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.validateAgentConfig(config), serviceLayer)
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect invalid agent config", async () => {
      const config: ChatAgentConfig = {
        agentId: "",
        name: "",
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.validateAgentConfig(config), serviceLayer)
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Agent ID required");
      expect(result.errors).toContain("Agent name required");
    });
  });

  describe("Batch Operations", () => {
    it("should process batch successfully", async () => {
      const request: ChatBatchRequest = {
        batchId: "batch-123",
        messages: [
          {
            chatId: "chat-123",
            content: "Hello, world!",
            role: "user",
          },
          {
            chatId: "chat-123",
            content: "How are you?",
            role: "user",
          },
        ],
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.processBatch(request), serviceLayer)
      );

      expect(result.batchId).toBe("batch-123");
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.responses).toHaveLength(2);
    });

    it("should handle batch with failures", async () => {
      const request: ChatBatchRequest = {
        batchId: "batch-123",
        messages: [
          {
            chatId: "chat-123",
            content: "Hello, world!",
            role: "user",
          },
          {
            chatId: "",
            content: "Invalid chat ID",
            role: "user",
          },
        ],
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.processBatch(request), serviceLayer)
      );

      expect(result.batchId).toBe("batch-123");
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });

    it("should validate batch messages", async () => {
      const messages: ChatMessage[] = [
        {
          id: "msg-1",
          content: "Hello, world!",
          role: "user",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
        {
          id: "msg-2",
          content: "",
          role: "user",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
      ];

      const result = await Effect.runPromise(
        Effect.provide(chatService.validateBatch(messages), serviceLayer)
      );

      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
    });
  });

  describe("Utility Operations", () => {
    it("should generate chat ID", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.generateChatId();
          }),
          serviceLayer
        )
      );

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^chat_\d+_[a-z0-9]+$/);
    });

    it("should generate message ID", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.generateMessageId();
          }),
          serviceLayer
        )
      );

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });

    it("should calculate metrics", async () => {
      const messages: ChatMessage[] = [
        {
          id: "msg-1",
          content: "Hello, world!",
          role: "user",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
        {
          id: "msg-2",
          content: "Hi there!",
          role: "assistant",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
      ];

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.calculateMetrics(messages);
          }),
          serviceLayer
        )
      );

      expect(result.messageCount).toBe(2);
      expect(result.averageMessageLength).toBeGreaterThan(0);
      expect(result.totalCharacters).toBeGreaterThan(0);
      expect(result.attachmentCount).toBe(0);
    });
  });

  describe("Content Processing", () => {
    it("should process attachments", async () => {
      const files = [
        new File(["content"], "test.txt", { type: "text/plain" }),
        new File(["content"], "image.png", { type: "image/png" }),
      ];

      const result = await Effect.runPromise(
        Effect.provide(chatService.processAttachments(files), serviceLayer)
      );

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Attachment: test.txt");
      expect(result[1].content).toBe("Attachment: image.png");
    });

    it("should extract content from message", async () => {
      const message: ChatMessage = {
        id: "msg-123",
        content: "Hello, world!",
        role: "user",
        chatId: "chat-123",
        timestamp: Date.now(),
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.extractContent(message), serviceLayer)
      );

      expect(result).toBe("Hello, world!");
    });

    it("should sanitize content", async () => {
      const content = "Hello <script>alert('xss')</script> world!";

      const result = await Effect.runPromise(
        Effect.provide(chatService.sanitizeContent(content), serviceLayer)
      );

      expect(result).toBe("Hello  world!");
    });
  });

  describe("Advanced Operations", () => {
    it("should analyze conversation", async () => {
      const messages: ChatMessage[] = [
        {
          id: "msg-1",
          content: "Hello, world!",
          role: "user",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
      ];

      const result = await Effect.runPromise(
        Effect.provide(chatService.analyzeConversation(messages), serviceLayer)
      );

      expect(result.messageCount).toBe(1);
      expect(result.averageMessageLength).toBeGreaterThan(0);
    });

    it("should suggest responses", async () => {
      const context: ChatMessage[] = [
        {
          id: "msg-1",
          content: "Hello, world!",
          role: "user",
          chatId: "chat-123",
          timestamp: Date.now(),
        },
      ];

      const result = await Effect.runPromise(
        Effect.provide(chatService.suggestResponses(context), serviceLayer)
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should detect intent", async () => {
      const questionResult = await Effect.runPromise(
        Effect.provide(
          chatService.detectIntent("What is the weather like?"),
          serviceLayer
        )
      );
      expect(questionResult).toBe("question");

      const exclamationResult = await Effect.runPromise(
        Effect.provide(chatService.detectIntent("Hello there!"), serviceLayer)
      );
      expect(exclamationResult).toBe("exclamation");

      const statementResult = await Effect.runPromise(
        Effect.provide(
          chatService.detectIntent("The weather is nice."),
          serviceLayer
        )
      );
      expect(statementResult).toBe("statement");
    });
  });

  describe("Service Monitoring", () => {
    it("should get service health", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.getServiceHealth();
          }),
          serviceLayer
        )
      );

      expect(result.status).toBe("healthy");
      expect(result.serviceId).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.operationsCount).toBeGreaterThanOrEqual(0);
    });

    it("should get service metrics", async () => {
      const result = await Effect.runPromise(
        Effect.provide(chatService.getServiceMetrics(), serviceLayer)
      );

      expect(result.messageCount).toBe(0);
      expect(result.averageMessageLength).toBe(0);
      expect(result.totalCharacters).toBe(0);
      expect(result.attachmentCount).toBe(0);
      expect(result.averageResponseTime).toBe(0);
      expect(result.errorRate).toBe(0);
    });

    it("should reset service", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ChatService;
            return yield* service.resetService();
          }),
          serviceLayer
        )
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Event Operations", () => {
    it("should create event", async () => {
      const result = await Effect.runPromise(
        Effect.provide(
          chatService.createEvent("chat-123", "message", { content: "Hello" }),
          serviceLayer
        )
      );

      expect(result.chatId).toBe("chat-123");
      expect(result.eventType).toBe("message");
      expect(result.payload).toEqual({ content: "Hello" });
      expect(result.eventId).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("should process event", async () => {
      const event = {
        eventId: "event-123",
        chatId: "chat-123",
        eventType: "message",
        timestamp: Date.now(),
        payload: { content: "Hello" },
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.processEvent(event), serviceLayer)
      );

      expect(result.operationId).toBeDefined();
      expect(result.status).toBe("completed");
      expect(result.result).toEqual(event);
    });
  });

  describe("Operation Tracking", () => {
    it("should track operation", async () => {
      const operation = {
        id: "op-123",
        type: "test",
        startTime: Date.now(),
      };

      const result = await Effect.runPromise(
        Effect.provide(chatService.trackOperation(operation), serviceLayer)
      );

      expect(result).toBe("op-123");
    });

    it("should get operation status", async () => {
      const operation = {
        id: "op-456",
        type: "test",
        startTime: Date.now(),
      };

      await Effect.runPromise(
        Effect.provide(chatService.trackOperation(operation), serviceLayer)
      );

      const result = await Effect.runPromise(
        Effect.provide(chatService.getOperationStatus("op-456"), serviceLayer)
      );

      expect(result.operationId).toBe("op-456");
      expect(result.status).toBe("running");
    });

    it("should fail for non-existent operation", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(
            chatService.getOperationStatus("non-existent"),
            serviceLayer
          )
        )
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ChatOperationError);
        expect(result.left.message).toBe("Operation not found");
      }
    });
  });
});
