import { Schema } from "effect";

// Constants
export const AGENTS_DIR = "public/static/configs/agents";

// Schema for agent configuration
export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  initialAgentName: Schema.String,
  prompt: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
});

// Type definitions
export interface AgentConfigOptions {
  readonly agentsPath: string;
}

export type AgentConfig = Schema.Schema.Type<typeof AgentConfigSchema>;
