# React Hooks

This directory contains React hooks that bridge **Effect.js services** with **React components**. These hooks follow the four-layer architecture pattern and provide the React ↔ Effect.js integration layer.

## Current Hooks

### ✅ useChatAppRuntime.ts (114 lines)

**Purpose**: Composite hook that combines config, toolbar, theme, and agent session for a chat app.

**Pattern**: Composite data fetching + service integration
```typescript
export function useChatAppRuntime(chatAppId: string, themeOverride?: ChatAppTheme) {
  // Fetches: AppService + ToolbarService + ThemesService
  // Integrates: useAgentSession for live chat
  // Returns: Combined runtime state
}
```

**Why it exists**:
- Combines multiple services (App, Toolbar, Themes) 
- Integrates with agent session lifecycle
- Provides unified runtime state for chat apps
- Supports theme overrides for live preview

**Consumers**: Chat app components that need full runtime context

---

### ✅ useChatRuntimeService.ts (65 lines)

**Purpose**: Manages ChatRuntimeService lifecycle for React components.

**Pattern**: Service lifecycle management
```typescript
export function useChatRuntimeService(): ChatRuntimeServiceState {
  // Initializes ChatRuntimeService with Effect.js
  // Manages fiber lifecycle and cleanup
  // Provides status: "initializing" | "ready" | "error"
}
```

**Why it exists**:
- ChatRuntimeService manages WebSocket connections (needs cleanup)
- Has complex initialization states
- Used by ChatRuntimeContext for state sharing

**Consumers**: `ChatRuntimeContext.tsx`

---

### ✅ useAgentSession.ts (89 lines)

**Purpose**: Manages individual agent session lifecycle and message streams.

**Pattern**: Session lifecycle + stream management
```typescript
export function useAgentSession(agentId: string, chatId: string) {
  // Establishes agent session via ChatRuntimeService
  // Subscribes to status and message streams
  // Provides imperative sendMessage/closeSession methods
}
```

**Why it exists**:
- Agent sessions have complex lifecycle (establish → stream → cleanup)
- Manages real-time message streams
- Provides imperative API for sending messages
- Handles session cleanup on unmount

**Consumers**: `useChatAppRuntime.ts`, chat components

---

### ✅ useChatInstance.ts (489 lines) ⚠️ **LARGE**

**Purpose**: Comprehensive chat instance state management with reconnection logic.

**Pattern**: Complex state machine + stream processing
```typescript
export function useChatInstance(
  chatId: string, 
  agentConfigData: ChatAgentConfig,
  injectedLayer?: Layer.Layer<any, any, any>
) {
  // Manages chat state machine
  // Handles message streaming and accumulation  
  // Implements reconnection logic
  // Processes protocol messages → UI messages
}
```

**Why it exists**:
- Complex chat state management (messages, typing, status)
- Handles streaming message accumulation
- Implements reconnection with exponential backoff
- Converts protocol messages to UI messages with MDX compilation

**Size concern**: 489 lines suggests potential for refactoring into smaller hooks

**Consumers**: Chat interface components

---

### ✅ useChatTheme.ts (64 lines)

**Purpose**: Pure utility hook for theme processing and merging.

**Pattern**: Pure computation hook
```typescript
export function useChatTheme(theme?: Partial<ChatAppTheme> | string): ChatAppTheme {
  // Handles string themes (JSON parsing, named themes)
  // Deep merges partial themes with defaults
  // Returns fully resolved theme object
}
```

**Why it exists**:
- Theme processing logic is complex (string parsing, deep merge)
- Memoized for performance
- Reusable across theme-aware components

**Consumers**: Theme-aware chat components

---

### ❌ useToolbars.ts **REMOVED** ✅

**Was**: CRUD operations wrapper for ToolbarService (99 lines).

**Why it was removed**:
- **No consumers**: Not imported or used anywhere
- **Anti-pattern**: Wrapped simple CRUD operations in React state
- **Duplicated service**: ToolbarService already provided all functionality

**Migration**: Use `ToolbarService` directly for CRUD operations.

## Hook Patterns

### ✅ **Service Lifecycle Management**
```typescript
// Pattern: Manage Effect.js service lifecycle in React
export function useServiceLifecycle() {
  useEffect(() => {
    const fiber = Effect.runFork(ServiceEffect);
    return () => Fiber.interrupt(fiber); // Cleanup!
  }, []);
}
```
**Examples**: `useChatRuntimeService`, `useAgentSession`

