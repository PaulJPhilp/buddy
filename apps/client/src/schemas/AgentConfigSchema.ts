import { Schema } from "effect";

export interface AgentConfig {
  id: string;
  initialAgentName: string;
}

export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  initialAgentName: Schema.String,
});
