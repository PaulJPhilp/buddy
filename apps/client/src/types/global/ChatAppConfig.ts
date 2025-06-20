import { Schema } from "effect";

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
    agent: Schema.optional(
      Schema.Struct({
        id: Schema.String,
        initialAgentName: Schema.String,
        prompt: Schema.optional(Schema.String),
      }),
    ),

    toolbar: Schema.optional(
      Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        tools: Schema.Array(Schema.String),
      }),
    ),

    // Style object (keeping as unknown since it's just styling data)
    style: Schema.optional(Schema.Unknown),
  },
) {}

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