### ✅ **Composite Data Fetching**
```typescript
// Pattern: Combine multiple services for unified state
export function useCompositeData() {
  const program = Effect.gen(function* () {
    const service1 = yield* Service1;
    const service2 = yield* Service2;
    return { data1: yield* service1.getData(), data2: yield* service2.getData() };
  });
}
```
**Examples**: `useChatAppRuntime`

### ✅ **Pure Computation**
```typescript
// Pattern: Memoized computation without side effects
export function usePureComputation(input: T): R {
  return useMemo(() => computeResult(input), [input]);
}
```
**Examples**: `useChatTheme`

### ❌ **CRUD Wrapper Anti-pattern**
```typescript
// ❌ DON'T: Wrap simple service operations in hooks
export function useCRUDWrapper() {
  const [items, setItems] = useState([]);
  const create = useCallback((item) => {
    // Just wrapping service calls in React state
  }, []);
}
```
**Examples**: `useToolbars` (should be removed)

## Cleanup Recommendations

### 1. ✅ Removed Dead Code: useToolbars.ts 
**Completed**: Removed 99 lines of dead code that followed anti-pattern.

### 2. Consider Refactoring: useChatInstance.ts ⚠️
**Size**: 489 lines suggests complexity that could be broken down:

**Potential splits**:
- `useChatState.ts` - Core chat state management
- `useChatStreaming.ts` - Message streaming logic  
- `useChatReconnection.ts` - Reconnection logic
- `useProtocolMessageConverter.ts` - Protocol → UI message conversion

**Benefits**:
- Easier testing of individual concerns
- Better reusability
- Clearer separation of responsibilities

## When to Create New Hooks

### ✅ **DO create hooks for**:
- **Service lifecycle management** (initialization, cleanup, error states)
- **Complex state machines** (chat sessions, connection states)
- **Stream processing** (real-time data, message accumulation)
- **Composite data fetching** (combining multiple services)
- **Pure computations** (theme processing, data transformation)

### ❌ **DON'T create hooks for**:
- **Simple CRUD operations** (use services directly)
- **One-off service calls** (use Effect.runPromise directly)
- **UI state management** (use Zustand stores)
- **Static data** (use constants or config files)

## Architecture Separation Principles

### 🎯 **Clean Layer Separation**

Our architecture maintains strict separation between Effect.js, xState/store, and React:

```
┌─────────────────┐    Events    ┌──────────────────┐    State    ┌─────────────────┐
│   Effect.js     │─────────────▶│   xState/store   │────────────▶│     React       │
│  (Services)     │              │   (Pure State)   │             │ (UI Components) │
│                 │              │                  │             │                 │
│ • ChatRuntime   │              │ • chatInstance   │             │ • useChatInst.. │
│ • MdxService    │              │ • streaming      │             │ • ChatContainer │
│ • AgentSession  │              │ • connection     │             │ • MessageList   │
└─────────────────┘              └──────────────────┘             └─────────────────┘
       ▲                                                                    │
       │                                                                    │
       └────────────────────────── Commands ──────────────────────────────┘
```

### ✅ **Effect.js Layer** (Pure Business Logic)
```typescript
// src/services/chat-instance/ChatInstanceService.ts  
export class ChatInstanceService extends Effect.Service<ChatInstanceServiceApi>() {
  // Pure Effect.js business logic
  processIncomingMessage: (message: ProtocolMessage) => Effect.Effect<Message, never>
  handleReconnection: (attempts: number) => Effect.Effect<void, ConnectionError>
  // ✅ No React, no hooks, no DOM, no xState/store
}
```

**Effect.js NEVER touches**:
- React hooks (`useState`, `useEffect`, etc.)
- React components or JSX
- DOM manipulation
- xState/store instances
- React-specific patterns

### ✅ **xState/store Layer** (Pure State Management)
```typescript
// src/stores/chatInstanceStore.ts
import { createStore } from '@xstate/store';

export const chatInstanceStore = createStore({
  context: {
    chatId: '',
    messages: [] as Message[],
    status: 'initializing' as ChatStatus,
    // ✅ Pure state - no Effect.js, no React
  },
  on: {
    messageReceived: (context, event: { message: Message }) => ({
      ...context,
      messages: [...context.messages, event.message]
    }),
    // ✅ Pure state transitions - no side effects
  }
});
```

