# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**buddy** is a Next.js application built with Bun, React 19, Tailwind CSS v4, and Effect.ts. It's a refactored version of buddybuilder that uses a command-driven architecture with the Manager pattern for state management and business logic.

## Commands

### Development
```bash
bun dev              # Start Next.js dev server
bun run dev          # Same as above (from root)
```

**IMPORTANT**: Never run the development server automatically. Always wait for explicit user instruction.

### Development Servers
```bash
bun run start:llm       # Start LLM server
bun run start:ws        # Start WebSocket test server
bun run dev:full        # Start both WebSocket and Next.js dev server
```

### Building & Type Checking
```bash
bun run build        # Build the Next.js app
bun run check-types  # Run TypeScript type checking
bun run typecheck    # Type check (from client dir)
```

### Linting
```bash
bun run lint         # Run Biome linter
bun run lint:fix     # Auto-fix linting issues with --unsafe flag
```

### Testing
```bash
bun test                                # Run all Vitest tests
bun run test:coverage                   # Run tests with coverage
bun run test:integration                # Run integration tests
bun run test:integration:e2e            # Run E2E integration tests only
bun run test:integration:services       # Run service integration tests only
bun run test:integration:performance    # Run performance tests
bun run test:integration:websocket      # Run WebSocket tests
```

Test files are organized as:
- `**/*.test.ts` or `**/*.test.tsx` - Unit tests (Vitest)
- `**/__tests__/**/*.test.{ts,tsx}` - Unit tests in __tests__ folders
- `**/*.spec.ts` or `**/*.spec.tsx` - E2E tests (Playwright, excluded from Vitest)

### Running Single Tests
```bash
bunx vitest path/to/test.test.ts           # Run specific test file
bunx vitest -t "test name pattern"         # Run tests matching pattern
bunx playwright test path/to/test.spec.ts  # Run specific E2E test
```

### Monorepo Management
```bash
turbo run build       # Build all packages
turbo run test        # Run tests across workspace
bun run bump          # Bump package versions
```

## Architecture

### The Manager Pattern (MDX Pattern)

**Managers are Effect.ts services that own domain state and business logic.** Every manager follows the strict MDX structure:

```
manager/
  ├── service.ts    # Effect.Service implementation with business logic
  ├── api.ts        # TypeScript interface defining public methods
  ├── types.ts      # Domain types, constants, validation
  ├── errors.ts     # Domain-specific Data.TaggedError definitions
  ├── commands.ts   # Optional: Command definitions for command-driven managers
  └── index.ts      # Barrel export
```

**State Management:**
- Use `Ref.make()` for mutable state containers
- State updates are atomic via `Ref.updateAndGet`
- Subscribe pattern for reactive state changes
- State lives in the service, not in React

**Service Declaration Pattern:**
```typescript
export class ManagerName extends Effect.Service<ApiInterface>()("ServiceTag", {
  effect: Effect.gen(function* () {
    const dependency = yield* DependencyService;
    const stateRef = yield* Ref.make(initialState);

    return {
      method: () => Effect.gen(function* () { /* implementation */ }),
    } satisfies ApiInterface;
  }),
  dependencies: [DependencyService],
}) {}
```

**CRITICAL**:
- NO Context.Tag pattern (banned since v3.14 - see `.cursor/rules/service-pattern.mdc`)
- NO split Effect implementation (no separate layer.ts files)
- OK to split domain concerns (api.ts, errors.ts, types.ts)
- Single Effect.Service class in service.ts
- Use Effect.Service pattern (v3.18+)

### Command-Driven Architecture

Advanced managers (like ChatAppsManager) use a command queue pattern:

```typescript
// 1. Define commands as Effect Schema classes
export class RegisterApp extends S.Class<RegisterApp>("RegisterApp")({
  _tag: S.Literal("RegisterApp"),
  workspaceId: S.String,
  appId: S.String,
}) {}

// 2. Create command queue and processing loop
const commandQueue = yield* Queue.unbounded<Command>();
yield* Effect.fork(
  Effect.forever(
    Effect.gen(function* () {
      const command = yield* Queue.take(commandQueue);
      yield* handleCommand(command);
    })
  )
);

// 3. Dispatch method
const dispatch = (cmd: Command) => Queue.offer(commandQueue, cmd);
```

### Effect.ts Core Patterns

**Dependency Injection:**
- Services declare dependencies in `dependencies` array
- Access via `yield* ServiceName` in Effect.gen
- Runtime provides dependencies automatically
- Services provided via EffectProvider in React apps

**Error Handling:**
- All errors extend `Data.TaggedError("ErrorName")`
- Errors are typed: `Effect<Success, Error, Requirements>`
- Use `Effect.mapError` to transform between layers
- Include context (operation, cause, ids) in errors

**Effect Composition:**
- `Effect.gen` for sequential operations (like async/await)
- `pipe` for functional composition
- `Effect.try` for exception-prone code
- `Effect.catchAll` for error recovery
- `Effect.mapError` for error transformation

