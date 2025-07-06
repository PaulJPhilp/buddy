# Service Pattern

## Overview

The **Service Pattern** is an architectural pattern used in this codebase to encapsulate pure functionality, data access, and external integrations. Services provide focused, single-responsibility operations that can be composed by managers to create complex business workflows. Services form the foundational layer of the application architecture.

## Architecture Hierarchy

```
┌─────────────────┐
│   Components    │ ← React components, UI logic
├─────────────────┤
│     Hooks       │ ← React hooks, component state
├─────────────────┤
│   Managers      │ ← Business logic, orchestration, state management
├─────────────────┤
│   Services      │ ← Pure functionality, data access, external APIs ⭐
├─────────────────┤
│   Libraries     │ ← Effect.ts, utilities, external packages
└─────────────────┘
```

## Service vs Manager

### **Services**
- **Purpose**: Pure functionality, data access, external integrations
- **Responsibilities**:
  - Single responsibility operations
  - Data transformation and validation
  - External API calls and integrations
  - File system operations
  - Protocol implementations (WebSocket, HTTP)
  - Configuration management
- **Dependencies**: Can only depend on other services and libraries
- **State**: Stateless or minimal internal state (configuration only)
- **Examples**: ChatService, UrlService, WebSocketService, AgentService

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

## Service Pattern Principles

### 1. **Single Responsibility**
Each service has one clear, focused responsibility:
- `ChatService`: Chat conversation operations and message handling
- `UrlService`: Configuration loading and management
- `WebSocketService`: WebSocket connection and communication
- `AgentService`: Agent configuration persistence and retrieval
- `MdxService`: MDX content processing and rendering

### 2. **Stateless Design**
Services are primarily stateless, focusing on operations rather than state:
```typescript
// Good: Stateless operation
const processMessage = (content: string) =>
  Effect.gen(function* () {
    const validated = yield* validateMessage(content);
    const processed = yield* transformMessage(validated);
    return processed;
  });

// Avoid: Stateful service (use managers instead)
const messageState = yield* Ref.make<MessageState>({});
```

### 3. **Pure Functions**
Service operations should be pure and predictable:
```typescript
// Pure operation - same input always produces same output
const formatMessage = (content: string, timestamp: Date) =>
  Effect.succeed(`[${timestamp.toISOString()}] ${content}`);

// Side effects are explicit and managed through Effect
const saveMessage = (message: Message) =>
  Effect.gen(function* () {
    const db = yield* DatabaseService;
    yield* db.insert("messages", message);
  });
```

### 4. **Composability**
Services are designed to be easily composed by managers:
```typescript
const complexWorkflow = Effect.gen(function* () {
  const config = yield* UrlService;
  const websocket = yield* WebSocketService;
  const chat = yield* ChatService;
  
  const settings = yield* config.getSettings();
  yield* websocket.connect(settings.endpoint);
  yield* chat.initialize(settings.chatConfig);
});
```

## Implementation Pattern

### File Structure
Each service follows the MDX (Manager-Data-eXports) pattern:

```
service-name/
├── api.ts      # Service interface definition
├── errors.ts   # Domain-specific error types
├── types.ts    # Type definitions and constants
├── service.ts  # Service implementation
└── index.ts    # Barrel exports
```

### Service Template

