// Re-export global types
export type { Message } from "@/types";

// Service constants
export const CHAT_SERVICE_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_BATCH_SIZE: 100,
  MAX_ATTACHMENT_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  DEFAULT_TIMEOUT_MS: 30000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_STREAM_BUFFER_SIZE: 1000,
  SUPPORTED_FORMATS: ["json", "markdown", "csv"] as const,
  SUPPORTED_CONTENT_TYPES: [
    "text/plain",
    "text/markdown",
    "application/json",
    "image/png",
    "image/jpeg",
    "image/gif",
    "application/pdf",
  ] as const,
} as const;

// Core message types
export interface ChatMessage {
  readonly id: string;
  readonly content: string;
  readonly role: "user" | "assistant" | "system";
  readonly timestamp: number;
  readonly chatId: string;
  readonly attachments?: readonly ChatAttachment[];
  readonly metadata?: Record<string, unknown>;
  readonly status?: "pending" | "sent" | "delivered" | "error";
  readonly parentId?: string;
  readonly threadId?: string;
}

export interface ChatAttachment {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url?: string;
  readonly content?: string;
  readonly metadata?: Record<string, unknown>;
}

// Request/Response types
export interface ChatMessageRequest {
  readonly chatId: string;
  readonly content: string;
  readonly role?: "user" | "assistant" | "system";
  readonly attachments?: readonly File[];
  readonly metadata?: Record<string, unknown>;
  readonly parentId?: string;
  readonly threadId?: string;
  readonly agentId?: string;
  readonly options?: ChatProcessingOptions;
}

