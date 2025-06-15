import { Effect, Stream } from "effect";
import type { ChatServiceError } from "./errors";
import type {
  ChatHistoryApi,
  ChatStateApi,
  MessageApi,
  MessageValidationApi,
} from "./types";

export interface ChatServiceApi extends ChatStateApi {
  readonly initialize: () => Effect.Effect<void, ChatServiceError>;
  readonly sendMessage: (
    text: string,
    attachments?: File[],
  ) => Effect.Effect<void, ChatServiceError>;
  readonly getHistory: () => Effect.Effect<ChatHistoryApi, ChatServiceError>;
  readonly validateMessage: (
    text: string,
  ) => Effect.Effect<MessageValidationApi, ChatServiceError>;
  readonly messageStream: Stream.Stream<MessageApi, ChatServiceError>;
}
