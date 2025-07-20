import { Workspace } from "@/../packages/config/src/types/workspace";
import { Schema } from "effect";

// ChatApp Schema based on ChatAppModel domain
export const ChatAppSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  version: Schema.String,
  agentId: Schema.String,
  workspaceId: Schema.String.pipe(Schema.optional),
  permissions: Schema.Struct({
    canSendMessages: Schema.Boolean,
    canReceiveMessages: Schema.Boolean,
    canViewHistory: Schema.Boolean,
    canDeleteMessages: Schema.Boolean,
    canModifySettings: Schema.Boolean,
    canShareConversations: Schema.Boolean,
  }),
  isDefault: Schema.Boolean.pipe(Schema.optional),
  isShared: Schema.Boolean.pipe(Schema.optional),
  isArchived: Schema.Boolean.pipe(Schema.optional),
  plugins: Schema.mutable(Schema.Array(Schema.String)).pipe(Schema.optional),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Agent Schema based on AgentModel domain
export const AgentSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  version: Schema.String,
  provider: Schema.String,
  model: Schema.String,
  prompt: Schema.String.pipe(Schema.optional),
  capabilities: Schema.mutable(Schema.Array(Schema.String)),
  parameters: Schema.Struct({
    temperature: Schema.Number.pipe(Schema.optional),
    maxTokens: Schema.Number.pipe(Schema.optional),
    topP: Schema.Number.pipe(Schema.optional),
    frequencyPenalty: Schema.Number.pipe(Schema.optional),
    presencePenalty: Schema.Number.pipe(Schema.optional),
    stopSequences: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
    customParameters: Schema.optional(
      Schema.Record({ key: Schema.String, value: Schema.Unknown })
    ),
  }),
  permissions: Schema.Struct({
    canAccessInternet: Schema.Boolean,
    canExecuteCode: Schema.Boolean,
    canAccessFiles: Schema.Boolean,
    canModifyFiles: Schema.Boolean,
    canAccessDatabase: Schema.Boolean,
    canSendEmails: Schema.Boolean,
    allowedDomains: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
    blockedDomains: Schema.mutable(Schema.Array(Schema.String)).pipe(
      Schema.optional
    ),
  }),
  isDefault: Schema.Boolean.pipe(Schema.optional),
  isShared: Schema.Boolean.pipe(Schema.optional),
  isArchived: Schema.Boolean.pipe(Schema.optional),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Settings Schema with proper typing for common settings
export const SettingsSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Union(
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    Schema.Array(Schema.String),
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  ),
});

// Main App Config Schema with proper types
export const AppConfigSchema = Schema.Struct({
  version: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  app: Schema.Struct({
    name: Schema.String,
    version: Schema.String,
    description: Schema.String.pipe(Schema.optional),
    author: Schema.String.pipe(Schema.optional),
    license: Schema.String.pipe(Schema.optional),
    homepage: Schema.String.pipe(Schema.optional),
    repository: Schema.String.pipe(Schema.optional),
    environment: Schema.Literal("development", "production", "test").pipe(
      Schema.optional
    ),
    locale: Schema.String.pipe(Schema.optional),
    timezone: Schema.String.pipe(Schema.optional),
  }),
  workspaces: Schema.mutable(Schema.Array(Workspace)),
  chatapps: Schema.mutable(Schema.Array(ChatAppSchema)),
  agents: Schema.mutable(Schema.Array(AgentSchema)),
  settings: Schema.mutable(SettingsSchema),
});

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>;
