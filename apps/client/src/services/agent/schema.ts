import { Schema } from "effect";

// Agent configuration schema for validation
export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  initialAgentName: Schema.String,
  prompt: Schema.optional(Schema.String),
});
