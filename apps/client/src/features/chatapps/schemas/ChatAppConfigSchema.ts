import { calculateContrastColor } from "@/features/shared/utils/color-utils";
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

/**
 * ChatApp visual styling configuration.
 * Defines colors, typography, and visual appearance for the chat app.
 */
export class ChatAppStyle extends Schema.Class<ChatAppStyle>("ChatAppStyle")({
  // Primary color and its contrast
  primaryColor: Schema.String.pipe(Schema.optional),
  primaryContrastColor: Schema.String.pipe(Schema.optional),

  // Background colors
  backgroundColor: Schema.String.pipe(Schema.optional),
  backgroundSecondaryColor: Schema.String.pipe(Schema.optional),

  // Border styling
  borderColor: Schema.String.pipe(Schema.optional),
  borderRadius: Schema.String.pipe(Schema.optional),
  borderWidth: Schema.String.pipe(Schema.optional),

  // Typography
  typographyClass: Schema.String.pipe(Schema.optional),
  fontFamily: Schema.String.pipe(Schema.optional),
  fontSize: Schema.String.pipe(Schema.optional),
  fontWeight: Schema.String.pipe(Schema.optional),

  // Chat-specific styling
  messageBackgroundColor: Schema.String.pipe(Schema.optional),
  userMessageColor: Schema.String.pipe(Schema.optional),
  assistantMessageColor: Schema.String.pipe(Schema.optional),
  inputBackgroundColor: Schema.String.pipe(Schema.optional),
  inputBorderColor: Schema.String.pipe(Schema.optional),

  // Additional styling properties
  shadowColor: Schema.String.pipe(Schema.optional),
  shadowIntensity: Schema.Literal("none", "sm", "md", "lg", "xl").pipe(
    Schema.optional
  ),
  opacity: Schema.Number.pipe(Schema.optional),

  // Icon styling
  iconColor: Schema.String.pipe(Schema.optional),
  iconSize: Schema.String.pipe(Schema.optional),

  // Layout preferences
  compactMode: Schema.Boolean.pipe(Schema.optional),
  showTimestamps: Schema.Boolean.pipe(Schema.optional),
  showAvatars: Schema.Boolean.pipe(Schema.optional),
}) {
  /**
   * Get the primary contrast color, calculating it if not explicitly set
   */
  get computedPrimaryContrastColor(): string {
    if (this.primaryContrastColor) {
      return this.primaryContrastColor;
    }

    if (this.primaryColor) {
      return calculateContrastColor(this.primaryColor);
    }

    return "#ffffff"; // Default fallback
  }

  /**
   * Create a ChatAppStyle instance with computed contrast color
   */
  static createWithComputedContrast(data: Partial<ChatAppStyle>): ChatAppStyle {
    const style = new ChatAppStyle(data);

    // If primaryContrastColor is not set but primaryColor is, calculate it
    if (!data.primaryContrastColor && data.primaryColor) {
      return new ChatAppStyle({
        ...data,
        primaryContrastColor: calculateContrastColor(data.primaryColor),
      });
    }

    return style;
  }
}

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

    // Style object with proper schema
    style: Schema.optional(ChatAppStyle),

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
