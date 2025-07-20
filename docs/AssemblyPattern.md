# Assembly Pattern

## Overview

The **Assembly Pattern** is the core architectural pattern used throughout the Buddy application. It provides a consistent, layered approach to organizing domain functionality with clear separation of concerns and predictable structure.

## What is an Assembly?

An **Assembly** is a cohesive set of four layers that work together to provide complete functionality for a specific domain. Each layer has distinct responsibilities and interfaces with adjacent layers in a predictable way.

## Assembly Structure

Every Assembly follows this exact four-layer structure:

```
Domain Assembly
├── Manager     (Orchestration Layer)
├── Container   (React Integration Layer)
├── Component   (Business Logic Layer)
└── Service     (Core Services Layer)
```

## Layer Responsibilities

### 1. Manager Layer
**Purpose**: High-level orchestration and coordination
- Manages multiple instances and their lifecycles
- Coordinates between different assemblies
- Provides simplified API for external consumers
- Handles complex workflows and state coordination

**Example**: `ChatAppsManager`, `WorkspaceManager`

### 2. Container Layer
**Purpose**: React integration and UI state management
- Bridges React components with Effect services
- Manages local UI state and React lifecycle
- Provides hooks and React context
- Handles component mounting/unmounting

**Example**: `ChatAppContainer`, `WorkspaceContainer`

### 3. Component Layer
**Purpose**: Business logic and domain operations
- Implements core business rules and workflows
- Manages domain state and operations
- Provides Effect-based APIs
- Handles complex domain logic

**Example**: `ChatAppComponent`, `WorkspaceComponent`

### 4. Service Layer
**Purpose**: Core services and data operations
- Provides fundamental services and utilities
- Handles data persistence and retrieval
- Implements low-level operations
- Manages external integrations

**Example**: `ChatAppService`, `WorkspaceService`

## Current Assemblies

### ChatApp Assembly
Handles all chat application functionality:
- **ChatAppsManager**: Orchestrates multiple chat apps, handles creation/deletion
- **ChatAppContainer**: React integration for chat UI components
- **ChatAppComponent**: Business logic for chat operations
- **ChatAppService**: Core chat services and message handling

### Workspace Assembly
Manages workspace functionality:
- **WorkspaceManager**: Orchestrates workspace operations and switching
- **WorkspaceContainer**: React integration for workspace UI
- **WorkspaceComponent**: Business logic for workspace management
- **WorkspaceService**: Core workspace services and configuration

### ContextEngineering Assembly
Handles context engineering and prompt management:
- **ContextEngineeringManager**: Orchestrates context operations
- **ContextEngineeringContainer**: React integration for context UI
- **ContextEngineeringComponent**: Business logic for context processing
- **ContextEngineeringService**: Core context services

## Assembly Communication

### Vertical Communication (Within Assembly)
```typescript
Manager → Container → Component → Service
```
- Each layer communicates with adjacent layers
- Data flows down, events flow up
- Clear interfaces between layers

### Horizontal Communication (Between Assemblies)
```typescript
ChatApp Assembly ↔ Workspace Assembly ↔ ContextEngineering Assembly
```
- Assemblies communicate through their Manager layers
- Shared services can be used across assemblies
- Event-driven communication for loose coupling

## Implementation Guidelines

### 1. Naming Convention
Always follow the exact naming pattern:
```typescript
// Domain + Layer
ChatAppsManager
ChatAppContainer  
ChatAppComponent
ChatAppService
```

### 2. File Structure
Each assembly should have its own directory:
```
src/managers/chatapps/
├── manager.ts      (Manager layer)
├── container.ts    (Container layer)
├── component.ts    (Component layer)
├── service.ts      (Service layer)
├── types.ts        (Shared types)
├── api.ts          (API interfaces)
├── errors.ts       (Domain errors)
└── index.ts        (Barrel exports)
```

### 3. Layer Interfaces
Each layer should have clear, typed interfaces:
```typescript
// Manager exposes simplified operations
interface ChatAppsManagerApi {
  createChatApp(config: ChatAppConfig): Promise<ChatAppInstance>
  deleteChatApp(id: string): Promise<void>
  // ... other high-level operations
}

// Component handles business logic
interface ChatAppComponentApi {
  sendMessage(message: string): Effect<void, ChatAppError>
  clearMessages(): Effect<void, ChatAppError>
  // ... other business operations
}
```

