import { act, renderHook } from "@testing-library/react";
import { Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MdxService } from "@/services/mdx";
import { WebSocketService } from "@/services/websocket/WebSocketService";
import type { ChatAgentConfig } from "../features/chat/types";
import { useChatInstance } from "./useChatInstance";

// Test configuration
const testAgentConfig: ChatAgentConfig = {
  agentId: "test-agent",
  initialAgentName: "Test Agent"
};

const testChatId = "test-chat-1";

// Test utilities
function createTestLayer() {
  return Layer.merge(
    WebSocketService.Default,
    MdxService.Default
  );
}



describe("useChatInstance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with correct initial state", () => {
    const testLayer = createTestLayer();

    const { result } = renderHook(
      () => useChatInstance(testChatId, testAgentConfig, testLayer)
    );

    expect(result.current.chatState.chatId).toBe(testChatId);
    expect(result.current.chatState.status).toBe("initializing");
    expect(result.current.chatState.agentName).toBe(testAgentConfig.initialAgentName);
    expect(result.current.chatState.messages).toEqual([]);
    expect(result.current.chatState.isTyping).toBe(false);
    expect(result.current.runtimeError).toBe(null);
  });

  it("should handle connection gracefully with real services", async () => {
    const testLayer = createTestLayer();

    const { result } = renderHook(
      () => useChatInstance(testChatId, testAgentConfig, testLayer)
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Without a real WebSocket server, connection should fail gracefully
    expect(["error", "connecting", "disconnected", "initializing"]).toContain(result.current.chatState.status);
  });

  it("should dispatch actions without throwing", async () => {
    const testLayer = createTestLayer();

    const { result } = renderHook(
      () => useChatInstance(testChatId, testAgentConfig, testLayer)
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Dispatch action should not throw
    expect(() => {
      act(() => {
        result.current.dispatchAction({
          _tag: "sendMessage",
          text: "Hello Agent"
        });
      });
    }).not.toThrow();

    // Reconnection should not throw
    expect(() => {
      act(() => {
        result.current.dispatchAction({ _tag: "tryReconnect" });
      });
    }).not.toThrow();
  });
});