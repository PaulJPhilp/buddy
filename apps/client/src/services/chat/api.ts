import { Effect, Stream } from "effect";
import type { ChatServiceError } from "./errors";
import type {
  ChatAgentConfig,
  ChatAgentSwitchResult,
  ChatBatchRequest,
  ChatBatchResponse,
  ChatConnectionConfig,
  ChatConnectionResult,
  ChatEventPayload,
  ChatHistoryRequest,
  ChatHistoryResponse,
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatMetrics,
  ChatOperation,
  ChatOperationResult,
  ChatProcessingOptions,
  ChatStreamOptions,
  ChatValidationResult,
} from "./types";

export interface ChatServiceApi {
  // Message processing operations
  readonly processMessage: (
    request: ChatMessageRequest,
    options?: ChatProcessingOptions
  ) => Effect.Effect<ChatMessageResponse, ChatServiceError>;

  readonly validateMessage: (
    message: string,
    options?: ChatProcessingOptions
  ) => Effect.Effect<ChatValidationResult, ChatServiceError>;

  readonly formatMessage: (
    message: ChatMessage,
    options?: ChatProcessingOptions
  ) => Effect.Effect<ChatMessage, ChatServiceError>;

  // Streaming operations
  readonly streamMessage: (
    request: ChatMessageRequest,
    options?: ChatStreamOptions
  ) => Stream.Stream<ChatMessageResponse, ChatServiceError>;

  readonly streamChat: (
    chatId: string,
    options?: ChatStreamOptions
  ) => Stream.Stream<ChatMessage, ChatServiceError>;

  // History operations
  readonly loadHistory: (
    request: ChatHistoryRequest
  ) => Effect.Effect<ChatHistoryResponse, ChatServiceError>;

  readonly searchHistory: (
    chatId: string,
    query: string,
    options?: ChatProcessingOptions
  ) => Effect.Effect<ChatMessage[], ChatServiceError>;

  readonly exportHistory: (
    chatId: string,
    format: "json" | "markdown" | "csv",
    options?: ChatProcessingOptions
  ) => Effect.Effect<string, ChatServiceError>;

  // Connection operations
  readonly establishConnection: (
    config: ChatConnectionConfig
  ) => Effect.Effect<ChatConnectionResult, ChatServiceError>;

  readonly testConnection: (
    config: ChatConnectionConfig
  ) => Effect.Effect<boolean, ChatServiceError>;

  readonly closeConnection: (
    connectionId: string
  ) => Effect.Effect<void, ChatServiceError>;

  // Agent operations
  readonly switchAgent: (
    chatId: string,
    config: ChatAgentConfig
  ) => Effect.Effect<ChatAgentSwitchResult, ChatServiceError>;

  readonly getAgentCapabilities: (
    agentId: string
  ) => Effect.Effect<string[], ChatServiceError>;

  readonly validateAgentConfig: (
    config: ChatAgentConfig
  ) => Effect.Effect<ChatValidationResult, ChatServiceError>;

  // Batch operations
  readonly processBatch: (
    request: ChatBatchRequest
  ) => Effect.Effect<ChatBatchResponse, ChatServiceError>;

  readonly validateBatch: (
    messages: ChatMessage[]
  ) => Effect.Effect<ChatValidationResult[], ChatServiceError>;

  // Utility operations
  readonly generateChatId: () => Effect.Effect<string, ChatServiceError>;

  readonly generateMessageId: () => Effect.Effect<string, ChatServiceError>;

  readonly calculateMetrics: (
    messages: ChatMessage[]
  ) => Effect.Effect<ChatMetrics, ChatServiceError>;

  // Event operations
  readonly createEvent: (
    chatId: string,
    eventType: string,
    payload: Record<string, unknown>
  ) => Effect.Effect<ChatEventPayload, ChatServiceError>;

  readonly processEvent: (
    event: ChatEventPayload
  ) => Effect.Effect<ChatOperationResult, ChatServiceError>;

  // Operation tracking
  readonly trackOperation: (
    operation: ChatOperation
  ) => Effect.Effect<string, ChatServiceError>;

  readonly getOperationStatus: (
    operationId: string
  ) => Effect.Effect<ChatOperationResult, ChatServiceError>;

  // Content processing
  readonly processAttachments: (
    attachments: File[]
  ) => Effect.Effect<ChatMessage[], ChatServiceError>;

  readonly extractContent: (
    message: ChatMessage
  ) => Effect.Effect<string, ChatServiceError>;

  readonly sanitizeContent: (
    content: string
  ) => Effect.Effect<string, ChatServiceError>;

  // Advanced operations
  readonly analyzeConversation: (
    messages: ChatMessage[]
  ) => Effect.Effect<ChatMetrics, ChatServiceError>;

  readonly suggestResponses: (
    context: ChatMessage[],
    options?: ChatProcessingOptions
  ) => Effect.Effect<string[], ChatServiceError>;

  readonly detectIntent: (
    message: string
  ) => Effect.Effect<string, ChatServiceError>;

  // Debugging and monitoring
  readonly getServiceHealth: () => Effect.Effect<
    Record<string, unknown>,
    ChatServiceError
  >;

  readonly getServiceMetrics: () => Effect.Effect<
    ChatMetrics,
    ChatServiceError
  >;

  readonly resetService: () => Effect.Effect<void, ChatServiceError>;
}
