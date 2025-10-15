# EffectProvider Guide

## Overview

`EffectProvider` is the critical infrastructure component that initializes and provides all Effect.ts services to your React application. It creates a memoized runtime with all services available throughout the component tree.

**Location**: `apps/client/src/components/EffectProvider.tsx`

---

## What is EffectProvider?

EffectProvider is a React component that:

1. **Initializes Services**: Creates instances of all Effect services
2. **Memoizes Layers**: Uses `Layer.memoize` to ensure services maintain state
3. **Provides Runtime**: Makes services available via `useEffectContext` hook
4. **Manages Lifecycle**: Handles service initialization and cleanup

Think of it as the "dependency injection container" for your React app.

---

## How It Works

### 1. Service Layer Composition

```typescript
const serviceLayer = Layer.mergeAll(
  ConfigService.Default,
  CoreManager.Default,
  ChatAppsManager.Default,
  ContextEngineeringManager.Default,
  HeaderManager.Default,
  UserAreaManager.Default,
  WorkspaceManager.Default,
  ApplicationManager.Default,
  WorkspaceComponent.Default,
);
```

All service layers are merged into a single layer that provides all dependencies.

### 2. Layer Memoization

```typescript
const initializeServices = Effect.scoped(
  Layer.memoize(serviceLayer).pipe(
    Effect.map((memoizedLayer) => ({
      runWithServices: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.provide(effect, memoizedLayer).pipe(Effect.runPromise),
      services: memoizedLayer,
    })),
  ),
);
```

**Why memoize?**
- Ensures services are singletons (only one instance)
- Preserves state across the application
- Prevents re-initialization on re-renders

### 3. React Integration

```typescript
export function EffectProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<EffectContextValue | null>(null);

  useEffect(() => {
    Effect.runPromise(initializeServices).then(setServices);
  }, []);

  if (!services) {
    return null; // Loading state
  }

  return (
    <EffectContext.Provider value={services}>{children}</EffectContext.Provider>
  );
}
```

Services are initialized once on mount and provided to all children.

---

## Using EffectProvider

### 1. Wrap Your App

```tsx
// app/layout.tsx or _app.tsx
import { EffectProvider } from '@/components/EffectProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EffectProvider>
          {children}
        </EffectProvider>
      </body>
    </html>
  );
}
```

### 2. Access Services in Components

```tsx
import { useEffectContext } from '@/components/EffectProvider';

export function MyComponent() {
  const { runWithServices } = useEffectContext();
  
  const handleClick = async () => {
    await runWithServices(
      Effect.gen(function* () {
        const workspaceManager = yield* WorkspaceManager;
        yield* workspaceManager.createWorkspace({ name: "New Workspace" });
      })
    );
  };
  
  return <button onClick={handleClick}>Create Workspace</button>;
}
```

---

## Adding a New Service

To add a new service to EffectProvider:

### Step 1: Create the Service

Follow the MDX pattern in your feature folder:

```typescript
// features/my-feature/manager/service.ts
export class MyFeatureManager extends Effect.Service<MyFeatureManagerApi>()(
  "MyFeatureManager",
  {
    effect: Effect.gen(function* () {
      // Implementation
      return { /* API methods */ } satisfies MyFeatureManagerApi;
    }),
    dependencies: [ConfigService.Default],
  }
) {}
```

### Step 2: Add to EffectProvider

```typescript
// components/EffectProvider.tsx
import { MyFeatureManager } from "@/features/my-feature/manager/service";

const serviceLayer = Layer.mergeAll(
  ConfigService.Default,
  CoreManager.Default,
  // ... existing services ...
  MyFeatureManager.Default, // Add your service here
);
```

### Step 3: Use in Components

```tsx
import { MyFeatureManager } from "@/features/my-feature/manager/service";

const { runWithServices } = useEffectContext();

await runWithServices(
  Effect.gen(function* () {
    const myFeature = yield* MyFeatureManager;
    yield* myFeature.doSomething();
  })
);
```

---

## Service Initialization Order

Services are initialized in **dependency order**, not the order they appear in `Layer.mergeAll`.

**Example**:
```typescript
Layer.mergeAll(
  ApplicationManager.Default,  // Depends on ConfigService
  ConfigService.Default,        // No dependencies
)
```

Effect automatically determines that `ConfigService` must be initialized before `ApplicationManager`.

### Circular Dependencies

❌ **Don't create circular dependencies**:
```typescript
// BAD: ServiceA depends on ServiceB, ServiceB depends on ServiceA
```

✅ **Extract shared logic to a third service**:
```typescript
// GOOD: Both depend on SharedService
```

---

## Commented Out Services

### ChatManager.Default

```typescript
// ChatManager.Default, // TODO: Fix ChatManager service
```

**Why commented out?**
- ChatManager may have initialization issues
- May have circular dependencies
- May need refactoring to match MDX pattern

