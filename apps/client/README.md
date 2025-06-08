# Buddy Client Application

A Next.js application built with Effect.js services and React components, demonstrating clean architecture patterns for integrating functional programming with React.

## Architecture Overview

This application follows a layered architecture that separates business logic (Effect.js services) from UI concerns (React components), with well-defined integration patterns.

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
│                   (UI & User Interaction)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ useChatRuntime()
┌─────────────────────▼───────────────────────────────────────┐
│                  React Contexts                            │
│              (React Lifecycle Management)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ useChatRuntimeService()
┌─────────────────────▼───────────────────────────────────────┐
│                   React Hooks                              │
│            (Effect.js ↔ React Bridge)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ Effect.runFork()
┌─────────────────────▼───────────────────────────────────────┐
│                 Effect.js Services                         │
│              (Pure Business Logic)                         │
└─────────────────────────────────────────────────────────────┘
```

## Service Integration Pattern

### The Four-Layer Pattern

We use a consistent four-layer pattern to integrate Effect.js services with React:

#### 1. **Effect.js Service Layer** (`src/services/`)
Pure business logic implemented with Effect.js patterns.

```typescript
// services/chat-runtime/ChatRuntimeService.ts
export interface ChatRuntimeServiceApi {
  readonly establishSession: (
    agentId: string,
    chatId: string,
  ) => Effect.Effect<AgentSession, AgentRuntimeError, Scope>;
}

export class ChatRuntimeService extends Effect.Service<ChatRuntimeServiceApi>()(
  "ChatRuntimeService",
  {
    scoped: Effect.gen(function* () {
      // Pure Effect.js implementation
      return { establishSession: ... };
    }),
    dependencies: [AgentEndpointResolverService.Default, WebSocketService.Default],
  },
) {}
```

#### 2. **React Hook Layer** (`src/hooks/`)
Bridges Effect.js services with React lifecycle.

```typescript
// hooks/useChatRuntimeService.ts
export interface ChatRuntimeServiceState {
  readonly status: "initializing" | "ready" | "error";
  readonly chatRuntime: ChatRuntimeServiceApi | null;
  readonly error: unknown | null;
}

export function useChatRuntimeService(): ChatRuntimeServiceState {
  const [state, setState] = useState<ChatRuntimeServiceState>({
    status: "initializing",
    chatRuntime: null,
    error: null,
  });

  useEffect(() => {
    // Run Effect.js service
    const fiber = Effect.runFork(
      Effect.provide(ChatRuntimeService, ChatRuntimeService.Default)
    );

    // Handle results and cleanup
    fiber.addObserver((exit) => {
      if (Exit.isSuccess(exit)) {
        setState({ status: "ready", chatRuntime: exit.value, error: null });
      } else {
        setState({ status: "error", chatRuntime: null, error: exit.cause });
      }
    });

    return () => Fiber.interrupt(fiber);
  }, []);

  return state;
}
```

#### 3. **React Context Layer** (`src/contexts/`)
Provides service state across component tree.

```typescript
// contexts/ChatRuntimeContext.tsx
const ChatRuntimeContext = createContext<ChatRuntimeServiceState | null>(null);

export function ChatRuntimeProvider({ children }: ChatRuntimeProviderProps) {
  const runtimeState = useChatRuntimeService();
  
  return (
    <ChatRuntimeContext.Provider value={runtimeState}>
      {children}
    </ChatRuntimeContext.Provider>
  );
}

