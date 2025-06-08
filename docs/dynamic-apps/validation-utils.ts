// Validation utilities for Agents, Toolbars, and ChatApps
// Designed to support Effect.Services for all three entities, which are now mutable at runtime and managed with fiber-safe state (Refs/Chunks).
// Apps validation depends on Agents and Toolbars services for reference validation.
// Uses Effect schemas for type-safe validation
// Not UI-related; suitable for backend/dev tooling

import * as S from "@effect/schema/Schema";

// --- Example: Import your schemas here ---
// import { AgentSchema, ToolbarSchema, ToolSchema, ChatAppSchema } from "./schemas";

// Dummy schemas for illustration (replace with actual imports)
const AgentSchema = S.Struct({ id: S.String, kind: S.String, name: S.String });
const ToolSchema = S.Struct({ id: S.String, command: S.String, icon: S.String });
const ToolbarSchema = S.Struct({
  id: S.String,
  name: S.String,
  tools: S.Array(S.String).pipe(S.filter(
    (arr): arr is readonly string[] => new Set(arr).size === arr.length, 
    { message: () => "Tool IDs in a toolbar must be unique" }
  )),
});
const ChatAppSchema = S.Struct({
  id: S.String,
  name: S.String,
  agentIds: S.Array(S.String),
  toolbarIds: S.Array(S.String),
  theme: S.Record({key: S.String, value: S.Unknown}),
  parentId: S.optional(S.String),
});

// --- Validation Utilities ---

// Define the expected Agent type to match the schema
type Agent = {
  id: string;
  kind: string;
  name: string;
};

export function validateAgents(agents: unknown[]): Agent[] {
  return agents.map((agent, i) => {
    try {
      return S.decodeUnknownSync(AgentSchema as any)(agent) as Agent;
    } catch (e) {
      throw new Error(`Agent validation failed at index ${i}: ${e}`);
    }
  });
}

// Define the expected Tool type to match the schema
type Tool = {
  id: string;
  command: string;
  icon: string;
};

export function validateTools(tools: unknown[]): Tool[] {
  return tools.map((tool, i) => {
    try {
      return S.decodeUnknownSync(ToolSchema as any)(tool) as Tool;
    } catch (e) {
      throw new Error(`Tool validation failed at index ${i}: ${e}`);
    }
  });
}

// Define the expected Toolbar type to match the schema
type Toolbar = {
  id: string;
  name: string;
  tools: readonly string[];
};

export function validateToolbars(toolbars: unknown[], toolIds: Set<string>): Toolbar[] {
  return toolbars.map((tb, i) => {
    try {
      const parsed = S.decodeUnknownSync(ToolbarSchema as any)(tb) as Toolbar;
      // Check all tool IDs reference defined tools
      for (const tid of parsed.tools) {
        if (!toolIds.has(tid)) {
          throw new Error(`Toolbar '${parsed.id}' references unknown tool ID '${tid}'`);
        }
      }
      return parsed;
    } catch (e) {
      throw new Error(`Toolbar validation failed at index ${i}: ${e}`);
    }
  });
}

// Define the expected ChatApp type to match the schema
type ChatApp = {
  id: string;
  name: string;
  agentIds: readonly string[];
  toolbarIds: readonly string[];
  theme: { readonly [key: string]: unknown };
  parentId?: string;
};

export function validateChatApps(chatApps: unknown[], agentIds: Set<string>, toolbarIds: Set<string>, allAppIds: Set<string>): ChatApp[] {
  return chatApps.map((app, i) => {
    try {
      // Use type assertion to help TypeScript understand the schema type
      const parsed = S.decodeUnknownSync(ChatAppSchema as any)(app) as ChatApp;
      // Check agentIds
      for (const aid of parsed.agentIds) {
        if (!agentIds.has(aid)) {
          throw new Error(`ChatApp '${parsed.id}' references unknown agent ID '${aid}'`);
        }
      }
      // Check toolbarIds
      for (const tid of parsed.toolbarIds) {
        if (!toolbarIds.has(tid)) {
          throw new Error(`ChatApp '${parsed.id}' references unknown toolbar ID '${tid}'`);
        }
      }
      // Check parentId if present
      if (parsed.parentId && !allAppIds.has(parsed.parentId)) {
        throw new Error(`ChatApp '${parsed.id}' references unknown parentId '${parsed.parentId}'`);
      }
      return parsed;
    } catch (e) {
      throw new Error(`ChatApp validation failed at index ${i}: ${e}`);
    }
  });
}

// --- Usage Example ---
// const agents = validateAgents(rawAgents);
// const tools = validateTools(rawTools);
// const toolbars = validateToolbars(rawToolbars, new Set(tools.map(t => t.id)));
// const chatApps = validateChatApps(rawChatApps, new Set(agents.map(a => a.id)), new Set(toolbars.map(tb => tb.id)), allAppIdsSet);

// Replace dummy schemas with real ones and adapt as needed for your codebase.
