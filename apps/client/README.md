# Buddy Chat Client

A modern, real-time chat application built with Next.js, Effect.js, and TypeScript. This client provides a clean, extensible chat interface with agent integration and dynamic configuration management.

## 🏗️ Architecture Overview

This application follows the **Pure Effect Service Pattern** with a clean component architecture that separates concerns and maintains scalability.

### Core Principles

- **Pure Effect Services**: All business logic lives in Effect.js services, not React hooks
- **Clean Component Structure**: Each component has a single responsibility
- **Type Safety**: Full TypeScript coverage with strict typing
- **Service-First Design**: React components are thin wrappers around Effect services

## 📁 Project Structure

```
apps/client/
├── src/
│   ├── components/           # UI Components (7 core components)
│   │   ├── AppShell/        # Application layout and structure
│   │   ├── ChatApp/         # Main chat orchestrator
│   │   ├── ChatArea/        # Message display area
│   │   ├── ChatContainer/   # Chat wrapper and configuration
│   │   ├── HeaderBar/       # Chat controls and status
│   │   ├── Toolbar/         # Application toolbar system
│   │   └── UserArea/        # User input and interactions
│   ├── services/            # Effect.js business logic services
│   │   ├── agent/          # Agent management and communication
│   │   ├── app/            # Application state and configuration
│   │   ├── chat/           # Chat functionality and messaging
│   │   ├── chat-runtime/   # Real-time chat operations
│   │   ├── config-lifecycle/ # Configuration management
│   │   ├── mdx/            # MDX processing and rendering
│   │   ├── toolbar/        # Toolbar state and commands
│   │   └── websocket/      # WebSocket communication
│   ├── hooks/              # React hooks (minimal, UI-focused only)
│   ├── stores/             # XState stores for UI state
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── __tests__/              # Integration tests
├── tests/                  # E2E tests (Playwright)
└── public/                 # Static assets and configurations
```

## 🧩 Component Architecture

### Core Chat Components

#### `ChatApp/` - Main Chat Orchestrator
- **Purpose**: Coordinates all chat functionality using Effect services
- **Pattern**: Pure Effect Service integration
- **Services**: `ChatService`, `AgentService`, `AppService`, `ToolbarService`
- **Features**: Message handling, agent communication, state management

#### `ChatArea/` - Message Display
- **Purpose**: Renders chat messages and conversation history
- **Features**: Auto-scrolling, message formatting, empty state handling
- **Integration**: Receives messages from `ChatService`

#### `HeaderBar/` - Chat Controls
- **Purpose**: Provides chat controls and status information
- **Features**: Expand/collapse, clear conversation, status indicators
- **Integration**: Toolbar commands and chat state

#### `UserArea/` - User Input
- **Purpose**: Handles user input and message composition
- **Features**: Message input, file attachments, agent selection
- **Components**: `MinimalInput`, `AttachmentBar`, `AgentToolBar`

### Infrastructure Components

#### `AppShell/` - Application Layout
- **Purpose**: Provides overall application structure
- **Features**: Toolbar integration, sidebar management, responsive layout
- **Components**: `AppShell`, `AppSidebar`, `AppToolbar`

#### `Toolbar/` - Command System
- **Purpose**: Extensible toolbar with dynamic commands
- **Features**: Command registration, state synchronization, responsive design
- **Pattern**: Command pattern with XState integration

#### `Chat/` - Container Wrapper
- **Purpose**: Chat configuration and layout coordination
- **Features**: Configuration management, theme application

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

#### Key Services

- **`ChatService`**: Message handling, conversation management
- **`AgentService`**: Agent communication and management
- **`AppService`**: Application configuration and state
- **`ConfigLifecycleService`**: Dynamic configuration management
- **`WebSocketService`**: Real-time communication
- **`ToolbarService`**: Toolbar state and command management

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

# Run E2E tests
bunx playwright test
```

### Development Workflow

1. **Services First**: Implement business logic in Effect services
2. **Component Integration**: Create React components that use services
3. **Type Safety**: Ensure full TypeScript coverage
4. **Testing**: Write integration and E2E tests
5. **Documentation**: Update relevant README files

## 🧪 Testing Strategy

### Integration Tests
- Service integration testing
- Component behavior testing
- Effect service testing with real dependencies

### E2E Tests (Playwright)
- Complete user workflows
- Chat functionality testing
- Cross-browser compatibility

### Testing Principles
- **No Mocking**: Tests use real external services
- **Real Dependencies**: Connect to actual APIs and services
- **Meaningful Tests**: Tests validate actual functionality

## 🎨 Styling and Theming

- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: Dynamic theming support
- **Responsive Design**: Mobile-first approach
- **Component Variants**: Consistent design system

## 🔌 Configuration

### Chat App Configurations
- Stored in `public/configs/`
- JSON-based configuration files
- Dynamic loading and hot-reloading
- Theme and agent configuration

### Environment Variables
- Clerk authentication configuration
- API endpoints and keys
- Development/production settings

## 📚 Key Patterns and Conventions

### Component Structure
```typescript
// Component with Effect service integration
export function MyComponent({ config }: MyComponentProps) {
  const [state, setState] = useState(initialState)
  
  const handleAction = useCallback(() => {
    Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* MyService
        const result = yield* service.performAction()
        setState(result)
      }).pipe(Effect.provide(serviceLayer))
    )
  }, [])

  return <div>{/* JSX */}</div>
}
```

### Service Definition
```typescript
export class MyService extends Effect.Service<MyServiceApi>()(
  "MyService",
  {
    scoped: Effect.gen(function* () {
      const dependency = yield* DependencyService
      
      const performAction = () =>
        Effect.gen(function* () {
      // Implementation
        }).pipe(
          Effect.mapError((cause) =>
            new MyServiceError({ message: "Action failed", cause })
          )
        )

      return { performAction } satisfies MyServiceApi
    }),
    dependencies: [DependencyService.Default],
  },
) {}
```

### Error Handling
```typescript
export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  readonly message: string
  readonly cause?: unknown
}> {}
```

## 🔄 State Management

### Effect Services
- Business logic and data management
- Cross-component state coordination
- Async operations and side effects

### XState Stores
- UI-specific state (sidebar open/closed, etc.)
- Component-local state management
- Reactive state updates

### React State
- Component-local UI state only
- Form inputs and temporary state
- No business logic in React state

## 🚦 Development Guidelines

### Do's ✅
- Use Effect services for all business logic
- Follow the MDX service pattern
- Write comprehensive tests
- Use TypeScript strictly
- Document complex functionality

### Don'ts ❌
- Mix React state with business logic
- Use Context.Tag (banned pattern)
- Skip error handling in services
- Create services without following MDX pattern
- Use mocking in tests

## 🔧 Build and Deployment

### Build Process
- Next.js production build
- TypeScript compilation
- Asset optimization
- Static generation where possible

### Deployment
- Vercel deployment ready
- Environment variable configuration
- Analytics integration
- Error boundary protection

## 📖 Additional Documentation

- [Service Pattern Documentation](src/docs/service-pattern.md)
- [Component Guidelines](src/components/README.md)
- [Testing Strategy](src/__tests__/README.md)
- [Configuration Management](src/services/config-lifecycle/README.md)

## 🤝 Contributing

1. Follow the established patterns
2. Write tests for new functionality
3. Update documentation
4. Ensure TypeScript compliance
5. Test across different browsers

## 📄 License

[Add your license information here]

---

**Built with ❤️ using Next.js, Effect.js, and TypeScript**
