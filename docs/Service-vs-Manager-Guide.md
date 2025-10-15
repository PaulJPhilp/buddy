# Service vs Manager Naming Guide

## Overview

The buddy codebase uses two naming conventions for Effect.ts services: **"Service"** and **"Manager"**. This guide explains when to use each suffix and why both exist.

---

## Quick Decision Tree

```
Is it feature-specific business logic?
├─ YES → Use "Manager" suffix
│  └─ Examples: ChatManager, WorkspaceManager, ChatAppsManager
│
└─ NO → Is it cross-cutting or reusable?
   ├─ YES → Use "Service" suffix
   │  └─ Examples: ConfigService, ChatService, AgentKitService
   │
   └─ NO → It's probably a utility function, not a service
```

---

## Managers: Feature-Specific Business Logic

### Definition

**Managers** are Effect.ts services that:
- Own domain state for a specific feature
- Implement feature-specific business logic
- Manage the lifecycle of domain entities
- Are typically unique to one feature

### Naming Pattern

```typescript
[FeatureName]Manager

Examples:
- ChatManager
- WorkspaceManager
- ChatAppsManager
- ApplicationManager
- ContextEngineeringManager
```

### Characteristics

✅ **Managers typically**:
- Live in `features/*/manager/` or `features/*/managers/`
- Own state via `Ref.make()`
- Provide subscribe pattern for state changes
- Manage collections or individual entities
- Have feature-specific operations

### Examples from Codebase

#### ChatAppsManager
```typescript
// Location: features/chatapps/manager/service.ts
export class ChatAppsManager extends Effect.Service<ChatAppsManagerApi>()(
  "ChatAppsManager",
  {
    effect: Effect.gen(function* () {
      const chatApps = yield* Ref.make<Record<string, ChatApp>>({});
      
      return {
        registerChatApp: (app: ChatApp) => ...,
        getChatApp: (id: string) => ...,
        getAllChatApps: () => ...,
      };
    }),
  }
) {}
```

**Why "Manager"?**
- Manages a collection of chat apps (feature-specific)
- Owns the canonical state for chat apps
- Feature-specific business logic

#### WorkspaceManager
```typescript
// Location: features/workspace/managers/workspace-manager/service.ts
export class WorkspaceManager extends Effect.Service<WorkspaceManagerApi>()(
  "WorkspaceManager",
  {
    effect: Effect.gen(function* () {
      const workspaces = yield* Ref.make<Record<string, Workspace>>({});
      
      return {
        createWorkspace: (data: WorkspaceData) => ...,
        getWorkspace: (id: string) => ...,
        updateWorkspace: (id: string, updates: Partial<Workspace>) => ...,
      };
    }),
  }
) {}
```

**Why "Manager"?**
- Manages workspace entities (feature-specific)
- Owns workspace state and lifecycle
- Feature domain logic

---

## Services: Cross-Cutting Concerns

### Definition

**Services** are Effect.ts services that:
- Provide cross-cutting functionality
- Are reusable across multiple features
- Often integrate with external systems
- Don't own feature-specific domain state

### Naming Pattern

```typescript
[Capability]Service

Examples:
- ConfigService
- ChatService
- AgentKitService
- ChatBridgeService
```

### Characteristics

✅ **Services typically**:
- Live in `services/*/` (not in features)
- Provide reusable operations
- Integrate with external APIs or systems
- Are stateless or have minimal state
- Used as dependencies by multiple managers

### Examples from Codebase

#### ConfigService
```typescript
// Location: services/config/service.ts
export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    effect: Effect.gen(function* () {
      return {
        loadConfig: (path: string) => ...,
        saveConfig: (config: AppConfig) => ...,
        validateConfig: (config: unknown) => ...,
      };
    }),
  }
) {}
```

**Why "Service"?**
- Cross-cutting: used by many features
- Reusable configuration operations
- Not feature-specific

#### ChatService
```typescript
// Location: services/chat/service.ts
export class ChatService extends Effect.Service<ChatServiceApi>()(
  "ChatService",
  {
    effect: Effect.gen(function* () {
      return {
        sendMessage: (message: Message) => ...,
        streamResponse: (prompt: string) => ...,
        cancelStream: () => ...,
      };
    }),
  }
) {}
```

**Why "Service"?**
- Reusable chat operations
- External API integration (LLM providers)
- Used by multiple chat-related managers

#### AgentKitService
```typescript
// Location: services/agentkit/service.ts
export class AgentKitService extends Effect.Service<AgentKitServiceApi>()(
  "AgentKitService",
  {
    effect: Effect.gen(function* () {
      return {
        createAgent: (config: AgentConfig) => ...,
        executeAgent: (agentId: string, input: string) => ...,
      };
    }),
  }
) {}
```

**Why "Service"?**
- External integration (agent framework)
- Reusable across features
- Not tied to specific feature domain

---

## Comparison Table

