import { Effect } from "effect";
import type { AgentKitBridgeError } from "./errors";

export type Provider = "google" | "openai" | "anthropic" | "test";

export interface AgentKitConfig {
  provider: Provider;
  model?: string;
}

export interface AgentKitResponse {
  content: string;
  provider: Provider;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentKitBridgeApi {
  readonly setProvider: (
    provider: Provider,
    model?: string
  ) => Effect.Effect<void, never, never>;
  readonly getProvider: () => Effect.Effect<AgentKitConfig, never, never>;
  readonly generateMessage: (
    message: string
  ) => Effect.Effect<AgentKitResponse, AgentKitBridgeError, never>;
  readonly streamMessage: (
    message: string
  ) => Effect.Effect<AgentKitResponse, AgentKitBridgeError, never>;
}
