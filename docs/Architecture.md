# Buddy Architecture v2

## Overview

Buddy is a chat application platform built on **EffectTalk** architectural principles, combining Effect-TS functional programming with React UI components. The architecture follows a clean three-layer pattern with strict separation of concerns.

## Core Principles

### EffectTalk Architecture
- **"Everything is a Service"** - All business logic encapsulated in Effect.Service classes
- **"Services Communicate via Effect Operations"** - Type-safe, composable operations
- **"State is Managed with Effect Refs"** - Reactive, atomic state management
- **"UIs are Just Thin Renderers"** - React components subscribe to service state
- **"English is the Ultimate UI"** - Natural language as a first-class interface

### Clean Architecture Layers
```
┌─────────────────────────────────────┐
│           UI Layer (React)          │ ← Presentation Logic
├─────────────────────────────────────┤
│        Component Layer              │ ← UI State Management
├─────────────────────────────────────┤
│         Manager Layer               │ ← Business Logic
├─────────────────────────────────────┤
│         Service Layer               │ ← Data & External APIs
└─────────────────────────────────────┘
```

## Directory Structure

```
apps/client/src/
├── app/                    # Next.js app router
├── components/             # React UI components (v2)
│   ├── app/               # App-level components
│   ├── chatapp/           # Chat app components
│   ├── core/              # Core component services
│   └── workspace/         # Workspace components
├── managers/              # Business logic managers (v2)
│   ├── chat/              # Chat conversation management
│   ├── chatapps/          # Chat app lifecycle management
│   └── core/              # Core manager services
├── services/              # External service integrations (v2)
│   ├── chat/              # Chat service operations
│   ├── chatbridge/        # Low-level communication
│   └── config/            # Configuration management
├── domain/                # Pure domain models
├── ui-state/              # UI state models
├── types/                 # Type definitions
├── utils/                 # Utility functions
└── middleware.ts          # Next.js middleware
```

## Service Architecture

### MDX Service Pattern
All services follow the **MDX (Modern Development eXperience)** pattern with exactly 5 files:

```typescript
service/
├── api.ts       # Service contract (interface)
├── errors.ts    # Domain-specific error types
├── types.ts     # Type definitions
├── service.ts   # Effect.Service implementation
└── index.ts     # Barrel exports
```

### Service Examples

#### Core Service Structure
```typescript
// api.ts - Service Contract
export interface ChatManagerApi {
  readonly startConversation: (workspaceId: string) => Effect.Effect<Conversation, ChatManagerError>
  readonly sendMessage: (conversationId: string, content: string) => Effect.Effect<Message, ChatManagerError>
  readonly getState: () => Effect.Effect<ChatManagerState, never>
  readonly subscribe: (listener: (state: ChatManagerState) => void) => Effect.Effect<() => void, never>
}

// errors.ts - Domain Errors
export class ConversationNotFoundError extends Data.TaggedError("ConversationNotFoundError")<{
  readonly conversationId: string
}> {}

// types.ts - Type Definitions
export interface ChatManagerState {
  readonly conversations: Record<string, Conversation>
  readonly activeConversationId: string | null
  readonly isLoading: boolean
}

// service.ts - Implementation
export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    scoped: Effect.gen(function* () {
      const stateRef = yield* Ref.make<ChatManagerState>(initialState)
      // Implementation...
      return { /* API methods */ }
    }),
    dependencies: [CoreManager.Default]
  }
) {}
```

## Component Architecture

### React-Effect Integration
React components use custom hooks to integrate with Effect services:

```typescript
// Component Hook Pattern
export function useChatManager() {
  const [state, setState] = useState<ChatManagerState | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const effect = Effect.gen(function* () {
      const chatManager = yield* ChatManager
      const unsubscribe = yield* chatManager.subscribe(setState)
      unsubscribeRef.current = unsubscribe
      return yield* chatManager.getState()
    })

    Effect.runPromise(effect.pipe(
      Effect.provide(Layer.merge(
        ChatManager.Default,
        CoreManager.Default
      ))
    )).then(setState)

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [])

  return { state }
}

// React Component
export function ChatArea() {
  const { state } = useChatManager()
  
  if (!state) return <div>Loading...</div>
  
  return (
    <div>
      {Object.values(state.conversations).map(conversation => (
        <ConversationView key={conversation.id} conversation={conversation} />
      ))}
    </div>
  )
}
```

## Domain Models

### Clean Domain/UI Separation
Domain models contain only business logic, while UI state models handle presentation:

```typescript
// domain/workspace.ts - Pure Business Logic
export interface WorkspaceModel {
  readonly id: string
  readonly name: string
  readonly chatappIds: string[]        // References only
  readonly permissions: Permission[]
  readonly isDefault: boolean
}

// ui-state/workspace.ts - Pure Presentation Logic
export interface WorkspaceUIState {
  readonly layoutMode: 'grid' | 'list' | 'tabs'
  readonly theme: 'light' | 'dark' | 'auto'
  readonly windowPositions: Record<string, Position>
  readonly maxExpandedApps: number
}
```

## Configuration System