export function useChatRuntime(): ChatRuntimeServiceState {
  const context = useContext(ChatRuntimeContext);
  if (!context) {
    throw new Error("useChatRuntime must be used within a ChatRuntimeProvider");
  }
  return context;
}
```

#### 4. **React Component Layer** (`src/components/`, `src/app/`)
Consumes service state for UI rendering.

```typescript
// app/ChatContainer.tsx
export default function ChatContainer() {
  const runtime = useChatRuntime();

  return (
    <div>
      {runtime.status === "ready" ? (
        <div>Runtime ready</div>
      ) : runtime.status === "error" ? (
        <div>Error: {String(runtime.error)}</div>
      ) : (
        <div>Initializing...</div>
      )}
    </div>
  );
}
```

### When to Use This Pattern

✅ **Use the full four-layer pattern when:**
- Service needs React lifecycle management (initialization, cleanup)
- Multiple components need access to service state
- Service state includes loading/error states for UI
- Service manages long-running resources (WebSockets, subscriptions)

❌ **Don't use contexts when:**
- Service is stateless or purely functional
- Only one component needs the service
- Service doesn't need React lifecycle integration
- Simple CRUD operations that can be called directly

### Example: ChatRuntimeService (✅ Good use of pattern)

**Why it uses the full pattern:**
- Manages WebSocket connections (needs cleanup)
- Has initialization states (initializing → ready → error)
- Multiple components need runtime status
- Long-running service with complex lifecycle

### Counter-example: AgentService (❌ Don't wrap in context)

**Why it doesn't need context:**
- Simple CRUD operations
- Stateless service calls
- No initialization phase
- Components can call service methods directly

```typescript
// ✅ Good: Direct service usage
const handleCreateAgent = async (agent: AgentConfig) => {
  const result = await Effect.runPromise(
    Effect.provide(
      Effect.flatMap(AgentService, (s) => s.create(agent)),
      AgentService.Default
    )
  );
};
```

## Directory Structure

```
src/
├── services/           # Effect.js services (pure business logic)
│   ├── agent/         # AgentService - CRUD operations
│   ├── chat-runtime/  # ChatRuntimeService - WebSocket management
│   ├── websocket/     # WebSocketService - Low-level WebSocket
│   └── ...
├── hooks/             # React hooks (Effect.js ↔ React bridge)
│   ├── useChatRuntimeService.ts
│   └── ...
├── contexts/          # React contexts (service lifecycle only)
│   ├── ChatRuntimeContext.tsx
│   └── ...
├── stores/            # Zustand stores (UI state)
│   ├── appShellStore.ts
│   └── ...
├── components/        # React components (UI)
└── app/              # Next.js app router pages
```

## Service Patterns

### Effect.js Service Definition

All services follow the Effect.Service pattern:

```typescript
export class MyService extends Effect.Service<MyServiceApi>()(
  "MyService",
  {
    scoped: Effect.gen(function* () {
      // Implementation
      return { /* API methods */ };
    }),
    dependencies: [/* Required services */],
  },
) {}
```

### Error Handling

Services use tagged errors for type-safe error handling:

```typescript
export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// In service implementation
yield* Effect.mapError(someOperation, (error) => 
  new MyServiceError({ message: "Operation failed", cause: error })
);
```

### Testing Services

Services are tested using Effect.js test utilities:

```typescript
test("should create agent", async () => {
  const result = await Effect.runPromise(
    Effect.provide(
      Effect.flatMap(AgentService, (s) => s.create(mockAgent)),
      AgentService.Default
    )
  );
  expect(result).toBeDefined();
});
```

## State Management

### Context vs Zustand vs Direct Service Calls

- **React Context**: For service lifecycle state (initialization, errors)
- **Zustand**: For complex UI state (app shell, chat selection, messages, form state)
- **Direct Service Calls**: For simple operations (CRUD, one-off actions)

### Current Contexts

1. **ChatRuntimeContext**: Service lifecycle management ✅

### Current State Management

- **React Context**: For service lifecycle state (ChatRuntimeContext)
- **Zustand Store**: For UI state (AppShellStore - chat selection, messages, etc.)
- **Direct Service Calls**: For simple operations (CRUD, one-off actions)

## Development Guidelines

### Adding a New Service

1. **Create the service** in `src/services/[service-name]/`
2. **Determine integration pattern**:
   - Simple operations → Direct service calls
   - Complex lifecycle → Full four-layer pattern
3. **If using full pattern**:
   - Create hook in `src/hooks/use[ServiceName]Service.ts`
   - Create context in `src/contexts/[ServiceName]Context.tsx`
   - Add provider to app layout
4. **Write tests** for service logic
5. **Update this README** with new patterns

### Best Practices

- **Keep services pure** - No React dependencies in service layer
- **Handle all errors** - Use tagged errors for type safety
- **Test services independently** - Don't test React integration in service tests
- **Document service APIs** - Clear interfaces and error types
- **Follow naming conventions** - Service, Hook, Context, Provider

## Examples

See the following files for complete examples:

- **Service**: `src/services/chat-runtime/ChatRuntimeService.ts`
- **Hook**: `src/hooks/useChatRuntimeService.ts`
- **Context**: `src/contexts/ChatRuntimeContext.tsx`
- **Component**: `src/app/ChatContainer.tsx`

## Migration Notes

When migrating from other patterns:

1. **From React Context wrapping services** → Use direct service calls for simple operations
2. **From mixed service/context logic** → Separate pure service logic from React concerns
3. **From imperative patterns** → Use Effect.js functional patterns

This architecture ensures clean separation of concerns, testable business logic, and maintainable React integration.

## Getting Started

### Development Setup

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Run tests
bun test

# Build for production
bun run build
```

### Environment

This project uses:
- **Next.js 15** - React framework
- **Effect.js 3.14+** - Functional programming library
- **TypeScript 5.8** - Type safety
- **Bun** - Package manager and runtime
- **Vitest** - Testing framework

Open [http://localhost:3000](http://localhost:3000) to view the application.