| Aspect | Manager | Service |
|--------|---------|---------|
| **Location** | `features/*/manager/` | `services/*/` |
| **Scope** | Feature-specific | Cross-cutting |
| **State** | Owns domain state | Stateless or minimal state |
| **Reusability** | Used by one feature | Used by multiple features |
| **Dependencies** | Often depends on Services | Rarely depends on Managers |
| **Examples** | ChatManager, WorkspaceManager | ConfigService, ChatService |
| **Purpose** | Business logic & state | Reusable operations |

---

## Real-World Examples

### Manager Depending on Service

```typescript
// ApplicationManager (Manager) depends on ConfigService (Service)
export class ApplicationManager extends Effect.Service<ApplicationManagerApi>()(
  "ApplicationManager",
  {
    effect: Effect.gen(function* () {
      const configService = yield* ConfigService; // Dependency
      
      const loadConfig = (path?: string) =>
        Effect.gen(function* () {
          const config = yield* configService.loadConfig(path);
          // Feature-specific logic with config
        });
      
      return { loadConfig };
    }),
    dependencies: [ConfigService.Default],
  }
) {}
```

### Manager Depending on Manager

```typescript
// ChatManager (child) depends on ChatAppsManager (parent)
export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    effect: Effect.gen(function* () {
      const chatAppsManager = yield* ChatAppsManager; // Parent manager
      
      return {
        loadChat: (chatAppId: string) =>
          Effect.gen(function* () {
            const chatApp = yield* chatAppsManager.getChatApp(chatAppId);
            // Use parent's data
          }),
      };
    }),
    dependencies: [ChatAppsManager.Default],
  }
) {}
```

---

## Naming Guidelines

### For Managers

**Pattern**: `[FeatureName]Manager`

✅ **Good Names**:
- `ChatAppsManager` - manages chat apps collection
- `WorkspaceManager` - manages workspaces
- `ContextEngineeringManager` - manages context engineering
- `UserAreaManager` - manages user area

❌ **Avoid**:
- `ChatAppsService` - it's feature-specific, use Manager
- `Manager` - too generic, include feature name
- `ChatAppsHandler` - use Manager for consistency

### For Services

**Pattern**: `[Capability]Service`

✅ **Good Names**:
- `ConfigService` - configuration operations
- `ChatService` - chat operations
- `AgentKitService` - agent kit integration
- `ChatBridgeService` - chat bridging operations

❌ **Avoid**:
- `ConfigManager` - it's cross-cutting, use Service
- `Service` - too generic, include capability
- `ConfigHelper` - use Service for consistency

---

## Special Cases

### Component Services

Some services are named with "Component" suffix:

```typescript
// WorkspaceComponent
export class WorkspaceComponent extends Effect.Service<WorkspaceComponentApi>()...
```

**When to use**: For UI component-level services that bridge React and Effect.ts. These are less common and may be refactored to use the Manager pattern.

### Core Services

```typescript
// CoreManager
export class CoreManager extends Effect.Service<CoreManagerApi>()...
```

**When to use**: For core application infrastructure that doesn't fit neatly into feature or service categories.

---

## Migration Considerations

### Renaming from Service to Manager

If you have a "Service" that should be a "Manager":

**Before**:
```typescript
export class ChatAppsService extends Effect.Service<ChatAppsServiceApi>()...
```

**After**:
```typescript
export class ChatAppsManager extends Effect.Service<ChatAppsManagerApi>()...
```

**Steps**:
1. Rename the class
2. Rename the API interface
3. Update all imports
4. Update EffectProvider
5. Update tests
6. Update documentation

### Renaming from Manager to Service

If you have a "Manager" that should be a "Service":

**Before**:
```typescript
export class ConfigManager extends Effect.Service<ConfigManagerApi>()...
```

**After**:
```typescript
export class ConfigService extends Effect.Service<ConfigServiceApi>()...
```

Follow the same steps as above.

---

## Decision Checklist

When creating a new Effect.ts service, ask:

1. **Is it feature-specific?**
   - YES → Probably a Manager
   - NO → Continue to #2

2. **Does it own domain state?**
   - YES → Probably a Manager
   - NO → Continue to #3

3. **Is it reusable across features?**
   - YES → Probably a Service
   - NO → Continue to #4

4. **Does it integrate with external systems?**
   - YES → Probably a Service
   - NO → Might be a utility function, not a service

5. **Will multiple features depend on it?**
   - YES → Probably a Service
   - NO → Probably a Manager

---

## Summary

### Use "Manager" when:
- ✅ Feature-specific business logic
- ✅ Owns domain state for a feature
- ✅ Manages entity lifecycle
- ✅ Lives in `features/*/manager/`

### Use "Service" when:
- ✅ Cross-cutting functionality
- ✅ Reusable across features
- ✅ External system integration
- ✅ Lives in `services/*/`

### Both are Effect.Service classes
- Both follow MDX pattern
- Both use dependency injection
- Both can depend on each other
- Naming is about **intent and organization**, not implementation

---

**Last Updated**: October 14, 2025
**Status**: Naming Convention Standard
**See Also**:
- [MDX Pattern Cleanup](./MDX-Pattern-Cleanup.md)
- [Feature Structure Guide](./Feature-Structure-Guide.md)
- [CLAUDE.md](../CLAUDE.md)
