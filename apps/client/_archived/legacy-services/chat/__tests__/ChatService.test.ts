import { AgentRegistryService } from "@/services/agent-registry";
import { AgentKitBridge } from "@/services/agentkit-bridge/service";
import { MdxService } from "@/services/mdx";
import { UrlService } from "@/services/url";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatService } from "../service";
import type { ChatManagerEvent, ChatState } from "../types";

// Mock dependencies
const MockAgentKitBridge = Layer.succeed(AgentKitBridge, {
  setProvider: () => Effect.succeed(undefined),
  sendMessage: () => Effect.succeed("mock-response"),
} as any);

const MockMdxService = Layer.succeed(MdxService, {
  processMarkdown: () => Effect.succeed("processed"),
} as any);

const MockUrlService = Layer.succeed(UrlService, {
  buildApiUrl: () => Effect.succeed("http://mock-url"),
  buildChatUrl: () => Effect.succeed("ws://mock-chat"),
} as any);

const MockAgentRegistryService = Layer.succeed(AgentRegistryService, {
  getById: () => Effect.succeed({ id: "test-agent", name: "Test Agent" }),
  getAll: () => Effect.succeed([]),
} as any);

// Test layer with all dependencies
const TestLayer = Layer.mergeAll(
  MockAgentKitBridge,
  MockMdxService,
  MockUrlService,
  MockAgentRegistryService,
  ChatService.Default
);

describe("ChatService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Structure", () => {
    it("should be defined and have correct structure", () => {
      expect(ChatService).toBeDefined();
      expect(ChatService.Default).toBeDefined();
    });

    it("should provide service through layer", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        expect(chatService).toBeDefined();
        expect(typeof chatService.getState).toBe("function");
        expect(typeof chatService.initialize).toBe("function");
        expect(typeof chatService.sendMessage).toBe("function");
        return "success";
      });

      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      );
      expect(result).toBe("success");
    });
  });

  describe("Initialization", () => {
    it("should initialize with valid chat ID", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat-123");
        const state = yield* chatService.getState();

        expect(state.chatId).toBe("test-chat-123");
        expect(state.connectionState).toBe("connected");
        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.chatId).toBe("test-chat-123");
    });

    it("should initialize with chat ID and agent ID", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat-123", undefined, "test-agent");
        const state = yield* chatService.getState();

        expect(state.chatId).toBe("test-chat-123");
        expect(state.agentId).toBe("test-agent");
        expect(state.connectionState).toBe("connected");
        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.agentId).toBe("test-agent");
    });

    it("should fail initialization with empty chat ID", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("");
      });

      await expect(
        Effect.runPromise(Effect.provide(program, TestLayer))
      ).rejects.toThrow();
    });
  });

  describe("State Management", () => {
    it("should get initial state", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        const state = yield* chatService.getState();

        expect(state).toBeDefined();
        expect(state.chatId).toBe("");
        expect(state.connectionState).toBe("initializing");
        expect(state.messages).toEqual([]);
        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.messages).toEqual([]);
    });

    it("should transition connection state", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;

        yield* chatService.transitionConnectionState("connecting");
        let state = yield* chatService.getState();
        expect(state.connectionState).toBe("connecting");

        yield* chatService.transitionConnectionState("connected");
        state = yield* chatService.getState();
        expect(state.connectionState).toBe("connected");

        yield* chatService.transitionConnectionState("disconnected");
        state = yield* chatService.getState();
        expect(state.connectionState).toBe("disconnected");

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.connectionState).toBe("disconnected");
    });
  });

  describe("Message Operations", () => {
    it("should validate message", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        const validation = yield* chatService.validateMessage("Valid message");
        expect(validation.isValid).toBe(true);

        const emptyValidation = yield* chatService.validateMessage("");
        expect(emptyValidation.isValid).toBe(false);

        return { validation, emptyValidation };
      });

      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      );
      expect(result.validation.isValid).toBe(true);
      expect(result.emptyValidation.isValid).toBe(false);
    });

    it("should set typing state", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        yield* chatService.setTyping(true);
        let state = yield* chatService.getState();
        expect(state.isTyping).toBe(true);

        yield* chatService.setTyping(false);
        state = yield* chatService.getState();
        expect(state.isTyping).toBe(false);

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.isTyping).toBe(false);
    });
  });

  describe("Event Handling", () => {
    it("should handle initialization event", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;

        const event: ChatManagerEvent = {
          type: "INITIALIZE",
          chatId: "event-chat",
          agentId: "event-agent",
        };

        yield* chatService.handleEvent(event);
        const state = yield* chatService.getState();

        expect(state.chatId).toBe("event-chat");
        expect(state.agentId).toBe("event-agent");
        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.connectionState).toBe("connected");
    });

    it("should handle typing events", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        yield* chatService.handleEvent({ type: "START_TYPING" });
        let state = yield* chatService.getState();
        expect(state.isTyping).toBe(true);

        yield* chatService.handleEvent({ type: "STOP_TYPING" });
        state = yield* chatService.getState();
        expect(state.isTyping).toBe(false);

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.isTyping).toBe(false);
    });
  });

  describe("History Operations", () => {
    it("should get history", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        const history = yield* chatService.getHistory();
        expect(history).toBeDefined();
        expect(Array.isArray(history.messages)).toBe(true);
        return history;
      });

      const history = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      );
      expect(history.messages).toEqual([]);
    });

    it("should clear history", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat", undefined, "test-agent");

        // Clear history (no messages to clear initially)
        yield* chatService.clearHistory();
        const state = yield* chatService.getState();
        expect(state.messages).toEqual([]);

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.messages).toEqual([]);
    });
  });

  describe("Agent Operations", () => {
    it("should switch agent", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat", undefined, "initial-agent");

        let state = yield* chatService.getState();
        expect(state.agentId).toBe("initial-agent");

        yield* chatService.switchAgent("new-agent");
        state = yield* chatService.getState();
        expect(state.agentId).toBe("new-agent");

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.agentId).toBe("new-agent");
    });
  });

  describe("Error Handling", () => {
    it("should handle errors", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        yield* chatService.handleError("Test error", { context: "test" });
        const state = yield* chatService.getState();

        expect(state.lastError).toBe("Test error");
        expect(state.metadata.errorCount).toBe(1);
        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.lastError).toBe("Test error");
    });

    it("should reset state", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat", undefined, "test-agent");

        // Add some error state
        yield* chatService.handleError("Test error");

        let state = yield* chatService.getState();
        expect(state.lastError).toBe("Test error");

        // Reset
        yield* chatService.reset();
        state = yield* chatService.getState();

        expect(state.messages).toEqual([]);
        expect(state.lastError).toBeNull();
        expect(state.metadata.errorCount).toBe(0);

        return state;
      });

      const state = await Effect.runPromise(Effect.provide(program, TestLayer));
      expect(state.messages).toEqual([]);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup successfully", async () => {
      const program = Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-chat");

        // Cleanup should not throw
        yield* chatService.cleanup();

        return "cleanup-success";
      });

      const result = await Effect.runPromise(
        Effect.provide(program, TestLayer)
      );
      expect(result).toBe("cleanup-success");
    });
  });
});
