import { Schema } from "effect";

export interface ChatAppConfig {
  id: string;
  name: string;
  agentId: string;
  toolbarId: string;
}

export const ChatAppConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  agentId: Schema.String,
  toolbarId: Schema.String,
});