**Configuration & Time:**
- Use `Config.all()` for configuration access in context
- Use `Clock.currentTimeMillis` instead of `Date.now()` (enables TestClock in tests)
- Never hard-code config values or use direct system calls

**State Management (EffectTalk 2025 Patterns):**
- Use `Ref.make()` for mutable state containers
- **Atomic updates**: Use `Ref.modify` for multi-step operations to prevent race conditions
- **Single source of truth**: Each manager is canonical source for its entities
- **Reference by ID**: Cross-entity relationships use IDs, never embedded objects
- Subscribe pattern for reactive state changes
- No duplicate state across managers

**Example - Atomic State Update:**
```typescript
const addAgent = (agent: Agent) =>
  Ref.modify(stateRef, (state) => {
    const newAgents = { ...state.agents, [agent.id]: agent };
    return [Effect.succeed(undefined), { ...state, agents: newAgents }];
  }).pipe(Effect.flatten);
```

**Example - Reference by ID:**
```typescript
// ✅ GOOD: Store IDs only
const workspace = {
  id: "ws-1",
  chatAppIds: ["app-1", "app-2"]  // IDs, not full objects
}

// ❌ BAD: Duplicate objects
const workspace = {
  id: "ws-1",
  chatApps: [{ id: "app-1", ... }, ...]  // Duplicated state
}
```

### Feature Organization

Features use a **recursive nested pattern** where features can contain sub-features:

```
features/
  feature-name/
    manager/              # Effect.ts service (MDX pattern)
    components/           # Pure React UI components
    hooks/                # React hooks wrapping manager
    domain/               # Domain models (pure data structures)
    ui-state/             # UI-specific state models
    types/                # Type definitions
    errors/               # Error definitions
    features/             # Nested sub-features (recursive!)
      sub-feature/
        manager/
        components/
        features/         # Can nest 3-4 levels deep
```

**Real Example** (3 levels deep):
```
features/chatapps/                    # Level 0: Collection manager
  manager/                            # ChatAppsManager
  features/                           # Level 1
    chatapp/                          # Individual chat app
      managers/                       # ChatManager
      features/                       # Level 2
        chatarea/managers/            # ChatAreaManager
        context-engineering/managers/ # ContextEngineeringManager
        userarea/managers/            # UserAreaManager
```

**Key Conventions:**
- Features nest to mirror domain hierarchy (collection → item → sub-components)
- Maximum recommended depth: 3-4 levels
- Both `manager/` (singular) and `managers/` (plural) are used
- Domain state lives in managers, UI state in `ui-state/`
- UI components are pure, receive data via props only
- Child features access parent via dependency injection

See `docs/Feature-Structure-Guide.md` for complete nested features documentation.

### React Integration Pattern

**Layered Architecture:**
```
Manager (Effect.ts) → Hook → Container → UI Component
```

**EffectProvider:**

All services are initialized and provided via `EffectProvider` at the app root:

```typescript
// App root
<EffectProvider>
  <App />
</EffectProvider>

// Access services in components
const { runWithServices } = useEffectContext();

await runWithServices(
  Effect.gen(function* () {
    const manager = yield* WorkspaceManager;
    yield* manager.createWorkspace({ name: "New" });
  })
);
```

See `docs/EffectProvider-Guide.md` for complete documentation.

**Hook Pattern (with proper cleanup):**
```typescript
export function useFeatureManager() {
  const [state, setState] = useState(initialState);
  const { runWithServices } = useEffectContext();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = Effect.runSync(
      manager.subscribe((newState) => setState(newState))
    );
    unsubscribeRef.current = unsub;
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const operation = useCallback(() => {
    runWithServices(manager.someOperation());
  }, [runWithServices]);

  return { state, operation };
}
```

**Critical**: Always use `useRef` for cleanup functions, never closure variables.

**Responsibilities:**
- **Manager**: Business logic, domain state (Effect.ts)
- **Hook**: Bridge to React, run Effects, manage subscriptions
- **Container**: Loading/error/empty states, orchestration
- **UI Component**: Pure presentation, props only, reusable

### Service Layer

Located in `apps/client/src/services/`, services follow MDX pattern for cross-cutting concerns:

**Services vs Managers:**
- **Services**: Cross-cutting, reusable, external integrations (ConfigService, ChatService, AgentKitService)
  - Live in `services/*/`
  - Reusable across features
  - Often stateless or minimal state
- **Managers**: Feature-specific business logic, own domain state (ChatManager, WorkspaceManager)
  - Live in `features/*/manager/`
  - Feature-specific
  - Own domain state via Ref

Both use `Effect.Service` with proper lifecycle management.

See `docs/Service-vs-Manager-Guide.md` for complete naming guidelines and decision tree.

### TypeScript Path Aliases

Configured in `tsconfig.base.json`:
```typescript
@/*            → ./src/*
@/components/* → ./src/components/*
@/lib/*        → ./src/lib/*
@/utils/*      → ./src/utils/*
@/types/*      → ./src/types/*
@/domain/*     → ./src/domain/*
@/managers/*   → ./src/managers/*
@/services/*   → ./src/services/*
@/ui-state/*   → ./src/ui-state/*
@buddy/ui      → ../../packages/ui/src
@buddy/agentkit → ../../packages/agentkit
```

