# Toolbars Design

## Overview
Toolbars are named collections of tools. Each tool defines a command (executed by the main application) and a display (icon, optional label, tooltip). Toolbars and tools are managed by an Effect.Service singleton with a full CRUD API, using fiber-safe state (Refs/Chunks). They are loaded from config at startup, but can also be created, edited, or deleted at runtime by users or LLMs (subject to schema validation and business rules).

---

## Data Model

### Tool
- **id:** Unique string identifier.
- **command:** String (must match a command defined by the main application).
- **icon:** String (from a fixed set, e.g., lucide-react icon name).
- **label:** Optional string (if present, shows icon + label; otherwise, icon only).
- **tooltip:** Optional string (hover/focus help text).
- **description:** Optional string (for docs/config, not shown in UI).

### Toolbar
- **id:** Unique string identifier.
- **name:** Human-readable name.
- **tools:** Ordered array of tool IDs (must be unique within the toolbar).
- **description:** Optional string.
- **tooltip:** Optional string (for the toolbar as a whole).

---

## TypeScript Types
```typescript
export interface Tool {
  id: string;
  command: string;
  icon: string; // e.g., "edit", "delete" from lucide-react
  label?: string;
  tooltip?: string;
  description?: string;
}

export interface Toolbar {
  id: string;
  name: string;
  tools: string[]; // ordered, unique tool IDs
  description?: string;
  tooltip?: string;
}
```

---

## Effect Schema (pseudo-code)
```typescript
import * as S from "@effect/schema/Schema";

export const ToolSchema = S.struct({
  id: S.string,
  command: S.string,
  icon: S.string,
  label: S.optional(S.string),
  tooltip: S.optional(S.string),
  description: S.optional(S.string),
});

export const ToolbarSchema = S.struct({
  id: S.string,
  name: S.string,
  tools: S.array(S.string).pipe(S.refinement(arr => new Set(arr).size === arr.length, {
    message: "Tool IDs in a toolbar must be unique"
  })),
  description: S.optional(S.string),
  tooltip: S.optional(S.string),
});
```

---

## Example JSON Config
```json
{
  "tools": [
    {
      "id": "edit",
      "command": "edit",
      "icon": "edit",
      "label": "Edit",
      "tooltip": "Edit this item"
    },
    {
      "id": "delete",
      "command": "delete",
      "icon": "trash",
      "tooltip": "Delete this item"
    }
  ],
  "toolbars": [
    {
      "id": "main-toolbar",
      "name": "Main Toolbar",
      "tools": ["edit", "delete"],
      "description": "Primary actions",
      "tooltip": "Main actions for the chat"
    }
  ]
}
```

---

## Reference in ChatApps
- ChatApps reference toolbars by their `id` field.
- Toolbar assignment is validated at load time.

---

## Extensibility
- The schema is designed to allow additional fields in the future.
