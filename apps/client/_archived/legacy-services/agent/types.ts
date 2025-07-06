import type { Schema } from "effect";
import type { AgentConfigSchema } from "./schema";

// Represents the validated agent configuration object
export type AgentConfig = Schema.Schema.Type<typeof AgentConfigSchema>;

// Constant for the agents directory
export const AGENTS_DIR = "agents";

// AgentService-specific options
export interface AgentServiceOptions {
  readonly validateOnCreate?: boolean;
  readonly allowDuplicateIds?: boolean;
}
