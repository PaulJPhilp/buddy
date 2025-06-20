import { Effect, Stream } from "effect";
import type { ChatServiceError } from "./errors";
import type {
  ChatHistoryApi,
  ChatState,
  ChatStateApi,
  MessageApi,
  MessageValidationApi,
} from "./types";

export interface ChatServiceApi extends ChatStateApi {
  readonly initialize: (
    chatId: string,
    wsUrl?: string,
    agentId?: string,
  ) => Effect.Effect<void, ChatServiceError>;
  readonly switchAgent: (
    agentId: string,
  ) => Effect.Effect<void, ChatServiceError>;
  readonly sendMessage: (
    text: string,
    attachments?: File[],
  ) => Effect.Effect<void, ChatServiceError>;
  readonly getHistory: () => Effect.Effect<ChatHistoryApi, ChatServiceError>;
  readonly validateMessage: (
    text: string,
  ) => Effect.Effect<MessageValidationApi, ChatServiceError>;
  /**
   * Reactive stream that emits the full chat state whenever it changes. This
   * allows React hooks to subscribe instead of resorting to manual polling.
   */
  readonly stateStream: Stream.Stream<ChatState, ChatServiceError>;
  readonly messageStream: Stream.Stream<MessageApi, ChatServiceError>;
  /**
   * Direct subscription to state changes. More reliable than stream for React hooks.
   * Returns an unsubscribe function.
   */
  readonly subscribeToState: (
    callback: (state: ChatState) => void,
  ) => () => void;
}