**xState/store NEVER touches**:
- Effect.js services directly
- Async operations or side effects
- Network calls or file system
- React hooks or components

### ✅ **React Bridge Layer** (Integration Only)
```typescript
// src/hooks/useChatInstance.ts
export function useChatInstance(chatId: string, agentConfig: ChatAgentConfig) {
  // ✅ React hook that bridges Effect.js ↔ xState/store
  
  useEffect(() => {
    const program = Effect.gen(function* () {
      const chatService = yield* ChatInstanceService;
      
      // Effect.js handles business logic
      yield* Stream.runForEach(
        runtime.incomingMessages$,
        (protocolMessage) => Effect.gen(function* () {
          const uiMessage = yield* chatService.processIncomingMessage(protocolMessage);
          
          // Bridge to React state via xState/store
          return Effect.sync(() => {
            chatInstanceStore.send({ 
              type: 'messageReceived', 
              message: uiMessage 
            });
          });
        })
      );
    });
    
    const fiber = Effect.runFork(program);
    return () => Fiber.interrupt(fiber);
  }, [chatId]);
  
  // React state selection
  const chatState = useSelector(chatInstanceStore, (state) => state.context);
  return { chatState };
}
```

**React NEVER touches**:
- WebSocket connections directly
- Protocol message parsing
- Business logic validation
- Stream processing
- Service orchestration

## Architecture Examples

### ✅ Good: Clean Separation Pattern
```typescript
// Effect.js Service (Pure business logic)
export class NotificationService extends Effect.Service<NotificationServiceApi>() {
  sendEmail: (to: string, subject: string) => Effect.Effect<void, EmailError>
  // No React dependencies
}

// xState/store (Pure state management)
export const notificationStore = createStore({
  context: { notifications: [], unreadCount: 0 },
  on: {
    notificationAdded: (context, event) => ({
      ...context,
      notifications: [...context.notifications, event.notification],
      unreadCount: context.unreadCount + 1
    })
  }
});

// React Hook (Bridge layer only)
export function useNotifications() {
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* NotificationService;
      // Effect.js handles the logic
      const notification = yield* service.createNotification();
      // Bridge to React via store
      return Effect.sync(() => {
        notificationStore.send({ type: 'notificationAdded', notification });
      });
    });
    
    Effect.runFork(program);
  }, []);
  
  return useSelector(notificationStore, (state) => state.context);
}
```

### ❌ Bad: Mixed Concerns
```typescript
// ❌ Don't mix Effect.js with React state
export function useBadExample() {
  const [state, setState] = useState([]); // React state
  
  const fetchData = useCallback(() => {
    Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* DataService;
        const data = yield* service.getData();
        setState(data); // ❌ Effect.js directly updating React state
      })
    );
  }, []);
  
  return { state, fetchData };
}

// ✅ Do this instead - clear separation
export function useGoodExample() {
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* DataService;
      const data = yield* service.getData();
      // Bridge through store
      return Effect.sync(() => {
        dataStore.send({ type: 'dataLoaded', data });
      });
    });
    
    Effect.runFork(program);
  }, []);
  
  return useSelector(dataStore, (state) => state.context);
}
```

## Benefits of Clean Separation

### ✅ **Independent Testability**
```typescript
// Test Effect.js services in isolation
test('ChatInstanceService processes messages correctly', async () => {
  const result = await Effect.runPromise(
    Effect.provide(
      ChatInstanceService.processIncomingMessage(protocolMessage),
      ChatInstanceService.Default
    )
  );
  expect(result.text).toBe('Hello');
});

// Test xState/store in isolation  
test('chatInstanceStore handles message events', () => {
  const [nextState] = chatInstanceStore.transition(
    initialState,
    { type: 'messageReceived', message: testMessage }
  );
  expect(nextState.context.messages).toHaveLength(1);
});

// Test React integration separately
test('useChatInstance hook integrates correctly', () => {
  const { result } = renderHook(() => useChatInstance('chat1', config));
  expect(result.current.chatState.status).toBe('initializing');
});
```

### ✅ **Cross-Platform Reusability**
- **Effect.js services**: Work in Node.js, workers, edge functions
- **xState/store**: Works with Vue, Svelte, vanilla JS
- **React hooks**: Only handle React-specific UI concerns

### ✅ **Enhanced Debuggability**
- **Effect.js**: Structured logging, error tracing, fiber inspection
- **xState/store**: Event history, state transitions, time-travel debugging
- **React**: Component tree, props, re-render tracking

