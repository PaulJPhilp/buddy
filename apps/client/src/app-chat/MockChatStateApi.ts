import type { ChatStateApi, ChatState, MessageApi, MessageValidation, ChatHistoryPage } from "./ChatServiceApi";
import { Effect } from "effect";

// Minimal in-memory state for the mock
const defaultState: ChatState = {
  id: "mock-chat",
  messages: [],
  isTyping: false,
  metadata: {
    messageCount: 0,
    totalAttachments: 0,
  },
};

export const MockChatStateApi: ChatStateApi = {
  getState: () => Effect.succeed(defaultState),
  setState: (state: ChatState) => Effect.succeed(state),
  sendMessage: (text: string) =>
    Effect.succeed({
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: Date.now(),
    } as MessageApi),
  setTyping: (isTyping: boolean) =>
    Effect.succeed({
      ...defaultState,
      isTyping,
    }),
  validateMessage: (text: string) =>
    Effect.succeed({ isValid: true, errors: [] } as MessageValidation),
  getHistory: () =>
    Effect.succeed({
      messages: [],
      hasMore: false,
      nextCursor: undefined,
    } as ChatHistoryPage),
  clearHistory: () => Effect.succeed(undefined),
};
