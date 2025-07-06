# Agents Design

## Overview
Agents are formal entities that chat apps communicate with. There are two types:
- **Pure LLM Agents:** Represent a raw language model endpoint (e.g., Claude, GPT-4).
- **Named Agents:** Represent a persona or specialized agent, built on top of a Pure LLM Agent, with a unique name and system prompt.

Agents are managed by an Effect.Service singleton with a full CRUD API, using fiber-safe state (Refs/Chunks). Agents are loaded from a JSON file at startup, but can also be created, edited, or deleted at runtime by users or LLMs (subject to schema validation and business rules).

---

## Data Model

### TypeScript Types
```typescript
export type Agent = PureLLMAgent | NamedAgent;

export interface PureLLMAgent {
  id: string; // UUID or unique string
  kind: "llm";
  name: string;
  model: string; // e.g., "claude-3-opus"
  description?: string;
  icon?: string;
  config?: Record<string, unknown>;
}

export interface NamedAgent {
  id: string;
  kind: "named";
  name: string;
  baseAgentId: string; // references a PureLLMAgent by id
  systemPrompt: string;
  description?: string;
  icon?: string;
  config?: Record<string, unknown>;
}
```

---

## Effect Schema (pseudo-code)
```typescript
import * as S from "@effect/schema/Schema";

export const PureLLMAgentSchema = S.struct({
  id: S.string,
  kind: S.literal("llm"),
  name: S.string,
  model: S.string,
  description: S.optional(S.string),
  icon: S.optional(S.string),
  config: S.optional(S.record(S.string, S.unknown)),
});

export const NamedAgentSchema = S.struct({
  id: S.string,
  kind: S.literal("named"),
  name: S.string,
  baseAgentId: S.string,
  systemPrompt: S.string,
  description: S.optional(S.string),
  icon: S.optional(S.string),
  config: S.optional(S.record(S.string, S.unknown)),
});

export const AgentSchema = S.union(PureLLMAgentSchema, NamedAgentSchema);
```

---

## Example JSON Config
```json
[
  {
    "id": "llm-claude-3",
    "kind": "llm",
    "name": "Claude 3",
    "model": "claude-3-opus",
    "description": "Anthropic Claude 3 model"
  },
  {
    "id": "agent-legal-bot",
    "kind": "named",
    "name": "LegalBot",
    "baseAgentId": "llm-claude-3",
    "systemPrompt": "You are LegalBot, an expert in contract law. Answer precisely and cite sources.",
    "description": "A legal assistant powered by Claude 3"
  }
]
```

---

## Reference in ChatApps
- ChatApps reference agents by their `id` field.
- Agent assignment is validated at load time.

---

## Extensibility
- The schema is designed to allow additional fields in the future.
