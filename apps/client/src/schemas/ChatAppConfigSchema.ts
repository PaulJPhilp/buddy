import { Schema } from "effect";

export interface ChatAppConfig {
  id: string;
  name: string;
  agentId: string;
  toolbarId: string;
  themeId: string;
}

export const ChatAppConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  agentId: Schema.String,
  toolbarId: Schema.String,
  themeId: Schema.String,
});
