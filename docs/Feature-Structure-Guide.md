# Feature Structure Guide - Nested Features Pattern

## Overview

The buddy codebase uses a **recursive nested features pattern** where features can contain sub-features, which can contain their own sub-features, creating a hierarchical organization that mirrors the domain structure.

---

## The Nested Features Pattern

### Basic Structure

```
features/
  feature-name/
    manager/              # Business logic (Effect.ts service)
    components/           # UI components
    hooks/                # React hooks
    domain/               # Domain models
    ui-state/             # UI-specific state
    types/                # Type definitions
    errors/               # Error definitions
    features/             # Nested sub-features (recursive!)
      sub-feature/
        manager/
        components/
        features/         # Can nest further!
          sub-sub-feature/
            ...
```

### Key Principle

**Features can recursively contain other features**, creating a tree structure that represents the domain hierarchy.

---

## Real Examples from Codebase

### Example 1: ChatApps Feature (3 Levels Deep)

```
features/chatapps/
├── manager/                    # ChatAppsManager (top-level)
│   ├── service.ts
│   ├── api.ts
│   ├── types.ts
│   └── errors.ts
├── features/                   # Level 1 nesting
│   └── chatapp/                # Individual ChatApp feature
│       ├── managers/           # ChatManager
│       │   ├── service.ts
│       │   └── ...
│       ├── components/
│       ├── domain/
│       └── features/           # Level 2 nesting
│           ├── chatarea/       # Chat area sub-feature
│           │   ├── managers/
│           │   └── ...
│           ├── context-engineering/  # Context engineering sub-feature
│           │   ├── managers/
│           │   └── ...
│           ├── userarea/       # User area sub-feature
│           │   ├── managers/
│           │   └── ...
│           └── header/         # Header sub-feature
│               └── ...
```

**Domain Hierarchy**:
- ChatApps (manages collection of chat apps)
  - ChatApp (manages individual chat app)
    - ChatArea (manages chat messages and conversation)
    - ContextEngineering (manages context and prompts)
    - UserArea (manages user input and interactions)
    - Header (manages chat app header UI)

### Example 2: Application Feature

```
features/application/
├── manager/                    # ApplicationManager
│   ├── core/                   # Core sub-manager
│   │   └── core/
│   │       ├── service.ts      # CoreManager
│   │       └── ...
│   ├── service.ts
│   └── ...
└── features/                   # Nested features
    └── header/                 # Application header
        └── header/
            ├── service.ts      # HeaderManager
            └── ...
```

### Example 3: Workspaces Editor Feature

```
features/workspaces-editor/
├── manager/                    # WorkspacesEditorManager
├── features/
│   └── workspace-editor/       # Individual workspace editor
│       ├── manager/
│       └── features/
│           └── chatapps-editor/  # ChatApps editor within workspace
│               ├── manager/
│               └── features/
│                   └── chatappeditor/  # Individual app editor
│                       └── manager/
```

---

## Naming Conventions

### Manager vs Managers

Both `manager/` and `managers/` are used in the codebase:

**manager/** (singular):
```
features/application/
  manager/              # Single manager for this feature
    service.ts
```

**managers/** (plural):
```
features/chatapps/features/chatapp/
  managers/             # Could have multiple managers
    service.ts
```

**Guideline**: Use `manager/` for single manager, `managers/` if you anticipate multiple manager types in the future. Both are acceptable.

---

## When to Nest Features

### ✅ DO Nest When:

1. **Clear Parent-Child Relationship**
   ```
   chatapps/              # Parent: manages collection
     features/chatapp/    # Child: manages individual item
   ```

2. **Shared Context**
   ```
   chatapp/                    # Parent provides context
     features/chatarea/        # Child uses parent's context
     features/userarea/        # Child uses parent's context
   ```

3. **Logical Grouping**
   ```
   workspace-editor/                # Editing workspace
     features/chatapps-editor/      # Editing apps within workspace
   ```

4. **UI Hierarchy**
   ```
   application/           # App shell
     features/header/     # Header is part of app shell
   ```

### ❌ DON'T Nest When:

1. **No Clear Hierarchy** - Features are peers, not parent-child
2. **No Shared Context** - Features are independent
3. **Circular Dependencies** - Would create dependency cycles
4. **Over-Engineering** - Nesting for the sake of nesting

---

## Feature Communication Patterns

### Parent-Child Communication

**Parent provides context to children:**

```typescript
// Parent: ChatAppsManager
export class ChatAppsManager extends Effect.Service<ChatAppsManagerApi>()(
  "ChatAppsManager",
  {
    effect: Effect.gen(function* () {
      const chatApps = yield* Ref.make<Record<string, ChatApp>>({});
      
      return {
        getChatApp: (id: string) => 
          Ref.get(chatApps).pipe(Effect.map(apps => apps[id])),
        // ... other methods
      };
    }),
  }
) {}

// Child: ChatManager (depends on parent)
export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    effect: Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager; // Access parent
      
      return {
        loadChat: (chatAppId: string) =>
          Effect.gen(function* () {
            const chatApp = yield* chatAppsManager.getChatApp(chatAppId);
            // Use parent's data
          }),
      };
    }),
    dependencies: [ChatAppsManager.Default], // Declare dependency
  }
) {}
```

### Sibling Communication

**Siblings communicate through shared parent:**

```typescript
// ChatArea and UserArea both depend on ChatManager
export class ChatAreaManager extends Effect.Service<ChatAreaManagerApi>()(
  "ChatAreaManager",
  {
    dependencies: [ChatManager.Default],
  }
) {}

export class UserAreaManager extends Effect.Service<UserAreaManagerApi>()(
  "UserAreaManager",
  {
    dependencies: [ChatManager.Default],
  }
) {}
```

---

## Directory Organization Rules

### 1. Manager/Managers Folder

Contains the Effect.ts service following MDX pattern:

```
manager/
├── api.ts       # TypeScript interface
├── errors.ts    # Tagged errors
├── types.ts     # Domain types
├── service.ts   # Effect.Service implementation
└── index.ts     # Barrel exports
```

### 2. Components Folder

React UI components (presentation only):

```
components/
├── FeatureComponent.tsx
├── SubComponent.tsx
└── index.ts
```

### 3. Hooks Folder

React hooks that bridge managers to components:

```
hooks/
├── useFeatureManager.ts
├── useFeatureState.ts
└── index.ts
```

### 4. Domain Folder

Pure domain models (no Effect, no React):

```
domain/
├── models.ts
├── validators.ts
└── index.ts
```

### 5. UI-State Folder

UI-specific state models:

```
ui-state/
├── window-state.ts
├── layout-state.ts
└── index.ts
```

### 6. Features Folder

Nested sub-features (recursive structure):

```
features/
├── sub-feature-1/
│   ├── manager/
│   ├── components/
│   └── features/      # Can nest further
└── sub-feature-2/
    └── manager/
```

---

## Best Practices

### 1. Keep Features Focused

Each feature should have a **single responsibility**:

```
✅ GOOD:
features/chatapp/
  - Manages individual chat app lifecycle
  
features/chatapp/features/chatarea/
  - Manages chat messages and conversation

❌ BAD:
features/chatapp/
  - Manages chat app AND messages AND user input AND context
  (Too many responsibilities - should be split)
```

### 2. Avoid Deep Nesting

**Maximum recommended depth: 3-4 levels**

```
✅ GOOD: 3 levels
features/chatapps/features/chatapp/features/chatarea/

⚠️ ACCEPTABLE: 4 levels
features/workspaces-editor/features/workspace-editor/
  features/chatapps-editor/features/chatappeditor/

❌ TOO DEEP: 5+ levels
features/a/features/b/features/c/features/d/features/e/
(Hard to navigate and understand)
```

### 3. Use Consistent Naming

- Feature folders: kebab-case (`chat-area`, `context-engineering`)
- Manager classes: PascalCase with suffix (`ChatAreaManager`)
- Service files: lowercase (`service.ts`, `api.ts`)

### 4. Document Dependencies

In each feature's README or service.ts, document:
- Parent features it depends on
- Child features it manages
- Sibling features it communicates with

```typescript
/**
 * ChatAreaManager
 * 
 * Parent: ChatManager (provides chat app context)
 * Siblings: UserAreaManager, ContextEngineeringManager
 * Children: None
 * 
 * Manages the chat message area and conversation flow.
 */
export class ChatAreaManager extends Effect.Service<ChatAreaManagerApi>()...
```

---

## Migration Guide

### From Flat to Nested Structure

**Before** (flat structure):
```
features/
├── chatapps/
├── chatapp/
├── chatarea/
├── userarea/
└── context-engineering/
```

**After** (nested structure):
```
features/
└── chatapps/
    └── features/
        └── chatapp/
            └── features/
                ├── chatarea/
                ├── userarea/
                └── context-engineering/