**To fix**:
1. Check ChatManager dependencies
2. Ensure it follows MDX pattern
3. Test initialization in isolation
4. Uncomment and verify no errors

---

## Troubleshooting

### Service Not Available

**Error**: `Service "MyService" not found`

**Solution**: Add the service to `Layer.mergeAll` in EffectProvider

### Initialization Error

**Error**: Service fails to initialize

**Debug steps**:
1. Check service dependencies are listed correctly
2. Verify all dependencies are in EffectProvider
3. Check for circular dependencies
4. Test service in isolation

### State Not Persisting

**Problem**: Service state resets unexpectedly

**Solution**: Ensure `Layer.memoize` is used (it is by default)

### Multiple Instances

**Problem**: Getting different instances of the same service

**Solution**: 
- Don't create services outside EffectProvider
- Always use `yield* ServiceName` to access services
- Don't call `Service.Default` directly in components

---

## Best Practices

### 1. Initialize Early

Place EffectProvider as high in the component tree as possible:

```tsx
// ✅ GOOD: At root level
<EffectProvider>
  <App />
</EffectProvider>

// ❌ BAD: Deep in component tree
<App>
  <SomeComponent>
    <EffectProvider>
      <FeatureComponent />
    </EffectProvider>
  </SomeComponent>
</App>
```

### 2. Handle Loading State

EffectProvider returns `null` while initializing. Show a loading indicator:

```tsx
export function EffectProvider({ children }) {
  const [services, setServices] = useState<EffectContextValue | null>(null);
  
  useEffect(() => {
    Effect.runPromise(initializeServices).then(setServices);
  }, []);

  if (!services) {
    return <LoadingSpinner />; // Better UX
  }

  return (
    <EffectContext.Provider value={services}>{children}</EffectContext.Provider>
  );
}
```

### 3. Error Handling

Add error boundary around EffectProvider:

```tsx
<ErrorBoundary>
  <EffectProvider>
    <App />
  </EffectProvider>
</ErrorBoundary>
```

### 4. Testing

Mock EffectProvider in tests:

```tsx
// test-utils.tsx
export function TestEffectProvider({ children, mockServices }) {
  const mockLayer = Layer.mergeAll(...mockServices);
  
  return (
    <EffectContext.Provider value={createMockContext(mockLayer)}>
      {children}
    </EffectContext.Provider>
  );
}
```

---

## Advanced Patterns

### Conditional Services

Load services based on environment:

```typescript
const serviceLayer = Layer.mergeAll(
  ConfigService.Default,
  CoreManager.Default,
  ...(process.env.NODE_ENV === 'development' 
    ? [DebugService.Default] 
    : []
  ),
);
```

### Lazy Loading

Load heavy services only when needed:

```typescript
const [heavyService, setHeavyService] = useState(null);

const loadHeavyService = async () => {
  const service = await import('./heavy-service');
  setHeavyService(service.HeavyService.Default);
};
```

### Service Overrides

Override services for testing or feature flags:

```typescript
const serviceLayer = featureFlags.useNewWorkspaceManager
  ? Layer.mergeAll(
      ConfigService.Default,
      NewWorkspaceManager.Default, // Override
    )
  : Layer.mergeAll(
      ConfigService.Default,
      WorkspaceManager.Default, // Original
    );
```

---

## API Reference

### EffectContextValue

```typescript
interface EffectContextValue {
  readonly runWithServices: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ) => Promise<A>;
  readonly services: MemoizedLayer;
}
```

### useEffectContext

```typescript
function useEffectContext(): EffectContextValue
```

Throws error if used outside EffectProvider.

### runWithServices

```typescript
runWithServices<A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A>
```

Runs an Effect with all services provided. Returns a Promise that resolves with the result or rejects with the error.

---

## Migration Guide

### From Direct Service Usage

**Before**:
```typescript
const result = await Effect.runPromise(
  Effect.provide(myEffect, MyService.Default)
);
```

**After**:
```typescript
const { runWithServices } = useEffectContext();
const result = await runWithServices(myEffect);
```

### From Multiple Providers

**Before**:
```tsx
<ServiceA.Provider>
  <ServiceB.Provider>
    <ServiceC.Provider>
      <App />
    </ServiceC.Provider>
  </ServiceB.Provider>
</ServiceA.Provider>
```

**After**:
```tsx
<EffectProvider>
  <App />
</EffectProvider>
```

All services automatically available!

---

## Related Documentation

- [MDX Pattern Cleanup](./MDX-Pattern-Cleanup.md) - Service structure
- [CLAUDE.md](../CLAUDE.md) - Full architecture guide
- [Service Pattern Rules](../.cursor/rules/service-pattern.mdc) - Pattern rules

---

**Last Updated**: October 14, 2025
**Status**: Production Ready
**Maintainer**: Architecture Team
