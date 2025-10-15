# buddy

The refactored buddybuilder - A Next.js application built with Bun, React 19, Tailwind CSS v4, and Effect.ts, featuring a command-driven architecture with the Manager pattern.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) v1.3.1+
- **Framework**: Next.js 15.5+ with React 19.2+
- **Styling**: Tailwind CSS v4.1+, shadcn/ui
- **State Management**: Effect.ts v3.18+ with Manager pattern
- **Type Safety**: TypeScript 5.9+ with strict Effect types
- **Testing**: Vitest (unit), Playwright (E2E)
- **Monorepo**: Turbo
- **Auth**: Clerk (Next.js integration)

## Getting Started

### Installation

```bash
bun install
```

### Development

```bash
bun dev          # Start Next.js dev server
```

### Building

```bash
bun run build    # Build for production
bun start        # Run production build
```

## Development Commands

### Development Servers

```bash
bun run start:llm       # Start LLM server
bun run start:ws        # Start WebSocket test server
bun run dev:full        # Start both WebSocket and Next.js dev server
```

### Type Checking & Linting

```bash
bun run check-types    # TypeScript type checking
bun run lint           # Run Biome linter
bun run lint:fix       # Auto-fix linting issues
```

### Testing

```bash
# Unit Tests
bun test                           # Run all Vitest tests
bun run test:coverage              # Run with coverage
bunx vitest path/to/test.test.ts   # Run specific test

# Integration Tests
bun run test:integration                # All integration tests
bun run test:integration:e2e            # E2E tests only
bun run test:integration:services       # Service tests only
bun run test:integration:performance    # Performance tests
bun run test:integration:websocket      # WebSocket tests

# E2E Tests
bun e2e                           # Run Playwright tests
bunx playwright test              # Run all E2E tests
```

### Monorepo Commands

```bash
turbo run build    # Build all packages
turbo run test     # Run tests across workspace
bun run bump       # Bump package versions
```

## Architecture Overview

### Manager Pattern (MDX)

This codebase uses the **Manager Pattern** - Effect.ts services that own domain state and business logic. Every manager follows the MDX structure:

```
manager/
  ├── service.ts    # Effect.Service implementation
  ├── api.ts        # TypeScript interface
  ├── types.ts      # Domain types & validation
  ├── errors.ts     # Typed errors
  ├── commands.ts   # Optional: Commands
  └── index.ts      # Public exports
```

### Command-Driven Architecture

Advanced managers use a command queue pattern for async operations:
- Commands are validated Effect Schema classes
- Queued processing with `Queue.unbounded<Command>()`
- First-class, typed commands (not strings)

### Effect.ts Patterns

- **Dependency Injection**: Services declare dependencies, accessed via `yield*`
- **Typed Errors**: All errors extend `Data.TaggedError`
- **Pure Functions**: Business logic is pure, testable, composable
- **Effect Composition**: Use `Effect.gen`, `pipe`, and Effect combinators

### Feature Structure

```
features/
  feature-name/
    manager/        # Business logic (Effect.ts)
    components/     # UI components (React)
    container/      # React integration
    hooks/          # React hooks
    domain/         # Domain models
    ui-state/       # UI-specific state
    features/       # Nested sub-features
```

### React Integration

```
Manager (Effect.ts) → Hook → Container → UI Component
```

- **Managers**: Own domain state, business logic
- **Hooks**: Bridge Effect.ts to React
- **Containers**: Orchestration, loading/error states
- **Components**: Pure presentation

## Project Structure

```
buddy/
├── apps/
│   ├── client/          # Next.js application
│   ├── cli/             # CLI tools
│   └── form-editor/     # Form editor (in development)
├── packages/
│   ├── ui/              # Shared UI components
│   ├── agentkit/        # Agent integration
│   └── config/          # Shared configuration
└── _archived/           # Legacy code
```

## TypeScript Path Aliases

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

## Key Technologies

### Tailwind CSS v4

**Important**: Uses `@tailwindcss/postcss` package (not `tailwindcss` directly)

```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

Colors use HSL format with alpha values:
```typescript
primary: 'hsl(var(--primary) / <alpha>)'
```

### Effect.ts

Core patterns:
- Use `Effect.Service` for services (v3.18+)
- Use `Clock.currentTimeMillis` instead of `Date.now()`
- Use `Config.all()` for configuration access
- All async operations return `Effect<A, E, R>`
- Services are provided via `EffectProvider` in React apps

**EffectProvider Setup:**
```tsx
// Wrap your app at the root level
<EffectProvider>
  <App />
</EffectProvider>

// Access services in components
const { runWithServices } = useEffectContext();
await runWithServices(yourEffect);
```

See [EffectProvider Guide](./docs/EffectProvider-Guide.md) for details.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Comprehensive architecture guide for AI assistants
- **[.cursor/rules/](./.cursor/rules/)**: Development rules and patterns
  - `PROJECT_RULES.md`: Core development rules
  - `service-pattern.mdc`: Effect.ts service patterns
  - `TAILWIND_RULES.md`: Tailwind v4 configuration
  - `effect-pattern-rules.md`: Effect.ts coding patterns

## Contributing

1. Follow the Manager Pattern (MDX structure)
2. Use Effect.ts for all business logic
3. Write typed errors extending `Data.TaggedError`
4. Keep domain state in managers, UI state separate
5. Write tests with `*.test.ts` (unit) or `*.spec.ts` (E2E)
6. Use Biome for linting: `bun run lint:fix`

## License

Private project
