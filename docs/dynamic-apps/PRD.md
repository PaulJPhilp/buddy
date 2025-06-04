# Product Requirements Document (PRD)

## Title
Dynamic Chat App Creation

## Purpose
Enable dynamic creation, editing, and deletion of chat apps within Buddy, supporting configuration at startup, user-driven creation, and LLM-driven creation. Migrate from a static, hardcoded approach to a flexible, schema-validated, and persistent system.

---

## Requirements Summary

### 0. Agents & Toolbars
- **Agents:**
  - **Definition:** Agents are formal entities that chat apps communicate with.
  - **Service:** Managed by an Effect.Service singleton with full CRUD (create, read, update, delete) API, using fiber-safe state (Refs/Chunks).
  - **Persistence:** Agents are loaded from a JSON file at startup and persisted as appropriate.
  - **Mutability:** Agents can be created, edited, and deleted at runtime (by users or LLMs, subject to validation).
  - **Assignment:** Each chat app must specify a list of agent IDs it communicates with (referencing the agents managed by the service).
- **Toolbars:**
  - **Definition:** Toolbars are named collections of tools (e.g., agent toolbar, input toolbar, etc.).
  - **Service:** Managed by an Effect.Service singleton with full CRUD API and fiber-safe state.
  - **Persistence:** Toolbars are loaded from config at startup and persisted as appropriate.
  - **Mutability:** Toolbars and tools can be created, edited, and deleted at runtime (by users or LLMs, subject to validation).
  - **Assignment:** Each chat app specifies which toolbars it uses (by ID/reference to the managed toolbars).
  - **Constraint:** The same tool (by ID) cannot appear more than once in a single toolbar. Tool IDs within a toolbar must be unique.

### 1. Configuration & Startup
- **Service:** ChatApps are managed by an Effect.Service singleton with full CRUD API and fiber-safe state.
- **Persistence:** ChatApps are loaded from config and localStorage at startup, and all mutations are persisted to localStorage.
- **Agent/Toolbar Assignment:** Each chat app references agent and toolbar IDs managed by their respective services.
- **Startup Behavior:** On startup, load chat apps from config/localStorage. If empty, auto-create a single default chat app (e.g., "Chat 1").
- **Validation:** AppsService depends on AgentsService and ToolbarsService to validate references at runtime.
- **Invalid Configs:** If a chat app fails schema validation, it is skipped and an error is logged/thrown. No user approval/UX flow is required for LLM or user creation—just validation.
- **Editability:** All chat apps (including initial set) are fully editable and deletable.

### 2. User-Created Chat Apps
- **Persistence:** Store user-created chat apps (and edits/deletions) in localStorage.
- **Limit:** Users can create up to 5 chat apps.
- **Required Properties:** Only `name` is required at first (future: size/position).
- **Hierarchy:** Users cannot create parent/child relationships.

### 3. LLM-Created Chat Apps
- **Trigger:** LLMs can create chat apps via explicit user request or automated suggestion.
- **Parent/Child:** LLM-created chat apps can have a parent/child relationship via a `parentId` field, but this is metadata only (no UI visualization required).
- **Validation:** LLM-created chat apps must pass Effect schema validation. If invalid, they are not added and an error is logged/thrown.
- **Permissions:** No restricted config options for LLMs in v1.

### 4. General
- **ID Management:** All chat apps use UUIDs for unique IDs.
- **Sync:** No sync across devices/accounts in v1.
- **Extensibility:** Config structure should be extensible for future properties (e.g., themes, agent config, layout).

---

## Out of Scope
- No UI design or UX flows specified (handled separately).
- No cross-device or cloud sync in v1.
- No approval/notification flows for LLM-created apps; only schema validation errors are surfaced.
- No user-created parent/child relationships.

---

## Open Questions / Future Considerations
- How to support future properties (size, position, etc.)?
- Should schema validation errors be surfaced to users or only logged?
- Migration path for existing static chat app definitions.

---

## Next Steps
1. Define Effect schemas for agents, toolbars, and chat apps.
2. Design and implement Effect.Services for Agents, Toolbars, and ChatApps with full CRUD APIs, fiber-safe state, and correct dependencies.
3. Implement config + localStorage merge logic for persistence.
4. Add validation (including runtime reference validation for Apps) and error handling.
5. Support dynamic creation, editing, and deletion of all three entities via hooks/services.

---

*This document captures the requirements as of 2025-06-03. Updates and new requirements may be added in future revisions.*