### ✅ **Maintainable Architecture**
- Clear ownership of responsibilities
- No circular dependencies
- Easy to reason about data flow
- Simple to onboard new developers

## Testing Hooks

### Service Integration Hooks
```typescript
// Test the hook behavior, not the service logic
test("useAgentSession should manage session lifecycle", () => {
  const { result } = renderHook(() => useAgentSession("agent1", "chat1"));
  
  expect(result.current.status).toBe("initializing");
  // Test state transitions, not service implementation
});
```

### Pure Computation Hooks
```typescript
// Test the computation logic
test("useChatTheme should merge themes correctly", () => {
  const { result } = renderHook(() => 
    useChatTheme({ colors: { primary: "#ff0000" } })
  );
  
  expect(result.current.colors.primary).toBe("#ff0000");
  expect(result.current.colors.secondary).toBe(defaultChatTheme.colors.secondary);
});
```

### xState/store Integration Hooks
```typescript
// Test store integration without Effect.js complexity
test("useChatInstance should handle store events", () => {
  const { result } = renderHook(() => useChatInstance('chat1', config));
  
  // Trigger store event directly
  act(() => {
    chatInstanceStore.send({ 
      type: 'messageReceived', 
      message: { id: '1', text: 'Hello', role: 'assistant', timestamp: Date.now() }
    });
  });
  
  expect(result.current.chatState.messages).toHaveLength(1);
  expect(result.current.chatState.messages[0].text).toBe('Hello');
});
```

## Migration Strategy

When refactoring existing hooks to use xState/store:

### Phase 1: Create Stores
```typescript
// Create xState/store alongside existing hook
export const chatInstanceStore = createStore({
  context: { /* initial state */ },
  on: { /* event handlers */ }
});
```

### Phase 2: Extract Business Logic
```typescript
// Move complex logic to Effect.js services
export class ChatInstanceService extends Effect.Service<ChatInstanceServiceApi>() {
  processMessage: (msg: ProtocolMessage) => Effect.Effect<Message, never>
}
```

### Phase 3: Bridge Integration
```typescript
// Update hook to bridge Effect.js ↔ xState/store ↔ React
export function useChatInstance() {
  useEffect(() => {
    // Effect.js program that updates store
  }, []);
  
  return useSelector(store, selector);
}
```

### Phase 4: Maintain Compatibility
```typescript
// Keep same public API during migration
export function useChatInstance(chatId: string, config: ChatAgentConfig) {
  // Internal implementation changed, external API unchanged
  return {
    chatState,      // Same shape
    sendMessage,    // Same function signature
    // ... other exports
  };
}
```

## Future Patterns

### Event-Driven Architecture
```typescript
// Prefer descriptive events over imperative actions
store.send({ type: 'messageReceived', message, timestamp });
store.send({ type: 'connectionLost', reason: 'network_error' });
store.send({ type: 'reconnectionAttempted', attempt: 3 });

// Instead of
setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
```

### Store Composition
```typescript
// Compose multiple focused stores
const chatState = useSelector(chatInstanceStore, s => s.context);
const streamingState = useSelector(streamingStore, s => s.context);
const connectionState = useSelector(connectionStore, s => s.context);

return { chatState, streamingState, connectionState };
```

### Effect.js Integration Patterns
```typescript
// Standard pattern for bridging Effect.js to stores
const bridgeEffectToStore = <T>(
  effect: Effect.Effect<T, any, any>,
  onSuccess: (value: T) => void,
  onError?: (error: any) => void
) => {
  Effect.runFork(
    effect.pipe(
      Effect.tap(value => Effect.sync(() => onSuccess(value))),
      Effect.catchAll(error => Effect.sync(() => onError?.(error)))
    )
  );
};
```

## Related Documentation

- **Main Architecture**: `../README.md` - Four-layer pattern overview
- **Services**: `../services/` - Effect.js service implementations  
- **Contexts**: `../contexts/` - Service lifecycle contexts
- **Stores**: `../stores/` - Zustand UI state management
- **xState/store Docs**: [Official Documentation](https://stately.ai/docs/xstate-store)

This architecture ensures clean separation between React concerns and business logic, with hooks serving as the bridge layer between Effect.js services and React components. The addition of xState/store provides event-driven state management that scales beautifully with complex application logic. 