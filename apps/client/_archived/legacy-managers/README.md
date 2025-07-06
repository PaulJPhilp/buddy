# Manager Pattern

## Overview

The **Manager Pattern** is an architectural pattern used in this codebase to orchestrate complex business logic, state management, and coordination between multiple services. Managers sit above services in the dependency hierarchy and provide high-level APIs for managing application state and workflows.

## Architecture Hierarchy

```
┌─────────────────┐
│   Components    │ ← React components, UI logic
├─────────────────┤
│     Hooks       │ ← React hooks, component state
├─────────────────┤
│   Managers      │ ← Business logic, orchestration, state management
├─────────────────┤
│   Services      │ ← Pure functionality, data access, external APIs
├─────────────────┤
│   Libraries     │ ← Effect.ts, utilities, external packages
└─────────────────┘
```

## Manager vs Service

### **Managers**
- **Purpose**: Orchestration, business logic, state management
- **Responsibilities**: 
  - Coordinate multiple services
  - Manage application state
  - Implement business workflows
  - Handle complex operations
- **Dependencies**: Can depend on services and other managers
- **State**: Maintain application state using Effect Refs
- **Examples**: ChatAppsManager, AppManager, AgentManager

### **Services**
- **Purpose**: Pure functionality, data access, external integrations
- **Responsibilities**:
  - Single responsibility operations
  - Data transformation
  - External API calls
  - File system operations
- **Dependencies**: Can only depend on other services and libraries
- **State**: Stateless or minimal internal state
- **Examples**: ChatService, UrlService, WebSocketService

## Manager Pattern Principles

### 1. **Single Responsibility**
Each manager has a clear, focused responsibility:
- `ChatAppsManager`: Manages all chat app instances
- `ThreadManager`: A factory for creating `ChatService` instances (threads).
- `ChatManager`: Manages individual chat conversations
- `AppManager`: Manages workspace state and operations
- `AgentManager`: Manages agent instances and lifecycle

### 2. **State Management**
Managers are the primary state holders in the application:
```typescript
// State management with Effect Refs
const stateRef = yield* Ref.make<ManagerState>(initialState);
const listenersRef = yield* Ref.make<Set<StateListener>>(new Set());
```

### 3. **Reactive Updates**
Managers provide subscription mechanisms for state changes:
```typescript
const subscribe = (listener: (state: ManagerState) => void) =>
  Effect.gen(function* () {
    yield* Ref.update(listenersRef, listeners => new Set([...listeners, listener]));
    return unsubscribeFunction;
  });
```

### 4. **Service Orchestration**
Managers coordinate multiple services to achieve complex operations:
```typescript
const complexOperation = Effect.gen(function* () {
  const serviceA = yield* ServiceA;
  const serviceB = yield* ServiceB;
  
  const resultA = yield* serviceA.operation();
  const resultB = yield* serviceB.operation(resultA);
  
  yield* updateState(state => ({ ...state, result: resultB }));
});
```

## Implementation Pattern

### File Structure
Each manager follows the MDX (Manager-Data-eXports) pattern:

```
manager-name/
├── api.ts      # Manager interface definition
├── errors.ts   # Domain-specific error types
├── types.ts    # Type definitions and constants
├── service.ts  # Manager implementation
└── index.ts    # Barrel exports
```

### Manager Service Template

```typescript
// api.ts
export interface ManagerNameApi {
  readonly operation: (param: string) => Effect.Effect<Result, ManagerError>;
  readonly getState: () => Effect.Effect<ManagerState, ManagerError>;
  readonly subscribe: (listener: StateListener) => Effect.Effect<Unsubscribe, ManagerError>;
}

// service.ts
export class ManagerName extends Effect.Service<ManagerNameApi>()(
  "ManagerName",
  {
    scoped: Effect.gen(function* () {
      // State management
      const stateRef = yield* Ref.make<ManagerState>(initialState);
      const listenersRef = yield* Ref.make<Set<StateListener>>(new Set());
      
      // Dependencies
      const serviceA = yield* ServiceA;
      const serviceB = yield* ServiceB;
      
      // Helper functions
      const updateState = (updater: StateUpdater) => 
        Effect.gen(function* () {
          const newState = yield* Ref.updateAndGet(stateRef, updater);
          yield* notifyListeners(newState);
          return newState;
        });
      
      // API implementation
      const operation = (param: string) =>
        Effect.gen(function* () {
          // Orchestrate services
          const result = yield* serviceA.process(param);
          yield* serviceB.store(result);
          
          // Update state
          yield* updateState(state => ({ ...state, lastResult: result }));
          
          return result;
        }).pipe(
          Effect.mapError(cause => new ManagerOperationError({ cause }))
        );
      
      return {
        operation,
        getState: () => Ref.get(stateRef),
        subscribe: createSubscription(listenersRef),
      } satisfies ManagerNameApi;
    }),
    dependencies: [ServiceA.Default, ServiceB.Default],
  },
) {}
```

