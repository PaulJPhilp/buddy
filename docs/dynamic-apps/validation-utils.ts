// Validation utilities for Agents, Toolbars, and ChatApps
// Designed to support Effect.Services for all three entities, which are now mutable at runtime and managed with fiber-safe state (Refs/Chunks).
// Apps validation depends on Agents and Toolbars services for reference validation.
// Uses Effect schemas for type-safe validation
// Not UI-related; suitable for backend/dev tooling

import * as S from "@effect/schema/Schema";

// --- Example: Import your schemas here ---
// import { AgentSchema, ToolbarSchema, ToolSchema, ChatAppSchema } from "./schemas";

// Dummy schemas for illustration (replace with actual imports)
const AgentSchema = S.struct({ id: S.string, kind: S.string, name: S.string });
const ToolSchema = S.struct({ id: S.string, command: S.string, icon: S.string });
const ToolbarSchema = S.struct({
  id: S.string,
  name: S.string,
  tools: S.array(S.string).pipe(S.refinement(arr => new Set(arr).size === arr.length, {
    message: "Tool IDs in a toolbar must be unique"
  })),
});
const ChatAppSchema = S.struct({
  id: S.string,
  name: S.string,
  agentIds: S.array(S.string),
  toolbarIds: S.array(S.string),
  theme: S.record(S.string, S.unknown),
});

// --- Validation Utilities ---

export function validateAgents(agents: unknown[]): any[] {
  return agents.map((agent, i) => {
    try {
      return S.parseSync(AgentSchema)(agent);
    } catch (e) {
      throw new Error(`Agent validation failed at index ${i}: ${e}`);
    }
  });
}

export function validateTools(tools: unknown[]): any[] {
  return tools.map((tool, i) => {
    try {
      return S.parseSync(ToolSchema)(tool);
    } catch (e) {
      throw new Error(`Tool validation failed at index ${i}: ${e}`);
    }
  });
}

export function validateToolbars(toolbars: unknown[], toolIds: Set<string>): any[] {
  return toolbars.map((tb, i) => {
    try {
      const parsed = S.parseSync(ToolbarSchema)(tb);
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

export function validateChatApps(chatApps: unknown[], agentIds: Set<string>, toolbarIds: Set<string>, allAppIds: Set<string>): any[] {
  return chatApps.map((app, i) => {
    try {
      const parsed = S.parseSync(ChatAppSchema)(app);
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
