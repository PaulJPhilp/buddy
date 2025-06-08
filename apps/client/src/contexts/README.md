# React Contexts

This directory contains React contexts that provide **service lifecycle management** for Effect.js services. After architectural cleanup, we maintain a strict separation of concerns:

- **React Contexts** → Service lifecycle state (initialization, errors, cleanup)
- **Zustand Stores** → UI state management (`src/stores/`)
- **Direct Service Calls** → Simple CRUD operations

## Current Contexts

### ChatRuntimeContext.tsx ✅

**Purpose**: Manages the lifecycle of ChatRuntimeService for React components.

**Why it exists**:
- ChatRuntimeService manages WebSocket connections (needs cleanup)
- Has initialization states (initializing → ready → error)
- Multiple components need runtime status
- Long-running service with complex lifecycle

**Pattern**: Four-layer service integration
```
ChatRuntimeService (Effect.js) 
    ↓ 
useChatRuntimeService (React hook)
    ↓
ChatRuntimeContext (React context)
    ↓
useChatRuntime (Consumer hook)
    ↓
Components (UI state management)
```

**Usage**:
```typescript
// In component
const runtime = useChatRuntime();

// Check status
if (runtime.status === "ready") {
  // Use runtime.chatRuntime for service operations
} else if (runtime.status === "error") {
  // Handle runtime.error
}
```

**Consumers**:
- `ChatContainer.tsx` - Displays runtime status
- `RuntimeServiceExample.tsx` - Demonstrates service usage

## Removed Contexts

### ❌ AgentsContext (Deleted)
**Why removed**: Duplicated AgentService functionality with no actual consumers.
**Migration**: Use AgentService directly for CRUD operations.

### ❌ SelectedChatContext (Deleted) 
**Why removed**: UI state belongs in Zustand store, not React context.
**Migration**: Moved to `AppShellStore` (`selectedChatId`, `activeChatId`).

### ❌ AppShellContext (Deleted)
**Why removed**: Dead code with no providers or consumers.
**Migration**: Functionality handled by `AppShellStore`.

## When to Add New Contexts

### ✅ **DO create a context when**:
- Service needs React lifecycle management (initialization, cleanup)
- Multiple components need access to service state
- Service state includes loading/error states for UI
- Service manages long-running resources (WebSockets, subscriptions)

### ❌ **DON'T create a context when**:
- Service is stateless or purely functional
- Only one component needs the service
- Service doesn't need React lifecycle integration
- Simple CRUD operations that can be called directly
- UI state that belongs in Zustand store

## Architecture Examples

### ✅ Good: ChatRuntimeService (Uses Context)
```typescript
// Service manages WebSocket connections
export class ChatRuntimeService extends Effect.Service<ChatRuntimeServiceApi>()

// Hook manages React lifecycle
export function useChatRuntimeService(): ChatRuntimeServiceState {
  useEffect(() => {
    const fiber = Effect.runFork(ChatRuntimeService);
    return () => Fiber.interrupt(fiber); // Cleanup!
  }, []);
}

// Context provides state to components
export function ChatRuntimeProvider({ children }) {
  const runtimeState = useChatRuntimeService();
  return <ChatRuntimeContext.Provider value={runtimeState}>{children}</ChatRuntimeContext.Provider>;
}
```

### ❌ Bad: AgentService (Don't Use Context)
```typescript
// ❌ Don't wrap simple CRUD services in contexts
const handleCreateAgent = async (agent: AgentConfig) => {
  // ✅ Use service directly
  const result = await Effect.runPromise(
    Effect.provide(
      Effect.flatMap(AgentService, (s) => s.create(agent)),
      AgentService.Default
    )
  );
};
```

## Testing Contexts

Test the service logic separately from React integration:

```typescript
// ✅ Test service logic
test("ChatRuntimeService should establish session", async () => {
  const result = await Effect.runPromise(
    Effect.provide(
      Effect.flatMap(ChatRuntimeService, (s) => s.establishSession("agent1", "chat1")),
      ChatRuntimeService.Default
    )
  );
  expect(result).toBeDefined();
});

// ✅ Test React integration separately
test("ChatRuntimeProvider should provide runtime state", () => {
  render(
    <ChatRuntimeProvider>
      <TestComponent />
    </ChatRuntimeProvider>
  );
  // Test component behavior
});
```

## Migration Guidelines

When migrating existing patterns:

1. **From Context wrapping services** → Use direct service calls for simple operations
2. **From mixed service/context logic** → Separate pure service logic from React concerns  
3. **From UI state in contexts** → Move to Zustand stores
4. **From imperative patterns** → Use Effect.js functional patterns

## Related Documentation

- **Main Architecture**: `../README.md` - Complete four-layer pattern documentation
- **Services**: `../services/` - Effect.js service implementations
- **Stores**: `../stores/` - Zustand UI state management
- **Hooks**: `../hooks/` - React ↔ Effect.js bridge layer

This architecture ensures clean separation of concerns, testable business logic, and maintainable React integration. 