## Current Managers

### ChatAppsManager
**Purpose**: Orchestrates all chat app instances across workspaces
- Manages chat app lifecycle (register, unregister, status changes)
- Handles capacity limits and focus mode
- Coordinates with AppManager for workspace-specific operations
- Provides statistics and monitoring

### ThreadManager
**Purpose**: A factory for creating new `ChatService` instances.
- Does not hold state.
- Provides a `create` method that returns a fully-initialized `ChatService`.
- Contains the `Layer` with all dependencies needed by a `ChatService`.

### ChatManager
**Purpose**: Orchestrates individual chat conversations
- Creates and manages chat service instances
- Routes messages to appropriate chats
- Maintains chat history and state
- Handles agent switching within chats

### AppManager
**Purpose**: Manages workspace state and operations
- Workspace CRUD operations
- Current workspace tracking
- Chat app associations
- Agent availability per workspace

### AgentManager
**Purpose**: Manages agent instances and lifecycle
- Agent discovery and registration
- Health monitoring and metrics
- Agent communication and switching
- Configuration management

## React Integration

Managers are consumed by React components through custom hooks:

```typescript
// Hook pattern
export function useManagerName(options: ManagerOptions) {
  const [state, setState] = useState<ManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const program = Effect.gen(function* () {
      const manager = yield* ManagerName;
      const unsubscribe = yield* manager.subscribe(setState);
      const initialState = yield* manager.getState();
      setState(initialState);
      return unsubscribe;
    });
    
    Effect.runPromise(program.pipe(Effect.provide(ManagerName.Default)));
  }, []);
  
  return { state, isLoading, error, actions };
}
```

## Error Handling

Managers define domain-specific errors:

```typescript
// errors.ts
export class ManagerOperationError extends Data.TaggedError("ManagerOperationError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ManagerStateError extends Data.TaggedError("ManagerStateError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ManagerError = ManagerOperationError | ManagerStateError;
```

## Best Practices

### DO
- ✅ Use managers for complex business logic and orchestration
- ✅ Implement reactive state updates with subscriptions
- ✅ Follow the MDX file structure pattern
- ✅ Use Effect.Service pattern with proper dependencies
- ✅ Define domain-specific error types
- ✅ Provide comprehensive APIs for all operations
- ✅ Use proper state management with Effect Refs

### DON'T
- ❌ Put UI logic in managers (belongs in components/hooks)
- ❌ Make managers depend on React or UI frameworks
- ❌ Create circular dependencies between managers
- ❌ Bypass managers to access services directly from components
- ❌ Mix manager responsibilities (single responsibility principle)
- ❌ Use mutable state outside of Effect Refs
- ❌ Ignore error handling and proper Effect patterns

## Testing Managers

Managers should be tested with real service dependencies:

```typescript
describe("ManagerName", () => {
  it("should perform complex operation", async () => {
    const program = Effect.gen(function* () {
      const manager = yield* ManagerName;
      const result = yield* manager.operation("test");
      expect(result).toBeDefined();
    });
    
    await Effect.runPromise(
      program.pipe(Effect.provide(ManagerName.Default))
    );
  });
});
```

## Migration Guide

When converting services to managers:

1. **Identify Orchestration Logic**: Look for services that coordinate multiple other services
2. **Extract State Management**: Move complex state to managers with proper Ref usage
3. **Define Manager API**: Create comprehensive interface for all operations
4. **Update Dependencies**: Ensure managers depend on services, not vice versa
5. **Create React Hooks**: Provide React integration through custom hooks
6. **Update Components**: Use manager hooks instead of service hooks

## Conclusion

The Manager Pattern provides a clean separation between business logic orchestration and pure functionality. It enables complex state management, service coordination, and reactive updates while maintaining clear architectural boundaries and testability. 