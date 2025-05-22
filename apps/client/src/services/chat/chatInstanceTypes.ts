/**
 * Represents a monetary value in cents.
 */
export type Cents = number;

/**
 * Represents an error that occurred during an agent interaction,
 * captured with a timestamp and optional context.
 */
export interface TimestampedAgentError {
  timestamp: Date;
  error: Error | string; // Allow string for serialized errors if necessary
  message: string; // User-facing or detailed error message
  context?: string; // e.g., "sendMessage", "agentResponseProcessing"
}

/**
 * A unique identifier for a specific agent interaction stream or instance.
 * Useful for tracking metadata related to specific agents or conversations
 * within a single ChatApp instance if it communicates with multiple distinct
 * agent 'sessions' or needs to differentiate LLM-generated titles per agent.
 */
export type AgentInstanceId = string;

/**
 * Represents the accumulated token usage and associated cost for a ChatApp instance.
 */
export interface TokenUsage {
  totalTokens: number;
  totalCost: Cents;
}
