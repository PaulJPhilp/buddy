import type { Message } from "@/types/chat";
import { beforeEach, describe, expect, test } from "vitest";
import {
  chatInstanceActions,
  chatInstanceSelectors,
  chatInstanceStore,
} from "./chatInstanceStore";

describe("chatInstanceStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    chatInstanceActions.initialize("", "");
  });

  test("should initialize with correct default state", () => {
    const state = chatInstanceStore.getSnapshot().context;

    expect(state.chatId).toBe("");
    expect(state.messages).toEqual([]);
    expect(state.status).toBe("initializing");
    expect(state.agentName).toBe("");
    expect(state.isTyping).toBe(false);
    expect(state.error).toBeUndefined();
  });

  test("should handle initialize event", () => {
    chatInstanceActions.initialize("chat123", "TestAgent");

    const state = chatInstanceStore.getSnapshot().context;
    expect(state.chatId).toBe("chat123");
    expect(state.agentName).toBe("TestAgent");
    expect(state.status).toBe("initializing");
    expect(state.messages).toEqual([]);
  });

  test("should handle status changes", () => {
    chatInstanceActions.setStatus("connected");

    const state = chatInstanceStore.getSnapshot().context;
    expect(state.status).toBe("connected");
  });

  test("should add messages correctly", () => {
    const message: Message = {
      id: "msg1",
      text: "Hello world",
      role: "user",
      timestamp: Date.now(),
    };

    chatInstanceActions.addMessage(message);

    const state = chatInstanceStore.getSnapshot().context;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(message);
    expect(state.isTyping).toBe(false); // Should clear typing when message added
  });

  test("should handle typing state", () => {
    chatInstanceActions.setTyping(true);

    let state = chatInstanceStore.getSnapshot().context;
    expect(state.isTyping).toBe(true);

    chatInstanceActions.setTyping(false);

    state = chatInstanceStore.getSnapshot().context;
    expect(state.isTyping).toBe(false);
  });

  test("should handle errors", () => {
    const errorMessage = "Connection failed";
    chatInstanceActions.setError(errorMessage);

    const state = chatInstanceStore.getSnapshot().context;
    expect(state.error).toBe(errorMessage);
    expect(state.status).toBe("error");
    expect(state.isTyping).toBe(false); // Should clear typing on error
  });

  test("should clear messages", () => {
    // Add some messages first
    const message1: Message = {
      id: "msg1",
      text: "Hello",
      role: "user",
      timestamp: Date.now(),
    };
    const message2: Message = {
      id: "msg2",
      text: "Hi there",
      role: "assistant",
      timestamp: Date.now(),
    };

    chatInstanceActions.addMessage(message1);
    chatInstanceActions.addMessage(message2);
    chatInstanceActions.setTyping(true);

    // Clear messages
    chatInstanceActions.clearMessages();

    const state = chatInstanceStore.getSnapshot().context;
    expect(state.messages).toEqual([]);
    expect(state.isTyping).toBe(false); // Should also clear typing
  });

  test("selectors should work correctly", () => {
    chatInstanceActions.initialize("chat123", "TestAgent");

    const message: Message = {
      id: "msg1",
      text: "Test message",
      role: "user",
      timestamp: Date.now(),
    };
    chatInstanceActions.addMessage(message);
    chatInstanceActions.setStatus("connected");

    const getSnapshot = () => chatInstanceStore.getSnapshot();

    expect(chatInstanceSelectors.getChatId(getSnapshot)).toBe("chat123");
    expect(chatInstanceSelectors.getAgentName(getSnapshot)).toBe("TestAgent");
    expect(chatInstanceSelectors.getMessages(getSnapshot)).toHaveLength(1);
    expect(chatInstanceSelectors.getLastMessage(getSnapshot)).toEqual(message);
    expect(chatInstanceSelectors.getMessageCount(getSnapshot)).toBe(1);
    expect(chatInstanceSelectors.getIsConnected(getSnapshot)).toBe(true);
    expect(chatInstanceSelectors.getHasError(getSnapshot)).toBe(false);
  });

  test("should handle pure state transitions without side effects", () => {
    const initialState = chatInstanceStore.getSnapshot();
    const message: Message = {
      id: "msg1",
      text: "Test",
      role: "user",
      timestamp: Date.now(),
    };

    // Test pure transition
    const [nextState] = chatInstanceStore.transition(initialState, {
      type: "messageAdded",
      message,
    });

    expect(nextState.context.messages).toHaveLength(1);
    expect(nextState.context.messages[0]).toEqual(message);

    // Original store state should be unchanged
    expect(chatInstanceStore.getSnapshot().context.messages).toHaveLength(0);
  });
});
