# Buddy Chat Client

A modern, real-time chat application built with Next.js, Effect.js, and TypeScript. This client provides a clean, extensible chat interface with agent integration and dynamic configuration management.

## 🏗️ Architecture Overview

This application follows the **Effect.js Service Pattern** with clean separation between domain logic, UI state, and React components.

### Core Principles

- **Pure Effect Services**: All business logic lives in Effect.js services
- **Domain/UI Separation**: Clean separation between business domain models and UI state
- **Type Safety**: Full TypeScript coverage with strict typing
- **Service-First Design**: React components are thin wrappers around Effect services

## 📁 Project Structure

```
apps/client/
├── src/
│   ├── components/          # React integration components
│   │   ├── app/            # App-level React containers
│   │   ├── chatapp/        # Chat app React containers
│   │   ├── workspace/      # Workspace React containers
│   │   └── core/           # Core React integration
│   ├── services/           # Effect.js business logic services
│   │   ├── chat/           # Chat functionality and messaging
│   │   ├── chatbridge/     # Chat service bridge
│   │   └── config/         # Configuration management
│   ├── managers/           # Higher-level business coordination
│   │   ├── chat/           # Chat management
│   │   ├── chatapps/       # Chat app management
│   │   └── core/           # Core management
│   ├── domain/             # Pure domain models
│   │   ├── workspace.ts    # Workspace business logic
│   │   ├── chatapp.ts      # Chat app business logic
│   │   ├── agent.ts        # Agent business logic
│   │   └── app.ts          # App domain composition
│   ├── ui-state/           # UI state models
│   │   ├── workspace-ui-state.ts  # Workspace presentation state
│   │   ├── chatapp-ui-state.ts    # Chat app presentation state
│   │   └── app-ui-state.ts        # App presentation state
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── __tests__/              # Integration tests
└── public/                 # Static assets and configurations
```

## 🧩 Architecture Layers

### 1. Domain Layer (`src/domain/`)
Pure business logic models with no UI concerns:
- **WorkspaceModel**: Business rules, permissions, app management
- **ChatAppModel**: Agent associations, capabilities, business state
- **AgentModel**: LLM parameters, permissions, business configuration

### 2. UI State Layer (`src/ui-state/`)
Pure presentation state with no business logic:
- **WorkspaceUIState**: Layout modes, themes, window positioning
- **ChatAppUIState**: Styling, window management, presentation
- **AppUIState**: Global theme, layout state, UI preferences

### 3. Service Layer (`src/services/`)
Effect.js services implementing business operations:
- **ConfigService**: Configuration loading and management
- **ChatService**: Message handling and conversation management
- **ChatBridge**: Service communication coordination

### 4. Manager Layer (`src/managers/`)
Higher-level business logic coordination:
- **ChatManager**: Chat lifecycle and operations
- **ChatAppsManager**: Multi-chat coordination
- **CoreManager**: Application-level coordination

### 5. Component Layer (`src/components/`)
React integration components:
- **AppContainer**: React wrapper for app services
- **WorkspaceContainer**: React wrapper for workspace services  
- **ChatAppContainer**: React wrapper for chat app services

## 🔧 Service Architecture

### Effect.js Services (MDX Pattern)

All services follow the **MDX service pattern** with exactly 5 files:

```
services/service-name/
├── api.ts      # Service contract interface
├── errors.ts   # Domain-specific error types
├── types.ts    # Type definitions and constants
├── service.ts  # Effect.Service implementation
└── index.ts    # Barrel exports
```

### Service Integration Rules

1. **Use Layer instances** in dependencies (e.g., `SomeService.Default`)
2. **Never export `.Live` or `.Default`** directly from service files
3. **All methods return Effect** with proper error handling
4. **Use `scoped` for services with dependencies**
5. **Map all errors** to domain-specific error types

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun package manager
- TypeScript 5.8+

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun run test
```

### Development Workflow

1. **Domain First**: Define business models in `src/domain/`
2. **Services**: Implement business operations in Effect services
3. **UI State**: Define presentation state in `src/ui/`
4. **Components**: Create React integration components
5. **Testing**: Write integration tests with real services

## 🧪 Testing Strategy

### Integration Tests (`__tests__/integration/`)
- **Real Services**: Tests use actual Effect services, no mocking
- **Network Integration**: Tests connect to real WebSocket and HTTP services
- **Complete Flows**: End-to-end chat functionality testing
- **Performance**: Stress testing with 100+ concurrent messages

### Testing Principles
- **No Mocking**: Tests use real external services [[memory:28905]]
- **Real Dependencies**: Connect to actual APIs and WebSocket servers
- **Meaningful Tests**: Tests validate actual production behavior

## 🎨 Styling and Theming

- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: Dynamic theming support
- **Responsive Design**: Mobile-first approach
- **Component Variants**: Consistent design system

## 🔌 Configuration

### App Configurations
- Stored in `public/static/configs/`
- JSON-based configuration files
- Dynamic loading and hot-reloading
- Workspace, agent, and chat app configurations

### Environment Variables
- Clerk authentication configuration
- API endpoints and keys
- Development/production settings

## 📚 Key Patterns

### Domain/UI Separation
```typescript
// Domain model - pure business logic
interface WorkspaceModel {
  readonly id: string
  readonly chatappIds: string[]
  readonly permissions: Permission[]
  readonly isDefault: boolean
}

// UI state - pure presentation
interface WorkspaceUIState {
  readonly layoutMode: "grid" | "list"
  readonly theme: "light" | "dark"
  readonly expandedApps: Set<string>
}
```

### Effect Service Integration
```typescript
// Service with dependencies
export const MyServiceLive = Layer.scoped(
  MyServiceTag,
  Effect.gen(function* () {
    const dependency = yield* DependencyService
    return new MyServiceImpl(dependency)
  })
).pipe(
  Layer.provide(DependencyService.Default)
)
```

### React Integration
```typescript
// React component using Effect services
export function MyContainer() {
  const [state, setState] = useState(initialState)
  
  useEffect(() => {
    const subscription = Effect.runSync(
      myService.subscribe().pipe(
        Effect.provide(serviceLayer)
      )
    )
    return () => subscription.interrupt()
  }, [])
  
  return <MyComponent state={state} />
}
```

## 🔗 Related Projects

- **CLI**: `apps/cli/` - Command-line workspace management
- **UI Package**: `packages/ui/` - Shared UI components
- **Schemas**: `packages/schemas/` - Shared type definitions

## 📈 Performance

- **Effect.js**: Efficient functional programming with proper resource management
- **React Integration**: Minimal React overhead with Effect service integration
- **Real-time**: WebSocket-based chat with streaming message processing
- **Configuration**: Dynamic loading without application restarts