```

**Steps**:
1. Identify parent-child relationships
2. Create `features/` folder in parent
3. Move child features into parent's `features/`
4. Update imports
5. Update dependencies in service files
6. Test that everything still works

---

## Common Patterns

### Pattern 1: Collection + Item

Parent manages collection, children manage individual items:

```
features/workspaces/          # Manages workspace collection
  features/workspace/         # Manages individual workspace
```

### Pattern 2: Shell + Components

Parent provides shell/container, children are components:

```
features/application/         # App shell
  features/header/            # Header component
  features/sidebar/           # Sidebar component
```

### Pattern 3: Editor + Sub-Editors

Parent is main editor, children edit specific aspects:

```
features/workspace-editor/              # Main workspace editor
  features/chatapps-editor/             # Edit apps in workspace
    features/chatappeditor/             # Edit individual app
```

### Pattern 4: Manager + Specialized Managers

Parent is general manager, children are specialized:

```
features/chat/                # General chat management
  features/message-handler/   # Specialized message handling
  features/attachment-handler/  # Specialized attachment handling
```

---

## Troubleshooting

### Circular Dependencies

**Problem**: Feature A depends on Feature B, which depends on Feature A

**Solution**: Extract shared logic to a parent feature or shared service

```
❌ BAD:
features/chatarea/ → depends on → features/userarea/
features/userarea/ → depends on → features/chatarea/

✅ GOOD:
features/chatapp/  ← both depend on parent
  features/chatarea/
  features/userarea/
```

### Import Path Complexity

**Problem**: Deep nesting creates long import paths

**Solution**: Use path aliases

```typescript
// Instead of:
import { ChatAreaManager } from '../../../features/chatapps/features/chatapp/features/chatarea/managers';

// Use:
import { ChatAreaManager } from '@/features/chatapps/features/chatapp/features/chatarea/managers';
```

### Feature Isolation

**Problem**: Child feature tightly coupled to parent

**Solution**: Use dependency injection, not direct imports

```typescript
// ❌ BAD: Direct import
import { chatAppsManager } from '../../manager';

// ✅ GOOD: Dependency injection
export class ChatAreaManager extends Effect.Service<ChatAreaManagerApi>()(
  "ChatAreaManager",
  {
    effect: Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager; // Injected
    }),
    dependencies: [ChatAppsManager.Default],
  }
) {}
```

---

## Examples in Codebase

### Complete Feature Tree

```
features/
├── application/
│   ├── manager/
│   │   ├── core/core/          # CoreManager
│   │   └── service.ts          # ApplicationManager
│   └── features/
│       └── header/header/      # HeaderManager
│
├── chatapps/
│   ├── manager/                # ChatAppsManager
│   └── features/
│       └── chatapp/
│           ├── managers/       # ChatManager
│           └── features/
│               ├── chatarea/managers/          # ChatAreaManager
│               ├── context-engineering/managers/  # ContextEngineeringManager
│               ├── userarea/managers/          # UserAreaManager
│               └── header/
│
├── workspace/
│   └── managers/
│       ├── service.ts          # WorkspaceComponent
│       └── workspace-manager/  # WorkspaceManager
│
├── workspaces-editor/
│   ├── manager/                # WorkspacesEditorManager
│   └── features/
│       └── workspace-editor/
│           ├── manager/        # WorkspaceEditorManager
│           └── features/
│               └── chatapps-editor/
│                   ├── manager/  # ChatAppsEditorManager
│                   └── features/
│                       └── chatappeditor/manager/  # ChatAppEditorManager
│
└── error/
    └── managers/               # ErrorManager
```

---

## Summary

### Key Takeaways

1. **Recursive Structure**: Features can contain features infinitely
2. **Domain Hierarchy**: Nesting mirrors domain relationships
3. **Dependency Injection**: Use Effect.ts DI, not direct imports
4. **Consistent Naming**: Follow established conventions
5. **Maximum Depth**: Keep to 3-4 levels maximum
6. **Clear Boundaries**: Each feature has single responsibility

### When to Use This Pattern

✅ **Use nested features when**:
- Clear parent-child domain relationship
- Shared context between parent and children
- Logical UI or functional grouping

❌ **Don't use nested features when**:
- Features are peers (use flat structure)
- No shared context
- Would create circular dependencies

---

**Last Updated**: October 14, 2025
**Status**: Production Pattern
**See Also**: 
- [MDX Pattern Cleanup](./MDX-Pattern-Cleanup.md)
- [EffectProvider Guide](./EffectProvider-Guide.md)
- [CLAUDE.md](../CLAUDE.md)
