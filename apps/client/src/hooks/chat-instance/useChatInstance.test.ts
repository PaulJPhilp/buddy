/**
 * @file useChatInstance Tests
 * @module hooks/chat-instance/useChatInstance.test
 */

import type { ChatAgentConfig, ChatInstanceAction } from "@/types/chat";
import { renderHook, waitFor } from "@testing-library/react";
import { Effect, Fiber, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useChatInstance } from "./useChatInstance";

// Custom store implementations for testing
const mockChatInstanceStore = {
  send: (event: any) => console.log("ChatInstance store event:", event),
};

const mockAgentStore = {
  send: (event: any) => console.log("Agent store event:", event),
};

const mockConnectionStore = {
  send: (event: any) => console.log("Connection store event:", event),
};

// Mock store hook
const mockUseStore = (store: any, selector?: any) => {
  // Return different mock data based on store
  if (store === mockChatInstanceStore) {
    return {
      chatId: "test-chat-123",
      messages: [],
      status: "connected",
      agentName: "Test Agent",
      isTyping: false,
      error: undefined,
    };
  }
  if (store === mockAgentStore) {
    return {
      pendingMessages: [],
      isConnected: true,
      lastActivity: Date.now(),
    };
  }
  if (store === mockConnectionStore) {
    return {
      status: "connected",
      connectionId: "conn-123",
    };
  }
  return {};
};

// Custom mock implementations
const mockBridge = {
  initialize: () => ({ _tag: "Success", value: undefined }),
  processAction: () => ({ _tag: "Success", value: undefined }),
  cleanup: () => ({ _tag: "Success", value: undefined }),
};