## Tailwind CSS v4 Configuration

**IMPORTANT**: This project uses Tailwind CSS v4 with specific setup requirements.

**Package Management:**
- Use `@tailwindcss/postcss` package (NOT `tailwindcss` directly)
- Install: `bun add -d @tailwindcss/postcss`
- Remove any `bun-plugin-tailwind` references

**PostCSS Config:**
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Color System:**
- Use HSL format for all colors
- Include `<alpha>` in color definitions:
  ```typescript
  primary: 'hsl(var(--primary) / <alpha>)'
  ```
- Define CSS variables in `globals.css` for both light/dark themes
- Use semantic color variables, not hard-coded values

**Development:**
- Run dev server: `bun run dev`
- Proper content paths ensure JIT compilation works
- Monitor build output for configuration issues

## Key Architectural Principles

1. **Effect.ts is Central**: All state management, async operations, and business logic use Effect.ts patterns
2. **Strong Typing**: Extensive use of discriminated unions, branded types, Effect signatures
3. **Separation of Concerns**: Clear boundaries between domain, UI, and integration layers
4. **Command-Driven**: Complex managers use validated command queues for async operations
5. **Pure Functions**: Business logic is pure, testable, and composable
6. **Typed Errors**: Domain-specific errors throughout, no generic Error throwing
7. **Reactive State**: Subscribe pattern for React integration, immutable updates
8. **Schema Validation**: Effect Schema for runtime validation and type safety

## Common Patterns to Follow

### Creating a New Manager
1. Create `manager/` folder with MDX structure (service, api, types, errors, index)
2. Extend `Effect.Service<Api>()` with proper dependencies
3. Use `Ref.make()` for state, `Effect.gen` for operations
4. Define typed errors extending `Data.TaggedError`
5. Export public API through index.ts

### Creating a New Feature
1. Create feature folder with `manager/`, `components/`, `container/`, `hooks/`
2. Implement manager first (business logic)
3. Create hook to bridge to React
4. Build container for orchestration
5. Create pure UI components

### Adding Tests

**Unit Tests:**
- File pattern: `*.test.ts` or `*.test.tsx`
- Use `Effect.runPromise` to run effects in tests
- Use `TestClock` for time-dependent logic
- Use `Layer.provide` to inject test dependencies

**Resource Management Tests (Required for hooks/services):**
```typescript
describe("useFeatureManager", () => {
  it("should clean up subscription on unmount", async () => {
    const { unmount } = renderHook(() => useFeatureManager());
    unmount();
    // Verify no updates after unmount
  });
  
  it("should handle rapid mount/unmount cycles", async () => {
    // Test for memory leaks and duplicate listeners
  });
});
```

**Integration Tests:**
- Location: `__tests__/integration/`
- Test categories: e2e, services, performance, websocket

**E2E Tests:**
- File pattern: `*.spec.ts` or `*.spec.tsx`
- Use Playwright for browser automation

### Error Handling
```typescript
// Define domain error
export class FeatureError extends Data.TaggedError("FeatureError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

// Use in Effect
Effect.gen(function* () {
  const result = yield* riskyOperation.pipe(
    Effect.mapError((e) => new FeatureError({ operation: "doThing", cause: e }))
  );
});
```

## Important Rules

### Core Patterns
1. **Never run dev server automatically** - wait for explicit user instruction
2. **No Context.Tag pattern** - use Effect.Service (v3.18+) only
3. **Always use Clock service** - never `Date.now()` directly
4. **Use Tailwind v4 patterns** - `@tailwindcss/postcss`, HSL colors with alpha
5. **Follow MDX pattern** - Split domain concerns, single Effect.Service class

### State Management (EffectTalk 2025)
6. **Single source of truth** - each manager is canonical for its entities
7. **Reference by ID** - cross-entity relationships use IDs, not embedded objects
8. **Atomic state updates** - use `Ref.modify` for multi-step operations
9. **Separate domain and UI state** - managers own domain, ui-state for presentation

### Error Handling & Async
10. **Type all errors** - extend Data.TaggedError, include context
11. **Use Effect for all async** - no raw Promises in business logic
12. **Map all errors** - transform to domain-specific errors

### React Integration
13. **Clean up subscriptions** - use `useRef` for cleanup, never closures
14. **Test resource management** - verify cleanup, no leaks, no duplicate listeners
15. **Use EffectProvider** - access services via `useEffectContext`

### Anti-Patterns to Avoid
- ❌ Never duplicate entity state across managers
- ❌ Never update state outside atomic operations
- ❌ Never use closure variables for resource cleanup
- ❌ Never skip error handling or cleanup in tests
- ❌ Never use raw promises or throw errors in Effect code

See `docs/EFFECTTALK.md` for complete EffectTalk philosophy and patterns.
