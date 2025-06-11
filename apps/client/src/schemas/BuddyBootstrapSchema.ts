// Import the ChatAppTheme type but not the schema
import { ChatAppTheme } from "@/themes/themeTypes";
import { Schema } from "effect";
import { AgentConfigSchema } from "./AgentConfigSchema";
import { ChatAppConfigSchema } from "./ChatAppConfigSchema";
import { ToolbarConfigSchema } from "./ToolbarConfigSchema";

/**
 * BuddyBootstrapConfig: Unified bootstrap config for initializing all chat runtime data.
 * - agents: array of agent configs
 * - toolbars: array of toolbar configs
 * - themes: record of themeId -> theme object
 * - chatApps: array of ChatAppConfig
 */
// Define the schema for the BuddyBootstrap configuration
export const BuddyBootstrapSchema = Schema.Struct({
  agents: Schema.Array(AgentConfigSchema),
  toolbars: Schema.Array(ToolbarConfigSchema),
  // Use Schema.Any for themes to avoid compatibility issues
  // This will still allow the runtime to process the themes correctly
  themes: Schema.Any,
  chatApps: Schema.Array(ChatAppConfigSchema),
});

// Define the type explicitly to ensure it matches what the BuddyBootstrapLoader expects
export interface BuddyBootstrapConfig {
  agents: Array<Schema.Schema.Type<typeof AgentConfigSchema>>;
  toolbars: Array<Schema.Schema.Type<typeof ToolbarConfigSchema>>;
  themes: Record<string, ChatAppTheme>;
  chatApps: Array<Schema.Schema.Type<typeof ChatAppConfigSchema>>;
}
