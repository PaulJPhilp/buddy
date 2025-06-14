import { Schema } from "effect";

export interface AgentConfig {
  id: string;
  initialAgentName: string;
  prompt?: string;
}

export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  initialAgentName: Schema.String,
  prompt: Schema.optional(Schema.String),
});
