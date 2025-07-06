# ChatApps Design

## Overview
ChatApps are managed by an Effect.Service singleton with a full CRUD API, using fiber-safe state (Refs/Chunks) and persisted to localStorage. ChatApps are created at startup (from config), by users (via UI), or by LLMs (within constraints). AppsService depends on AgentsService and ToolbarsService for reference validation. All configuration is validated with an Effect schema.

---

## Data Model

### Required Properties
- **id:** Unique string (UUID)
- **name:** Human-readable name
- **agentIds:** Array of agent IDs (must reference valid Agents)
- **toolbarIds:** Array of toolbar IDs (must reference valid Toolbars)
- **theme:** Inline theme object (see below)
- **parentId:** Optional string (for LLM-created child apps; references another ChatApp)
- **description:** Optional string
- **createdBy:** Optional string (e.g., "user", "llm", or system identifier)
- **createdAt:** Optional ISO timestamp

### Extensibility
- The schema should allow for future properties (e.g., size, position, layout, custom settings).

---

## Theme Structure (v1: Inline)

### Theme Properties
- `background`: string (Background color)
- `foreground`: string (Text color)
- `primary`: string (Primary color)
- `secondary`: string (Secondary color)
- `border`: string (Border color)
- `userArea`: string (User Area color)
- `bubbleUser`: string (User Bubble color)
- `bubbleAgent`: string (Agent Bubble color)
- `headerBg`: string (Header background color)
- `headerText`: string (Header text color)
- `font`: string (Font family, e.g., "Inter", "Arial")
- `bubbleShape`: string (e.g., "rounded", "square", etc.)

#### Example TypeScript Type
```typescript
export interface ChatAppTheme {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  border: string;
  userArea: string;
  bubbleUser: string;
  bubbleAgent: string;
  headerBg: string;
  headerText: string;
  font: string;
  bubbleShape: string;
}
```

#### Example JSON Inline Theme
```json
"theme": {
  "background": "#fff",
  "foreground": "#222",
  "primary": "#0066ff",
  "secondary": "#f0f0f0",
  "border": "#e0e0e0",
  "userArea": "#f9fafb",
  "bubbleUser": "#dbeafe",
  "bubbleAgent": "#f3f4f6",
  "headerBg": "#1e293b",
  "headerText": "#fff",
  "font": "Inter",
  "bubbleShape": "rounded"
}
```

---

## TypeScript Interface
```typescript
export interface ChatApp {
  id: string;                 // UUID
  name: string;
  agentIds: string[];         // references to Agents
  toolbarIds: string[];       // references to Toolbars
  theme: ChatAppTheme;        // Inline theme object
  parentId?: string;          // for LLM-created child apps
  description?: string;
  createdBy?: string;
  createdAt?: string;         // ISO timestamp
  // [future extensibility fields]
}
```

---

## Effect Schema (pseudo-code)
```typescript
import * as S from "@effect/schema/Schema";

export const ChatAppThemeSchema = S.struct({
  background: S.string,
  foreground: S.string,
  primary: S.string,
  secondary: S.string,
  border: S.string,
  userArea: S.string,
  bubbleUser: S.string,
  bubbleAgent: S.string,
  headerBg: S.string,
  headerText: S.string,
  font: S.string,
  bubbleShape: S.string,
});

export const ChatAppSchema = S.struct({
  id: S.string,
  name: S.string,
  agentIds: S.array(S.string),
  toolbarIds: S.array(S.string),
  theme: ChatAppThemeSchema,
  parentId: S.optional(S.string),
  description: S.optional(S.string),
  createdBy: S.optional(S.string),
  createdAt: S.optional(S.string),
  // extensible for future fields
});
```

---

## Example JSON Config
```json
[
  {
    "id": "chatapp-1",
    "name": "Research Assistant",
    "agentIds": ["llm-claude-3", "agent-legal-bot"],
    "toolbarIds": ["main-toolbar"],
    "theme": {
      "background": "#fff",
      "foreground": "#222",
      "primary": "#0066ff",
      "secondary": "#f0f0f0",
      "border": "#e0e0e0",
      "userArea": "#f9fafb",
      "bubbleUser": "#dbeafe",
      "bubbleAgent": "#f3f4f6",
      "headerBg": "#1e293b",
      "headerText": "#fff",
      "font": "Inter",
      "bubbleShape": "rounded"
    },
    "description": "Research and legal queries",
    "createdBy": "user",
    "createdAt": "2025-06-03T16:00:00Z"
  }
]
```

---

## Reference & Validation
- **Agents:** All `agentIds` must reference valid Agent IDs loaded at startup.
- **Toolbars:** All `toolbarIds` must reference valid Toolbar IDs loaded at startup.
- **Parent:** If `parentId` is present, it must reference another ChatApp.
- **ID:** All ChatApp IDs must be unique (across all persisted and loaded apps).

---

## Extensibility
- The schema and config are designed to allow future properties such as size, position, layout, or custom settings.