### 4. Effect Integration
- **Service Layer**: Pure Effect services
- **Component Layer**: Effect-based business logic
- **Container Layer**: Effect-to-React bridge
- **Manager Layer**: Effect coordination

## Benefits of Assembly Pattern

### 1. **Consistency**
- Every domain follows the same structure
- Predictable organization and interfaces
- Easy to navigate and understand

### 2. **Separation of Concerns**
- Each layer has clear responsibilities
- Minimal coupling between layers
- Easy to test and maintain

### 3. **Scalability**
- Easy to add new assemblies
- Layers can be extended independently
- Clear integration points

### 4. **Maintainability**
- Predictable code organization
- Clear debugging path through layers
- Easy to locate and fix issues

### 5. **Team Collaboration**
- Common vocabulary and structure
- Clear ownership boundaries
- Consistent development patterns

## Creating a New Assembly

When adding a new domain, follow these steps:

### 1. Define the Domain
```typescript
// types.ts
export interface UserProfile {
  id: string
  name: string
  email: string
}

export interface UserProfileConfig {
  theme: string
  preferences: UserPreferences
}
```

### 2. Create Service Layer
```typescript
// service.ts
export class UserProfileService extends Effect.Service<UserProfileApi>() {
  // Core user profile operations
}
```

### 3. Create Component Layer
```typescript
// component.ts  
export class UserProfileComponent extends Effect.Service<UserProfileComponentApi>() {
  // Business logic for user profiles
}
```

### 4. Create Container Layer
```typescript
// container.ts
export function UserProfileContainer({ userId }: Props) {
  // React integration and UI state
}
```

### 5. Create Manager Layer
```typescript
// manager.ts
export class UserProfileManager extends Effect.Service<UserProfileManagerApi>() {
  // High-level orchestration
}
```

## Best Practices

### 1. **Keep Layers Focused**
- Each layer should have a single, clear responsibility
- Avoid mixing concerns across layers
- Keep interfaces minimal and focused

### 2. **Use Effect Throughout**
- Leverage Effect's type safety and error handling
- Use proper Effect patterns for async operations
- Maintain Effect composition across layers

### 3. **Clear Error Handling**
- Define domain-specific errors
- Handle errors at appropriate layers
- Provide meaningful error messages

### 4. **Documentation**
- Document each layer's purpose and API
- Provide examples of common operations
- Keep documentation up to date

### 5. **Testing**
- Test each layer independently
- Use proper mocking for layer dependencies
- Focus on integration testing between layers

## Common Patterns

### 1. **State Management**
```typescript
// Component layer manages domain state
const [state, setState] = useState<DomainState>()

// Service layer handles persistence
const persistState = (state: DomainState) => Effect.gen(function* () {
  // Save to storage
})
```

### 2. **Event Handling**
```typescript
// Manager orchestrates events
const handleDomainEvent = (event: DomainEvent) => {
  // Coordinate between assemblies
}

// Component handles business logic
const processDomainEvent = (event: DomainEvent) => Effect.gen(function* () {
  // Business logic processing
})
```

### 3. **Configuration**
```typescript
// Manager handles configuration loading
const loadConfig = () => Effect.gen(function* () {
  const config = yield* ConfigService.load()
  return config
})

// Component uses configuration
const applyConfig = (config: DomainConfig) => Effect.gen(function* () {
  // Apply configuration to domain
})
```

## Migration Guide

When converting existing code to the Assembly Pattern:

### 1. **Identify Domain Boundaries**
- Group related functionality
- Identify natural separation points
- Define clear domain interfaces

### 2. **Extract Layers**
- Start with Service layer (core functionality)
- Add Component layer (business logic)
- Create Container layer (React integration)
- Build Manager layer (orchestration)

### 3. **Refactor Incrementally**
- Convert one layer at a time
- Maintain backward compatibility
- Test thoroughly at each step

### 4. **Update Dependencies**
- Update imports to use new structure
- Remove old coupling between domains
- Clean up unused code

## Conclusion

The Assembly Pattern provides a robust, scalable foundation for organizing complex domain functionality. By following this pattern consistently, we ensure that the Buddy codebase remains maintainable, testable, and easy to understand as it grows.

Every new domain should follow this pattern, and existing code should be gradually migrated to align with these principles. The pattern's strength lies in its consistency and predictability, making it easier for the entire team to work effectively with the codebase. 