```typescript
// api.ts
export interface ServiceNameApi {
  readonly operation: (param: string) => Effect.Effect<Result, ServiceError>;
  readonly initialize: (config: ServiceConfig) => Effect.Effect<void, ServiceError>;
  readonly cleanup: () => Effect.Effect<void, ServiceError>;
}

// service.ts
export class ServiceName extends Effect.Service<ServiceNameApi>()(
  "ServiceName",
  {
    scoped: Effect.gen(function* () {
      // Dependencies (other services only)
      const dependency = yield* DependencyService;
      
      // Internal state (minimal, configuration only)
      const configRef = yield* Ref.make<ServiceConfig | null>(null);
      
      // Helper functions
      const ensureInitialized = () =>
        Effect.gen(function* () {
          const config = yield* Ref.get(configRef);
          if (!config) {
            return yield* Effect.fail(
              new ServiceNotInitializedError({
                service: "ServiceName",
                message: "Service not initialized. Call initialize() first.",
              })
            );
          }
          return config;
        });
      
      // API implementation
      const initialize = (config: ServiceConfig) =>
        Effect.gen(function* () {
          // Validate configuration
          const validatedConfig = yield* validateConfig(config);
          
          // Setup resources
          yield* setupResources(validatedConfig);
          
          // Store configuration
          yield* Ref.set(configRef, validatedConfig);
        }).pipe(
          Effect.mapError(cause => new ServiceInitializationError({ cause }))
        );
      
      const operation = (param: string) =>
        Effect.gen(function* () {
          const config = yield* ensureInitialized();
          
          // Perform pure operation
          const result = yield* processWithDependency(param, config);
          
          return result;
        }).pipe(
          Effect.mapError(cause => new ServiceOperationError({ cause }))
        );
      
      const cleanup = () =>
        Effect.gen(function* () {
          // Cleanup resources
          yield* cleanupResources();
          
          // Reset state
          yield* Ref.set(configRef, null);
        }).pipe(
          Effect.mapError(cause => new ServiceCleanupError({ cause }))
        );
      
      return {
        initialize,
        operation,
        cleanup,
      } satisfies ServiceNameApi;
    }),
    dependencies: [DependencyService.Default],
  },
) {}
```

## Current Services

### Core Services

#### ChatService
**Purpose**: Chat conversation operations and message handling
- Message sending and receiving
- Chat history management
- Agent integration
- Real-time communication

#### UrlService
**Purpose**: Configuration loading and management
- Environment configuration
- Service settings
- Runtime configuration updates
- Validation and defaults

#### WebSocketService
**Purpose**: WebSocket connection and communication
- Connection management
- Message routing
- Reconnection logic
- Protocol handling

### Data Services

#### AgentService
**Purpose**: Agent configuration persistence and retrieval
- Agent CRUD operations
- Configuration validation
- File system persistence
- Schema validation

#### WorkspaceManager
**Purpose**: Workspace data operations
- Workspace CRUD operations
- Data persistence
- Configuration management
- Validation

### Integration Services

#### AgentKitBridge
**Purpose**: Integration with external agent systems
- Agent communication protocols
- Message translation
- External API integration
- Protocol abstraction

#### MdxService
**Purpose**: MDX content processing and rendering
- MDX parsing and compilation
- Content transformation
- Template processing
- Error handling

### Infrastructure Services

#### AppService
**Purpose**: Application-level configuration and setup
- Application initialization
- Global settings
- Environment detection
- Feature flags

#### IntegrityService
**Purpose**: Data validation and consistency
- Data integrity checks
- Validation rules
- Consistency enforcement
- Error reporting

## Service Categories

### 1. **Data Services**
Handle data persistence, retrieval, and validation:
- `AgentService` - Agent configuration data
- `WorkspaceManager` - Workspace data
- `UrlService` - Application configuration

### 2. **Communication Services**
Manage external communication and protocols:
- `WebSocketService` - Real-time communication
- `AgentKitBridge` - External agent integration
- `ChatService` - Chat operations

### 3. **Processing Services**
Transform and process data:
- `MdxService` - Content processing
- `IntegrityService` - Data validation
- `ChatappLoaderService` - Configuration loading

### 4. **Infrastructure Services**
Provide foundational capabilities:
- `AppService` - Application setup
- `LayoutService` - UI layout management
- `ToolbarService` - Toolbar functionality

## Error Handling

Services define domain-specific errors:

```typescript
// errors.ts
export class ServiceOperationError extends Data.TaggedError("ServiceOperationError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ServiceInitializationError extends Data.TaggedError("ServiceInitializationError")<{
  readonly service: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ServiceValidationError extends Data.TaggedError("ServiceValidationError")<{
  readonly field?: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ServiceError = 
  | ServiceOperationError 
  | ServiceInitializationError 
  | ServiceValidationError;
```

## Service Composition

Services are composed by managers to create complex workflows:

```typescript
// Manager composing multiple services
const complexBusinessOperation = Effect.gen(function* () {
  // Get service dependencies
  const config = yield* UrlService;
  const websocket = yield* WebSocketService;
  const chat = yield* ChatService;
  const agent = yield* AgentService;
  
  // Load configuration
  const settings = yield* config.getSettings();
  
  // Setup communication
  yield* websocket.connect(settings.websocketUrl);
  
  // Initialize chat with agent
  const agentConfig = yield* agent.getById(settings.defaultAgentId);
  yield* chat.initialize(settings.chatId, agentConfig);
  
  // Perform business operation
  const result = yield* chat.sendMessage("Hello from composed services!");
  
  return result;
});
```

## Testing Services

Services should be tested in isolation with real dependencies:

```typescript
describe("ServiceName", () => {
  it("should perform operation correctly", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ServiceName;
      
      // Initialize with test configuration
      yield* service.initialize(testConfig);
      
      // Test operation
      const result = yield* service.operation("test-input");
      
      expect(result).toBeDefined();
      expect(result.value).toBe("expected-output");
      
      // Cleanup
      yield* service.cleanup();
    });
    
    await Effect.runPromise(
      program.pipe(Effect.provide(ServiceName.Default))
    );
  });
  
  it("should handle errors gracefully", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ServiceName;
      
      // Test error handling
      const result = yield* service.operation("invalid-input").pipe(
        Effect.either
      );
      
      expect(result._tag).toBe("Left");
      expect(result.left).toBeInstanceOf(ServiceOperationError);
    });
    
    await Effect.runPromise(
      program.pipe(Effect.provide(ServiceName.Default))
    );
  });
});
```

## Best Practices

### DO
- ✅ Keep services focused on single responsibilities
- ✅ Make operations pure and predictable
- ✅ Use Effect for all operations that can fail
- ✅ Define domain-specific error types
- ✅ Validate inputs and configurations
- ✅ Provide proper cleanup mechanisms
- ✅ Use Effect.Service pattern with dependencies
- ✅ Follow the MDX file structure

### DON'T
- ❌ Store application state in services (use managers)
- ❌ Create circular dependencies between services
- ❌ Mix multiple responsibilities in one service
- ❌ Use services for business logic orchestration
- ❌ Bypass Effect error handling
- ❌ Create services that depend on managers
- ❌ Use mutable state outside of configuration
- ❌ Ignore proper resource cleanup

## Service Lifecycle

### Initialization
```typescript
const initializeService = Effect.gen(function* () {
  const service = yield* ServiceName;
  yield* service.initialize(configuration);
});
```

### Operation
```typescript
const useService = Effect.gen(function* () {
  const service = yield* ServiceName;
  const result = yield* service.operation(input);
  return result;
});
```

### Cleanup
```typescript
const cleanupService = Effect.gen(function* () {
  const service = yield* ServiceName;
  yield* service.cleanup();
});
```

## Integration with Managers

Services are consumed by managers, never directly by components:

```typescript
// ❌ Wrong: Component using service directly
const Component = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* SomeService;
      return yield* service.getData();
    });
    
    Effect.runPromise(program).then(setData);
  }, []);
  
  return <div>{data}</div>;
};

// ✅ Correct: Component using manager hook
const Component = () => {
  const { data } = useSomeManager();
  return <div>{data}</div>;
};
```

## Migration Guide

When creating new services:

1. **Identify Pure Operations**: Look for functionality that can be isolated
2. **Define Clear API**: Create focused interface with single responsibility
3. **Implement Error Handling**: Define domain-specific error types
4. **Add Dependencies**: Only depend on other services, never managers
5. **Write Tests**: Test in isolation with real dependencies
6. **Document Usage**: Provide clear examples and integration patterns

When refactoring existing code to services:

1. **Extract Pure Functions**: Move stateless operations to services
2. **Remove State Management**: Move state to managers
3. **Define Service Boundaries**: Ensure single responsibility
4. **Update Dependencies**: Ensure proper dependency direction
5. **Update Tests**: Test services in isolation

## Conclusion

The Service Pattern provides the foundational layer of pure functionality that enables complex business logic through composition. Services maintain clear boundaries, single responsibilities, and predictable behavior, making them the building blocks for robust, testable, and maintainable applications. 