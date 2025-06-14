import { ChatAppTheme } from "@/themes/themeTypes";
import { Schema } from "effect";

// Agent configuration embedded in chat app
export interface AgentConfig {
  id: string;
  initialAgentName: string;
  // Add other agent properties as needed
}

// Toolbar configuration embedded in chat app
export interface ToolbarConfig {
  id: string;
  name: string;
  tools: string[];
  // Add other toolbar properties as needed
}

export interface ChatAppConfig {
  id: string;
  name: string;
  agentId: string;
  toolbarId: string;
  themeId: string;
  theme?: ChatAppTheme; // Optional runtime theme object

  // Embedded configurations (new flattened format)
  agent?: AgentConfig;
  toolbar?: ToolbarConfig;

  // Optional metadata
  description?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  initialAgentName: Schema.String,
});

export const ToolbarConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  tools: Schema.Array(Schema.String),
});

export const ChatAppConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  agentId: Schema.String,
  toolbarId: Schema.String,
  themeId: Schema.String,
  theme: Schema.optional(Schema.Unknown), // Theme is optional and can be any object

  // Embedded configurations (optional for backward compatibility)
  agent: Schema.optional(AgentConfigSchema),
  toolbar: Schema.optional(ToolbarConfigSchema),

  // Optional metadata
  description: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String),
});
