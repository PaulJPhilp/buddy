/**
 * Type definitions for workspace and storage data
 *
 * This file provides type definitions for the data structures used in the application.
 * We've removed all schema validation logic to avoid dependency on @effect/schema.
 */

// These types should match the ones in ../types.ts
// We're keeping this file as a placeholder in case we need to add validation logic back in the future
// without using @effect/schema

// Export any necessary types or constants here if needed
// For now, this file is mostly a placeholder to maintain the file structure

import { Schema } from "effect";
import {
  StorageData,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from "../types";

export const WorkspaceSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  icon: Schema.String,
  color: Schema.String,
  agentIds: Schema.Array(Schema.String),
  chatappIds: Schema.Array(Schema.String),
  createdAt: Schema.String,
  lastActiveAt: Schema.String,
  isArchived: Schema.Boolean,
  maxExpandedApps: Schema.Number,
  activeAppId: Schema.NullOr(Schema.String),
});

export const WorkspaceCreateInputSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  icon: Schema.optional(Schema.String),
  color: Schema.optional(Schema.String),
  agentIds: Schema.optional(Schema.Array(Schema.String)),
  chatappIds: Schema.optional(Schema.Array(Schema.String)),
});

export const WorkspaceUpdateInputSchema = Schema.partial(
  Schema.Struct({
    name: Schema.String,
    description: Schema.String,
    icon: Schema.String,
    color: Schema.String,
    agentIds: Schema.Array(Schema.String),
    chatappIds: Schema.Array(Schema.String),
    isArchived: Schema.Boolean,
    maxExpandedApps: Schema.Number,
    activeAppId: Schema.NullOr(Schema.String),
  })
);

export const AppStyleSchema = Schema.Struct({
  background: Schema.optional(Schema.String),
  foreground: Schema.optional(Schema.String),
  fontFamily: Schema.optional(Schema.String),
  headerHeight: Schema.optional(Schema.String),
  headerBackground: Schema.optional(Schema.String),
  headerForeground: Schema.optional(Schema.String),
  headerBorder: Schema.optional(Schema.String),
  headerShadow: Schema.optional(Schema.String),
  sidebarWidth: Schema.optional(Schema.String),
  sidebarBackground: Schema.optional(Schema.String),
  sidebarForeground: Schema.optional(Schema.String),
  sidebarBorder: Schema.optional(Schema.String),
  mainBackground: Schema.optional(Schema.String),
  mainForeground: Schema.optional(Schema.String),
  authButtonBackground: Schema.optional(Schema.String),
  authButtonForeground: Schema.optional(Schema.String),
  authButtonHoverBackground: Schema.optional(Schema.String),
});

export const AppConfigSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  version: Schema.String,
  style: AppStyleSchema,
});

export const StorageDataSchema = Schema.Struct({
  currentWorkspaceId: Schema.NullOr(Schema.String),
  workspaces: Schema.Record({ key: Schema.String, value: WorkspaceSchema }),
  chatApps: Schema.Record({ key: Schema.String, value: Schema.Any }),
  appConfig: AppConfigSchema,
});