describe("useChatInstance", () => {
  const testChatId = "test-chat-123";
  const mockAgentConfig: ChatAgentConfig = {
    agentId: "test-agent-456",
    initialAgentName: "Test Agent",
  };

  const mockChatInstanceState = {
    chatId: testChatId,
    messages: [],
    status: "connected",
    agentName: "Test Agent",
    isTyping: false,
    error: undefined,
  };

  const mockAgentState = {
    pendingMessages: [],
    isConnected: true,
    lastActivity: Date.now(),
  };

  const mockConnectionState = {
    status: "connected",
    connectionId: "conn-123",
  };

  beforeEach(() => {
    // Reset test state
  });

  afterEach(() => {
    // Cleanup test state
  });

  test("should be importable", () => {
    expect(useChatInstance).toBeDefined();
    expect(typeof useChatInstance).toBe("function");
  });

  test("should have correct function signature", () => {
    expect(useChatInstance.length).toBe(3); // chatId, agentConfigData, injectedLayer
  });

  test("should initialize with correct state", () => {
    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.chatId).toBe(testChatId);
    expect(result.current.chatState.messages).toEqual([]);
    expect(result.current.chatState.status).toBe("connected");
    expect(result.current.chatState.agentName).toBe("Test Agent");
    expect(result.current.chatState.isTyping).toBe(false);
    expect(result.current.runtimeError).toBeNull();
    expect(typeof result.current.dispatchAction).toBe("function");
  });

  test("should initialize bridge on mount", () => {
    renderHook(() => useChatInstance(testChatId, mockAgentConfig));

    expect(mockEffectRunFork).toHaveBeenCalled();
    expect(mockEffectGen).toHaveBeenCalled();
  });

  test("should combine messages from chat instance and agent stores", () => {
    const chatMessages = [
      { id: "msg1", text: "Hello", sender: "user", timestamp: Date.now() },
    ];
    const pendingMessages = [
      {
        id: "msg2",
        text: "Hi there",
        sender: "assistant",
        timestamp: Date.now(),
      },
    ];

    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, messages: chatMessages })
      .mockReturnValueOnce({ ...mockAgentState, pendingMessages })
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.messages).toHaveLength(2);
    expect(result.current.chatState.messages).toEqual([
      ...chatMessages,
      ...pendingMessages,
    ]);
  });

  test("should handle bridge initialization errors", async () => {
    const testError = new Error("Bridge initialization failed");

    mockEffectGen.mockImplementation((genFn) => {
      throw testError;
    });

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    await waitFor(() => {
      expect(result.current.runtimeError).toEqual(testError);
    });
  });

  test("should dispatch actions through bridge", () => {
    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    const testAction: ChatInstanceAction = {
      type: "SEND_MESSAGE",
      payload: { text: "Hello, world!" },
    };

    result.current.dispatchAction(testAction);

    // Verify that Effect.runFork was called (for the action dispatch)
    expect(mockEffectRunFork).toHaveBeenCalled();
  });

  test("should handle action dispatch when bridge is not initialized", () => {
    // Mock no bridge available
    mockEffectGen.mockImplementation(() => {
      throw new Error("No bridge");
    });

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    const testAction: ChatInstanceAction = {
      type: "SEND_MESSAGE",
      payload: { text: "Hello" },
    };

    // Should not throw, but should warn
    expect(() => {
      result.current.dispatchAction(testAction);
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  test("should use injected layer when provided", () => {
    const injectedLayer = { _tag: "InjectedLayer" };

    renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig, injectedLayer),
    );

    expect(mockLayerProvide).toHaveBeenCalledWith(
      expect.anything(),
      injectedLayer,
    );
  });

  test("should create default service layer when no injection provided", () => {
    renderHook(() => useChatInstance(testChatId, mockAgentConfig));

    expect(mockLayerMerge).toHaveBeenCalled();
  });

  test("should handle status from chat instance state", () => {
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, status: "connecting" })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.status).toBe("connecting");
  });

  test("should handle typing state from chat instance state", () => {
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, isTyping: true })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.isTyping).toBe(true);
  });

  test("should handle error state from chat instance state", () => {
    const errorMessage = "Connection error";
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, error: errorMessage })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.error).toBe(errorMessage);
  });

  test("should fall back to initial agent name when not in state", () => {
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, agentName: undefined })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.agentName).toBe(
      mockAgentConfig.initialAgentName,
    );
  });

  test("should fall back to provided chatId when not in state", () => {
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, chatId: undefined })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.chatId).toBe(testChatId);
  });

  test("should maintain stable dispatch function reference", () => {
    const { result, rerender } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    const firstDispatch = result.current.dispatchAction;

    rerender();

    expect(result.current.dispatchAction).toBe(firstDispatch);
  });

  test("should re-initialize when chatId changes", () => {
    const { rerender } = renderHook(
      ({ chatId }) => useChatInstance(chatId, mockAgentConfig),
      { initialProps: { chatId: "chat-1" } },
    );

    expect(mockEffectRunFork).toHaveBeenCalledTimes(1);

    rerender({ chatId: "chat-2" });

    expect(mockEffectRunFork).toHaveBeenCalledTimes(2);
  });

  test("should re-initialize when agentId changes", () => {
    const { rerender } = renderHook(
      ({ agentConfig }) => useChatInstance(testChatId, agentConfig),
      {
        initialProps: {
          agentConfig: { agentId: "agent-1", initialAgentName: "Agent 1" },
        },
      },
    );

    expect(mockEffectRunFork).toHaveBeenCalledTimes(1);

    rerender({
      agentConfig: { agentId: "agent-2", initialAgentName: "Agent 2" },
    });

    expect(mockEffectRunFork).toHaveBeenCalledTimes(2);
  });

  test("should cleanup fiber on unmount", () => {
    const mockFiber = {
      id: () => ({ id: "test-fiber-id" }),
    };
    mockEffectRunFork.mockReturnValue(mockFiber);

    const { unmount } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    unmount();

    expect(mockEffectRunFork).toHaveBeenCalledWith(
      expect.objectContaining({
        pipe: expect.any(Function),
      }),
    );
  });

  test("should handle empty pending messages gracefully", () => {
    mockUseStore
      .mockReturnValueOnce(mockChatInstanceState)
      .mockReturnValueOnce({ ...mockAgentState, pendingMessages: undefined })
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.messages).toEqual(
      mockChatInstanceState.messages,
    );
  });

  test("should handle empty chat messages gracefully", () => {
    mockUseStore
      .mockReturnValueOnce({ ...mockChatInstanceState, messages: undefined })
      .mockReturnValueOnce(mockAgentState)
      .mockReturnValueOnce(mockConnectionState);

    const { result } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    expect(result.current.chatState.messages).toEqual(
      mockAgentState.pendingMessages,
    );
  });

  test("should memoize chat state appropriately", () => {
    const { result, rerender } = renderHook(() =>
      useChatInstance(testChatId, mockAgentConfig),
    );

    const firstChatState = result.current.chatState;

    // Re-render with same store values
    rerender();

    expect(result.current.chatState).toBe(firstChatState);
  });
});