export interface ChatMessageResponse {
  readonly message: ChatMessage;
  readonly processingTime: number;
  readonly tokenCount?: number;
  readonly confidence?: number;
  readonly suggestions?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

// Validation types
export interface ChatValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

// Processing options
export interface ChatProcessingOptions {
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly priority?: "low" | "normal" | "high";
  readonly enableSuggestions?: boolean;
  readonly enableAnalytics?: boolean;
  readonly filterContent?: boolean;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly model?: string;
  readonly systemPrompt?: string;
  readonly context?: readonly ChatMessage[];
}

// Streaming options
export interface ChatStreamOptions {
  readonly bufferSize?: number;
  readonly flushInterval?: number;
  readonly enableCompression?: boolean;
  readonly includeMetadata?: boolean;
  readonly filter?: (message: ChatMessage) => boolean;
}

// History operations
export interface ChatHistoryRequest {
  readonly chatId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly includeMetadata?: boolean;
  readonly filter?: ChatHistoryFilter;
}

export interface ChatHistoryFilter {
  readonly role?: "user" | "assistant" | "system";
  readonly hasAttachments?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly containsText?: string;
  readonly threadId?: string;
  readonly status?: "pending" | "sent" | "delivered" | "error";
}

export interface ChatHistoryResponse {
  readonly messages: readonly ChatMessage[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
  readonly metadata?: Record<string, unknown>;
}

// Connection types
export interface ChatConnectionConfig {
  readonly endpoint: string;
  readonly protocol: "websocket" | "http" | "grpc";
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly authentication?: ChatAuthConfig;
  readonly headers?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}

export interface ChatAuthConfig {
  readonly type: "bearer" | "api_key" | "oauth" | "none";
  readonly token?: string;
  readonly apiKey?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly scope?: string;
}

export interface ChatConnectionResult {
  readonly connectionId: string;
  readonly status: "connected" | "disconnected" | "error";
  readonly endpoint: string;
  readonly latency?: number;
  readonly capabilities?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

// Agent types
export interface ChatAgentConfig {
  readonly agentId: string;
  readonly name: string;
  readonly model?: string;
  readonly systemPrompt?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly capabilities?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface ChatAgentSwitchResult {
  readonly previousAgentId?: string;
  readonly newAgentId: string;
  readonly switchTime: number;
  readonly migrationRequired: boolean;
  readonly metadata?: Record<string, unknown>;
}

// Batch operations
export interface ChatBatchRequest {
  readonly batchId: string;
  readonly messages: readonly ChatMessageRequest[];
  readonly options?: ChatProcessingOptions;
  readonly parallel?: boolean;
  readonly failFast?: boolean;
}

export interface ChatBatchResponse {
  readonly batchId: string;
  readonly responses: readonly ChatMessageResponse[];
  readonly successCount: number;
  readonly failureCount: number;
  readonly processingTime: number;
  readonly errors?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

// Operation tracking
export interface ChatOperation {
  readonly id: string;
  readonly type: string;
  readonly chatId?: string;
  readonly messageId?: string;
  readonly agentId?: string;
  readonly startTime: number;
  readonly parameters?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export interface ChatOperationResult {
  readonly operationId: string;
  readonly status: "pending" | "running" | "completed" | "failed" | "cancelled";
  readonly progress?: number;
  readonly result?: unknown;
  readonly error?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly duration?: number;
  readonly metadata?: Record<string, unknown>;
}

// Metrics and analytics
export interface ChatMetrics {
  readonly messageCount: number;
  readonly averageMessageLength: number;
  readonly totalCharacters: number;
  readonly attachmentCount: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
  readonly tokenUsage?: number;
  readonly conversationDuration?: number;
  readonly participantCount?: number;
  readonly topicDistribution?: Record<string, number>;
  readonly sentimentScore?: number;
  readonly metadata?: Record<string, unknown>;
}

// Event types
export interface ChatEventPayload {
  readonly eventId: string;
  readonly chatId: string;
  readonly eventType: string;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

// Utility types
export interface ChatServiceConfig {
  readonly maxConcurrentOperations: number;
  readonly defaultTimeout: number;
  readonly enableMetrics: boolean;
  readonly enableLogging: boolean;
  readonly logLevel: "debug" | "info" | "warn" | "error";
  readonly retryPolicy: ChatRetryPolicy;
  readonly rateLimits: ChatRateLimits;
}

export interface ChatRetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly retryableErrors: readonly string[];
}

export interface ChatRateLimits {
  readonly messagesPerMinute: number;
  readonly requestsPerSecond: number;
  readonly concurrentConnections: number;
  readonly maxBatchSize: number;
}

// Validation helpers
export function isValidChatMessage(message: unknown): message is ChatMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "id" in message &&
    "content" in message &&
    "role" in message &&
    "timestamp" in message &&
    "chatId" in message &&
    typeof (message as any).id === "string" &&
    typeof (message as any).content === "string" &&
    ["user", "assistant", "system"].includes((message as any).role) &&
    typeof (message as any).timestamp === "number" &&
    typeof (message as any).chatId === "string"
  );
}

export function isValidChatId(chatId: unknown): chatId is string {
  return (
    typeof chatId === "string" && chatId.length > 0 && chatId.length <= 100
  );
}

export function isValidMessageContent(content: unknown): content is string {
  return (
    typeof content === "string" &&
    content.length >= CHAT_SERVICE_CONSTANTS.MIN_MESSAGE_LENGTH &&
    content.length <= CHAT_SERVICE_CONSTANTS.MAX_MESSAGE_LENGTH
  );
}

export function isValidAttachment(
  attachment: unknown
): attachment is ChatAttachment {
  return (
    typeof attachment === "object" &&
    attachment !== null &&
    "id" in attachment &&
    "name" in attachment &&
    "size" in attachment &&
    "type" in attachment &&
    typeof (attachment as any).id === "string" &&
    typeof (attachment as any).name === "string" &&
    typeof (attachment as any).size === "number" &&
    typeof (attachment as any).type === "string" &&
    (attachment as any).size <= CHAT_SERVICE_CONSTANTS.MAX_ATTACHMENT_SIZE
  );
}

// Utility functions
export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function calculateMessageTokens(content: string): number {
  // Simple token estimation (4 characters per token on average)
  return Math.ceil(content.length / 4);
}

export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function createChatMessage(
  id: string,
  content: string,
  role: "user" | "assistant" | "system",
  chatId: string,
  options?: Partial<ChatMessage>
): ChatMessage {
  return {
    id,
    content,
    role,
    chatId,
    timestamp: Date.now(),
    status: "pending",
    ...options,
  };
}

export function createChatEvent(
  chatId: string,
  eventType: string,
  payload: Record<string, unknown>
): ChatEventPayload {
  return {
    eventId: `event_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`,
    chatId,
    eventType,
    timestamp: Date.now(),
    payload,
  };
}
