import { Schema } from "effect";

// Define the Agent schema separately for clarity
const AgentSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  initialAgentName: Schema.optional(Schema.String),
  prompt: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  ownerId: Schema.optional(Schema.String),
  spaceId: Schema.optional(Schema.String),
});

// Simple ChatAppConfig Schema Class that matches the actual JSON structure
export class ChatAppConfig extends Schema.Class<ChatAppConfig>("ChatAppConfig")(
  {
    // Required core properties
    id: Schema.String,
    name: Schema.String,
    agentId: Schema.String,
    toolbarId: Schema.String,
    themeId: Schema.String,

    // Optional metadata
    description: Schema.optional(Schema.String),
    version: Schema.optional(Schema.String),

    // Embedded configurations (as they exist in the JSON files)
    agent: Schema.optional(AgentSchema),

    toolbar: Schema.optional(
      Schema.Struct({
        id: Schema.String,
        name: Schema.optional(Schema.String),
        tools: Schema.optional(Schema.Array(Schema.String)),
      })
    ),

    // Style object (keeping as unknown since it's just styling data)
    style: Schema.optional(Schema.Unknown),

    // New properties
    updatedAt: Schema.optional(Schema.String),
    ownerId: Schema.optional(Schema.String),
    spaceId: Schema.optional(Schema.String),
    theme: Schema.optional(Schema.Unknown),
    isDefault: Schema.optional(Schema.Boolean),
    isShared: Schema.optional(Schema.Boolean),
  }
) {}

// Export the schema for use in services
export const ChatAppConfigSchema = ChatAppConfig;

// Utility functions for working with ChatAppConfig
export namespace ChatAppConfig {
  /**
   * Parse and validate ChatAppConfig from unknown data
   */
  export const parse = Schema.decodeUnknownSync(ChatAppConfig);

  /**
   * Parse ChatAppConfig with Effect error handling
   */
  export const parseEffect = Schema.decodeUnknown(ChatAppConfig);

  /**
   * Encode ChatAppConfig to plain object
   */
  export const encode = Schema.encodeSync(ChatAppConfig);

  /**
   * Check if an object is a valid ChatAppConfig
   */
  export const is = Schema.is(ChatAppConfig);
}