### Environment Configuration
```typescript
// services/config/types.ts
export interface AppConfig {
  readonly port: number
  readonly apiKey: string
  readonly debug: boolean
}

export const AppConfigSchema = Config.Struct({
  port: Config.Number("PORT"),
  apiKey: Config.Secret("API_KEY"),
  debug: Config.Boolean("DEBUG")
})

// services/config/service.ts
export class ConfigService extends Effect.Service<ConfigServiceApi>()(
  "ConfigService",
  {
    scoped: Effect.gen(function* () {
      const config = yield* Effect.config(AppConfigSchema)
      return {
        getConfig: () => Effect.succeed(config),
        // ... other methods
      }
    })
  }
) {}
```

### JSON Configuration Files
Configuration is loaded from JSON files with schema validation:

```typescript
// Load and validate configuration
const loadConfig = Effect.gen(function* () {
  const content = yield* FileSystem.readFileString("config.json")
  const parsed = JSON.parse(content)
  return yield* Schema.parse(ConfigSchema)(parsed)
})
```

## State Management

### Atomic State Updates
All state mutations use atomic `Ref.modify` operations:

```typescript
const addConversation = (conversation: Conversation) =>
  Ref.modify(stateRef, (state) => {
    const newConversations = { ...state.conversations, [conversation.id]: conversation }
    const newState = { ...state, conversations: newConversations }
    return [Effect.succeed(undefined), newState]
  }).pipe(Effect.flatten)
```

### Subscription System
Services provide subscription APIs for state changes:

```typescript
const subscribe = (listener: (state: State) => void) =>
  Effect.gen(function* () {
    listeners.add(listener)
    const currentState = yield* Ref.get(stateRef)
    listener(currentState)
    return () => listeners.delete(listener)
  })
```

## Error Handling

### Tagged Error Types
All errors are typed using Effect's tagged error system:

```typescript
export class WorkspaceNotFoundError extends Data.TaggedError("WorkspaceNotFoundError")<{
  readonly workspaceId: string
  readonly availableWorkspaces: string[]
}> {}

export class ConfigValidationError extends Data.TaggedError("ConfigValidationError")<{
  readonly message: string
  readonly cause: Error
}> {}
```

### Error Recovery Patterns
```typescript
const loadConfigWithFallback = Effect.gen(function* () {
  const config = yield* loadConfig().pipe(
    Effect.catchTag("ConfigLoadError", () => Effect.succeed(defaultConfig))
  )
  return config
})
```

## Testing Strategy

### Service Testing
Services are tested using Effect's testing utilities:

```typescript
describe("ChatManager", () => {
  it("should start conversation", () =>
    Effect.gen(function* () {
      const chatManager = yield* ChatManager
      const conversation = yield* chatManager.startConversation("workspace-1")
      expect(conversation.workspaceId).toBe("workspace-1")
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    ))
})
```

### React Component Testing
Components are tested using React Testing Library with Effect service mocks:

```typescript
test("renders chat area", async () => {
  const mockState = { conversations: {}, activeConversationId: null, isLoading: false }
  
  render(
    <EffectProvider layer={MockChatManagerLayer}>
      <ChatArea />
    </EffectProvider>
  )
  
  expect(screen.getByText("Loading...")).toBeInTheDocument()
})
```

## Build and Development

### Package Management
- **Package Manager**: Bun (fast, modern JavaScript runtime)
- **TypeScript**: Version 5.8 with strict type checking
- **Testing**: Vitest for unit and integration tests
- **Linting**: Biome for fast, modern code formatting

### Development Workflow
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Run tests
bun test

# Type checking
bun run type-check

# Build for production
bun run build
```

## Key Features

### Multi-Interface Support
- **Web UI**: React-based chat interface
- **CLI**: Command-line interface for automation
- **LLM Interface**: Natural language interaction with the same services

### Real-time Communication
- **WebSocket Integration**: Real-time message delivery
- **State Synchronization**: Cross-component state updates
- **Event System**: Pub/sub for loose coupling

### Extensibility
- **Plugin Architecture**: New chat apps can be dynamically loaded
- **Agent System**: Configurable AI agents with different capabilities
- **Workspace Management**: Multiple isolated chat environments

## Security

### Type Safety
- **Effect-TS**: Compile-time error handling and type safety
- **Schema Validation**: Runtime validation of all external data
- **Immutable State**: All state updates are immutable

### Input Sanitization
- **XSS Protection**: HTML sanitization for user content
- **Validation**: Input validation at service boundaries
- **Error Isolation**: Component errors don't propagate

## Performance

### Optimization Strategies
- **Lazy Loading**: Components and services loaded on demand
- **State Subscriptions**: Efficient state change notifications
- **Memory Management**: Proper cleanup prevents memory leaks
- **Atomic Operations**: Consistent state with high concurrency

### Monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **Resource Usage**: Memory and CPU monitoring

## Future Roadmap

### Short Term
- **Enhanced UI Components**: More sophisticated chat interfaces
- **Agent Marketplace**: Dynamic agent discovery and installation
- **Collaboration Features**: Multi-user workspace support

### Long Term
- **Distributed Architecture**: Multi-node deployment
- **Advanced AI Integration**: Custom model training and deployment
- **Enterprise Features**: SSO, audit logging, compliance tools

---

This architecture provides a solid foundation for building scalable, maintainable chat applications while maintaining the flexibility to evolve with changing requirements. 