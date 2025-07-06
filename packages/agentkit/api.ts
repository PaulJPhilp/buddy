import { Effect, Stream } from "effect";
import type { AgentConfig } from "./types";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  content: string;
  usage?: any;
}

export interface AgentStreamChunk {
  content: string;
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
    config?: Partial<AgentConfig>,
  ) => Effect.Effect<AgentResponse, unknown>;

  /**
   * Stream a completion from the agent (for real-time UI).
   */
  readonly stream: (
    input: string | ChatMessage[],
    config?: Partial<AgentConfig>,
  ) => Stream.Stream<AgentStreamChunk, unknown>;
}
