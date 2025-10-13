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
bun test                           # Run all Vitest tests
bun run test:coverage              # Run tests with coverage
bun run test:integration           # Run integration tests
bun run test:integration:e2e       # Run E2E integration tests only
bun run test:integration:services  # Run service integration tests only
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
- NO Context.Tag pattern (banned - see `.cursor/rules/service-pattern.mdc`)
- NO split api/service/layer files for simple services
- Single class with identifier and implementation
- Use Effect.Service pattern (v3.14+)

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

### Feature Organization

```
features/
  feature-name/
    manager/              # Effect.ts service (MDX pattern)
    components/           # Pure React UI components
    container/            # React integration layer
    hooks/                # React hooks wrapping manager
    domain/               # Domain models (pure data structures)
    ui-state/             # UI-specific state models (window positions, styles, visibility)
    utils/                # Feature-specific utilities
    features/             # Nested sub-features (recursive)
```

**Key Conventions:**
- Features can nest recursively (e.g., `chatapps/features/chatapp/features/chatarea/`)
- Domain state lives in managers, UI state in `ui-state/`
- Containers bridge React and Effect.ts via hooks
- UI components are pure, receive data via props only

### React Integration Pattern

**Layered Architecture:**
```
Manager (Effect.ts) → Hook → Container → UI Component
```

**Hook Pattern:**
```typescript
export function useFeatureManager() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const unsub = Effect.runSync(
      manager.subscribe((newState) => setState(newState))
    );
    return unsub;
  }, []);

  const operation = useCallback(() => {
    Effect.runPromise(manager.someOperation());
  }, []);

  return { state, operation };
}
```

**Responsibilities:**
- **Manager**: Business logic, domain state (Effect.ts)
- **Hook**: Bridge to React, run Effects, manage subscriptions
- **Container**: Loading/error/empty states, orchestration
- **UI Component**: Pure presentation, props only, reusable

### Service Layer

Located in `apps/client/src/services/`, services follow MDX pattern for cross-cutting concerns:

**Services vs Managers:**
- **Services**: Cross-cutting, reusable, external integrations (ConfigService, ChatService, AgentKitService)
- **Managers**: Feature-specific business logic, own domain state

Services use `Effect.Service` with proper lifecycle management.

### TypeScript Path Aliases

Configured in `apps/client/tsconfig.json`:
```typescript
@/*            → ./src/*
@client/*      → ./src/*
@app/*         → ./src/app/*
@components/*  → ./src/components/*
@domain/*      → ./src/domain/*
@managers/*    → ./src/managers/*
@services/*    → ./src/services/*
@utils/*       → ./src/utils/*
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
- Unit tests: `*.test.ts` files, use `Effect.runPromise` in tests
- Use `TestClock` for time-dependent logic
- Use `Layer.provide` to inject test dependencies
- Integration tests: `__tests__/integration/`
- E2E tests: `*.spec.ts` files with Playwright

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

1. **Never run dev server automatically** - wait for explicit user instruction
2. **No Context.Tag pattern** - use Effect.Service (v3.14+) only
3. **Always use Clock service** - never `Date.now()` directly
4. **Use Tailwind v4 patterns** - `@tailwindcss/postcss`, HSL colors with alpha
5. **Follow MDX pattern** - service.ts, api.ts, types.ts, errors.ts, index.ts
6. **Separate domain and UI state** - managers own domain, ui-state for presentation
7. **Use Effect for all async** - no raw Promises in business logic
8. **Type all errors** - extend Data.TaggedError, include context
