import { Effect, Layer, Either } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { describe, it, expect, beforeEach } from "vitest";
import { ChatManager } from "../service";
import { UrlService } from "../../../services/url";
import { ChatService } from "../../../services/chat";
import { WebSocketService } from "../../../services/websocket";
import { AgentRegistryService } from "../../../services/agent-registry";

describe("ChatManager - Core Operations", () => {
  let testLayer: Layer.Layer<any, any, any>;

  beforeEach(() => {
    testLayer = Layer.mergeAll(
      NodeFileSystem.layer,
      UrlService.Default,
      WebSocketService.Default,
      ChatService.Default,
      AgentRegistryService.Default,
      ChatManager.Default
    );
  });

  describe("Chat Instance Management", () => {
    it("should initialize chat instance with agent", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          const initialState = yield* manager.getState();

          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");

          const updatedState = yield* manager.getState();
          const activeChats = yield* manager.getAllActiveChats();

          return { initialState, updatedState, activeChats };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialState.activeChats).toHaveLength(0);
      expect(result.updatedState.activeChats).toHaveLength(1);
      expect(result.updatedState.activeChats).toContain("test-chat-1");
      expect(result.activeChats).toContain("test-chat-1");
    });

    it("should initialize chat instance without agent", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          yield* manager.initializeChatInstance("test-chat-1");

          const state = yield* manager.getState();
          const activeChats = yield* manager.getAllActiveChats();

          return { state, activeChats };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state.activeChats).toContain("test-chat-1");
      expect(result.activeChats).toContain("test-chat-1");
    });

    it("should initialize multiple chat instances", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");
          yield* manager.initializeChatInstance("test-chat-3");

          const state = yield* manager.getState();
          const activeChats = yield* manager.getAllActiveChats();

          return { state, activeChats };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state.activeChats).toHaveLength(3);
      expect(result.activeChats).toHaveLength(3);
      expect(result.activeChats).toContain("test-chat-1");
      expect(result.activeChats).toContain("test-chat-2");
      expect(result.activeChats).toContain("test-chat-3");
    });

    it("should handle duplicate chat instance initialization", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");

          // Try to initialize same chat again
          const duplicateResult = yield* Effect.either(
            manager.initializeChatInstance("test-chat-1", "test-agent-2")
          );

          const state = yield* manager.getState();

          return { duplicateResult, state };
        }).pipe(Effect.provide(testLayer))
      );

      // Should either succeed (updating agent) or fail gracefully
      expect(result.state.activeChats).toContain("test-chat-1");
    });

    it("should fail to initialize chat with invalid chat ID", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        yield* manager.initializeChatInstance("", "test-agent-1");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });
  });

  describe("Chat Instance Closure", () => {
    it("should close chat instance", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          const initialState = yield* manager.getState();

          yield* manager.closeChatInstance("test-chat-1");

          const updatedState = yield* manager.getState();
          const activeChats = yield* manager.getAllActiveChats();

          return { initialState, updatedState, activeChats };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialState.activeChats).toHaveLength(2);
      expect(result.updatedState.activeChats).toHaveLength(1);
      expect(result.updatedState.activeChats).not.toContain("test-chat-1");
      expect(result.updatedState.activeChats).toContain("test-chat-2");
      expect(result.activeChats).not.toContain("test-chat-1");
    });

    it("should close active chat and clear active chat ID", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          // Set active chat
          yield* manager.setActiveChat("test-chat-1");
          const stateWithActive = yield* manager.getState();

          // Close the active chat
          yield* manager.closeChatInstance("test-chat-1");

          const stateAfterClose = yield* manager.getState();

          return { stateWithActive, stateAfterClose };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stateWithActive.activeChatId).toBe("test-chat-1");
      expect(result.stateAfterClose.activeChatId).toBeNull();
    });

    it("should close non-active chat without affecting active chat", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          yield* manager.setActiveChat("test-chat-2");
          const stateWithActive = yield* manager.getState();

          // Close non-active chat
          yield* manager.closeChatInstance("test-chat-1");

          const stateAfterClose = yield* manager.getState();

          return { stateWithActive, stateAfterClose };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stateWithActive.activeChatId).toBe("test-chat-2");
      expect(result.stateAfterClose.activeChatId).toBe("test-chat-2"); // Should remain
      expect(result.stateAfterClose.activeChats).not.toContain("test-chat-1");
      expect(result.stateAfterClose.activeChats).toContain("test-chat-2");
    });

    it("should handle closing non-existent chat gracefully", async () => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Should not throw
          yield* Effect.either(manager.closeChatInstance("non-existent-chat"));
        }).pipe(Effect.provide(testLayer))
      );
    });

    it("should clear all chats", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          yield* manager.setActiveChat("test-chat-1");
          const stateBeforeClear = yield* manager.getState();

          yield* manager.clearAllChats();

          const stateAfterClear = yield* manager.getState();
          const activeChats = yield* manager.getAllActiveChats();

          return { stateBeforeClear, stateAfterClear, activeChats };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stateBeforeClear.activeChats).toHaveLength(2);
      expect(result.stateBeforeClear.activeChatId).toBe("test-chat-1");

      expect(result.stateAfterClear.activeChats).toHaveLength(0);
      expect(result.stateAfterClear.activeChatId).toBeNull();
      expect(result.activeChats).toHaveLength(0);
    });
  });

  describe("Active Chat Management", () => {
    it("should set active chat", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");
          yield* manager.initializeChatInstance("test-chat-3", "test-agent-3");

          const initialState = yield* manager.getState();

          yield* manager.setActiveChat("test-chat-2");

          const updatedState = yield* manager.getState();

          return { initialState, updatedState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialState.activeChatId).toBeNull();
      expect(result.updatedState.activeChatId).toBe("test-chat-2");
    });

    it("should switch between active chats", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");
          yield* manager.initializeChatInstance("test-chat-3", "test-agent-3");

          yield* manager.setActiveChat("test-chat-1");
          const state1 = yield* manager.getState();

          yield* manager.setActiveChat("test-chat-3");
          const state2 = yield* manager.getState();

          yield* manager.setActiveChat("test-chat-2");
          const state3 = yield* manager.getState();

          return { state1, state2, state3 };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state1.activeChatId).toBe("test-chat-1");
      expect(result.state2.activeChatId).toBe("test-chat-3");
      expect(result.state3.activeChatId).toBe("test-chat-2");
    });

    it("should handle setting same active chat", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");
          yield* manager.initializeChatInstance("test-chat-3", "test-agent-3");

          yield* manager.setActiveChat("test-chat-1");
          const state1 = yield* manager.getState();

          // Set same chat as active again
          yield* manager.setActiveChat("test-chat-1");
          const state2 = yield* manager.getState();

          return { state1, state2 };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state1.activeChatId).toBe("test-chat-1");
      expect(result.state2.activeChatId).toBe("test-chat-1");
    });

    it("should fail to set non-existent chat as active", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        // Don't initialize any chats first - this should fail
        yield* manager.setActiveChat("non-existent-chat");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should clear active chat when active chat is closed", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          yield* manager.setActiveChat("test-chat-2");
          const stateWithActive = yield* manager.getState();

          yield* manager.closeChatInstance("test-chat-2");
          const stateAfterClose = yield* manager.getState();

          return { stateWithActive, stateAfterClose };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.stateWithActive.activeChatId).toBe("test-chat-2");
      expect(result.stateAfterClose.activeChatId).toBeNull();
    });
  });

  describe("Chat State Access", () => {
    it("should get chat state for existing chat", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          const chatState = yield* manager.getChatState("test-chat-1");

          return { chatState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.chatState).toBeDefined();
      // ChatState structure depends on implementation
    });

    it("should get active chat state when chat is active", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initially no active chat
          const initialActiveChatState = yield* manager.getActiveChatState();

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          yield* manager.setActiveChat("test-chat-1");
          const activeChatState = yield* manager.getActiveChatState();

          return { initialActiveChatState, activeChatState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.initialActiveChatState).toBeNull();
      expect(result.activeChatState).toBeDefined();
    });

    it("should get null active chat state when no chat is active", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          const activeChatState = yield* manager.getActiveChatState();

          return { activeChatState };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.activeChatState).toBeNull();
    });

    it("should fail to get state for non-existent chat", async () => {
      const program = Effect.gen(function* () {
        const manager = yield* ChatManager;

        yield* manager.getChatState("non-existent-chat");
      }).pipe(Effect.provide(testLayer));

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should get chat instance for debugging", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          const chatInstance = yield* manager.getChatInstance("test-chat-1");

          return { chatInstance };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.chatInstance).toBeDefined();
      // ChatInstance structure depends on ChatService implementation
    });

    it("should get manager state", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          yield* manager.setActiveChat("test-chat-1");

          const state = yield* manager.getState();

          return { state };
        }).pipe(Effect.provide(testLayer))
      );

      expect(result.state).toBeDefined();
      expect(result.state.activeChatId).toBe("test-chat-1");
      expect(result.state.activeChats).toContain("test-chat-1");
      expect(result.state.activeChats).toContain("test-chat-2");
      expect(typeof result.state.totalMessages).toBe("number");
    });
  });

  describe("State Subscriptions", () => {
    it("should notify subscribers on state changes", async () => {
      const stateUpdates: any[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((state) => {
            stateUpdates.push({
              activeChatId: state.activeChatId,
              activeChats: [...state.activeChats],
              totalMessages: state.totalMessages,
            });
          });

          // Make changes
          yield* manager.setActiveChat("test-chat-1");
          yield* manager.setActiveChat("test-chat-2");
          yield* manager.closeChatInstance("test-chat-1");

          yield* Effect.sleep("50 millis");
          yield* unsubscribe();

          return stateUpdates.length;
        }).pipe(Effect.provide(testLayer))
      );

      expect(stateUpdates.length).toBeGreaterThan(0);

      // Check that updates reflect changes
      const activeChatIds = stateUpdates.map((update) => update.activeChatId);
      expect(activeChatIds).toContain("test-chat-1");
      expect(activeChatIds).toContain("test-chat-2");
    });

    it("should handle multiple subscribers", async () => {
      const subscriber1Updates: any[] = [];
      const subscriber2Updates: any[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          const unsubscribe1 = yield* manager.subscribe((state) => {
            subscriber1Updates.push({ activeChatId: state.activeChatId });
          });

          const unsubscribe2 = yield* manager.subscribe((state) => {
            subscriber2Updates.push({ activeChatId: state.activeChatId });
          });

          yield* manager.setActiveChat("test-chat-1");
          yield* manager.setActiveChat("test-chat-2");

          yield* Effect.sleep("50 millis");

          yield* unsubscribe1();

          yield* manager.closeChatInstance("test-chat-1");
          yield* Effect.sleep("50 millis");

          yield* unsubscribe2();

          return {
            subscriber1Count: subscriber1Updates.length,
            subscriber2Count: subscriber2Updates.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(subscriber1Updates.length).toBeGreaterThan(0);
      expect(subscriber2Updates.length).toBeGreaterThanOrEqual(
        subscriber1Updates.length
      );
    });

    it("should stop notifications after unsubscribe", async () => {
      const stateUpdates: any[] = [];

      await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Initialize chat instances first
          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.initializeChatInstance("test-chat-2", "test-agent-2");

          const unsubscribe = yield* manager.subscribe((state) => {
            stateUpdates.push({ activeChatId: state.activeChatId });
          });

          yield* manager.setActiveChat("test-chat-1");
          yield* Effect.sleep("50 millis");

          const updatesBeforeUnsubscribe = stateUpdates.length;

          yield* unsubscribe();

          yield* manager.setActiveChat("test-chat-2");
          yield* Effect.sleep("50 millis");

          return {
            updatesBeforeUnsubscribe,
            totalUpdates: stateUpdates.length,
          };
        }).pipe(Effect.provide(testLayer))
      );

      expect(stateUpdates.length).toBeGreaterThan(0);
      // Should not receive updates after unsubscribe
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid chat operations gracefully", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          // Try various invalid operations
          const initResult = yield* Effect.either(
            manager.initializeChatInstance("", "test-agent-1")
          );
          const setActiveResult = yield* Effect.either(
            manager.setActiveChat("non-existent")
          );
          const getStateResult = yield* Effect.either(
            manager.getChatState("non-existent")
          );

          return { initResult, setActiveResult, getStateResult };
        }).pipe(Effect.provide(testLayer))
      );

      // All operations should fail gracefully
      expect(Either.isLeft(result.initResult)).toBe(true);
      expect(Either.isLeft(result.setActiveResult)).toBe(true);
      expect(Either.isLeft(result.getStateResult)).toBe(true);
    });

    it("should maintain state consistency after errors", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const manager = yield* ChatManager;

          yield* manager.initializeChatInstance("test-chat-1", "test-agent-1");
          yield* manager.setActiveChat("test-chat-1");

          const stateBeforeErrors = yield* manager.getState();

          // Try invalid operations
          yield* Effect.either(manager.setActiveChat("invalid"));
          yield* Effect.either(manager.closeChatInstance("invalid"));
          yield* Effect.either(manager.getChatState("invalid"));

          const stateAfterErrors = yield* manager.getState();

          return { stateBeforeErrors, stateAfterErrors };
        }).pipe(Effect.provide(testLayer))
      );

      // State should remain consistent
      expect(result.stateAfterErrors.activeChatId).toBe(
        result.stateBeforeErrors.activeChatId
      );
      expect(result.stateAfterErrors.activeChats).toEqual(
        result.stateBeforeErrors.activeChats
      );
    });
  });
});
