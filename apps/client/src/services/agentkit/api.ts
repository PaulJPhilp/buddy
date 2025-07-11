import { Effect, Stream } from "effect";
import type { AgentConfig } from "./types";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Proper usage type based on AI SDK standards
export interface AgentUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface AgentResponse {
  content: string;
  usage?: AgentUsage;
  finishReason?: "stop" | "length" | "content_filter" | "error" | string;
}

export interface AgentStreamChunk {
  content: string;
  usage?: AgentUsage;
  finishReason?: "stop" | "length" | "content_filter" | "error" | string;
}

/**
 * AgentServiceApi is parameterized by AgentConfig, allowing dynamic agent instantiation.
 */
export interface AgentServiceApi {
  /**
   * Generate a completion from the agent (single or multi-turn chat).
   */
  readonly generate: (
    input: string | ChatMessage[],
    config?: Partial<AgentConfig>
  ) => Effect.Effect<AgentResponse, unknown>;

  /**
   * Stream a completion from the agent (for real-time UI).
   */
  readonly stream: (
    input: string | ChatMessage[],
    config?: Partial<AgentConfig>
  ) => Stream.Stream<AgentStreamChunk, unknown>;
}
