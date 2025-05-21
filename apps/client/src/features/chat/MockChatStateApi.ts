import { Effect } from "effect";
import type {
  ChatHistoryPage,
  ChatState,
  ChatStateApi,
  MessageApi,
  MessageValidation,
} from "./types";

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
  get state() {
    return defaultState;
  },
  getState: () =>
    Effect.succeed(defaultState) as Effect.Effect<ChatState, never, never>,
  setState: (state: ChatState) =>
    Effect.succeed(state) as Effect.Effect<ChatState, never, never>,
  sendMessage: (message: MessageApi) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`Mock sending message: ${message.text}`);
    }) as Effect.Effect<void, Error, never>,
  setTyping: (isTyping: boolean) =>
    Effect.succeed({
      ...defaultState,
      isTyping,
    }) as Effect.Effect<ChatState, never, never>,
  validateMessage: (text: string): MessageValidation => ({
    isValid: text.length > 0 && text.length <= 2000,
    errors:
      text.length > 0 && text.length <= 2000
        ? []
        : ["Message length must be between 1 and 2000 characters"],
  }),
  loadMoreHistory: () =>
    Effect.succeed({
      messages: [],
      hasMore: false,
    }) as Effect.Effect<ChatHistoryPage, Error, never>,
  clearHistory: () =>
    Effect.succeed(undefined) as Effect.Effect<void, Error, never>,
};
