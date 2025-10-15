# Testing Guide

## Overview

This guide covers all testing approaches in the buddy project, from unit tests to E2E tests, with special focus on Effect.ts patterns and resource management testing.

---

## Table of Contents

1. [Test Types](#test-types)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Resource Management Testing](#resource-management-testing)
6. [WebSocket Testing](#websocket-testing)
7. [Performance Testing](#performance-testing)
8. [@effect/vitest Usage](#effectvitest-usage)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Test Types

### File Naming Conventions

```
*.test.ts       # Unit tests (Vitest)
*.test.tsx      # React component unit tests (Vitest + Testing Library)
*.spec.ts       # E2E tests (Playwright) - excluded from Vitest
*.spec.tsx      # React E2E tests (Playwright)
```

### Test Organization

```
apps/client/
├── src/
│   └── features/
│       └── my-feature/
│           └── manager/
│               └── __tests__/
│                   └── my-manager.test.ts    # Unit tests
├── __tests__/
│   └── integration/
│       ├── README.md
│       ├── my-feature-integration.test.ts   # Integration tests
│       └── run-integration-tests.ts         # Test runner
└── e2e/
    └── my-feature.spec.ts                   # E2E tests
```

---

## Unit Testing

### Basic Unit Test Structure

```typescript
import { Effect, Layer } from "effect";
import { describe, expect, it, beforeEach } from "vitest";
import { MyManager } from "../service";

describe("MyManager", () => {
  const testLayer = Layer.merge(MyManager.Default, DependencyService.Default);

  it("should perform operation", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        const result = yield* manager.doSomething();
        return result;
      }).pipe(Effect.provide(testLayer))
    );

    expect(result).toBe(expectedValue);
  });
});
```

### Testing with State

```typescript
describe("MyManager State", () => {
  const testLayer = MyManager.Default;

  beforeEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        yield* manager.resetState();
      }).pipe(Effect.provide(testLayer))
    )
  );

  it("should update state atomically", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        
        yield* manager.updateState({ value: 42 });
        const state = yield* manager.getState();
        
        expect(state.value).toBe(42);
      }).pipe(Effect.provide(testLayer))
    );
  });
});
```

### Testing Error Handling

```typescript
import { MyError } from "../errors";

it("should handle errors correctly", async () => {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const manager = yield* MyManager;
      return yield* manager.riskyOperation();
    }).pipe(
      Effect.catchTag("MyError", (error) => 
        Effect.succeed({ error: error.message })
      ),
      Effect.provide(testLayer)
    )
  );

  expect(result.error).toBeDefined();
});
```

### Testing with TestClock

```typescript
import { TestClock } from "effect/TestClock";

it("should handle time-dependent logic", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* TestClock.setTime(1000);
      
      const manager = yield* MyManager;
      const timestamp = yield* manager.getTimestamp();
      
      expect(timestamp).toBe(1000);
    }).pipe(
      Effect.provide(Layer.merge(testLayer, TestClock.layer))
    )
  );
});
```

---

## Integration Testing

### Location and Structure

Integration tests live in `__tests__/integration/` and test multiple services working together.

### Integration Test Example

```typescript
// __tests__/integration/my-feature-integration.test.ts
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { ChatManager } from "@/features/chatapps/features/chatapp/managers";
import { ChatAppsManager } from "@/features/chatapps/manager";

const testLayer = Layer.mergeAll(
  ChatManager.Default,
  ChatAppsManager.Default
);

describe("ChatApp Communication Integration", () => {
  beforeEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;
        yield* chatManager.resetState();
        yield* chatAppsManager.resetState();
      }).pipe(Effect.provide(testLayer))
    )
  );

  it("should communicate between chat apps", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;

        // Register apps
        yield* chatAppsManager.registerChatApp("ws-1", "app-a", configA);
        yield* chatAppsManager.registerChatApp("ws-1", "app-b", configB);

        // Start conversations
        const convId = yield* chatManager.startConversation(
          "agent-a",
          undefined,
          configA
        );

        // Send message
        yield* chatManager.sendMessage(convId, "Hello");

        // Verify message received
        const messages = yield* chatManager.getMessages(convId);
        return messages;
      }).pipe(Effect.provide(testLayer))
    );

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Hello");
  });
});
```

### Running Integration Tests

```bash
# All integration tests
bun run test:integration

# Specific category
bun run test:integration:e2e
bun run test:integration:services
bun run test:integration:performance
bun run test:integration:websocket

# Specific test file
bunx vitest __tests__/integration/my-test.test.ts
```

### Integration Test Runner

The project includes a custom test runner at `__tests__/integration/run-integration-tests.ts`:

```bash
# Run with the custom runner
bun run __tests__/integration/run-integration-tests.ts

# Run specific suite
bun run __tests__/integration/run-integration-tests.ts "ChatApp E2E"
```

---

## E2E Testing

### Playwright Configuration

E2E tests use Playwright and are excluded from Vitest via file pattern `*.spec.ts`.

### E2E Test Example

```typescript
// e2e/chatapp.spec.ts
import { test, expect } from '@playwright/test';

test('should create and use chat app', async ({ page }) => {
  await page.goto('/');
  
  // Create workspace
  await page.click('[data-testid="create-workspace"]');
  await page.fill('[data-testid="workspace-name"]', 'Test Workspace');
  await page.click('[data-testid="save-workspace"]');
  
  // Create chat app
  await page.click('[data-testid="create-chatapp"]');
  await page.fill('[data-testid="chatapp-name"]', 'Test Chat');
  await page.click('[data-testid="save-chatapp"]');
  
  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello');
  await page.click('[data-testid="send-message"]');
  
  // Verify message appears
  await expect(page.locator('[data-testid="message"]')).toContainText('Hello');
});
```

### Running E2E Tests

```bash
# All E2E tests
bun e2e

# With Playwright UI
bunx playwright test --ui

# Specific test
bunx playwright test e2e/chatapp.spec.ts

# Debug mode
bunx playwright test --debug
```

---

## Resource Management Testing

### Why Resource Management Tests Matter

From EffectTalk 2025 patterns: All hooks and services that manage subscriptions MUST have resource management tests.

### Required Tests

```typescript
describe("useFeatureManager - Resource Management", () => {
  it("should clean up subscription on unmount", async () => {
    const { result, unmount } = renderHook(() => useFeatureManager());
    
    // Verify subscription is active
    expect(result.current.state).toBeDefined();
    
    // Unmount
    unmount();
    
    // Verify no updates after unmount
    // (Implementation depends on your testing setup)
  });

  it("should handle rapid mount/unmount cycles", async () => {
    for (let i = 0; i < 10; i++) {
      const { unmount } = renderHook(() => useFeatureManager());
      unmount();
    }
    
    // Verify no memory leaks or duplicate listeners
    // (Check internal state or use memory profiling)
  });

  it("should handle errors during subscription", async () => {
    // Mock service to throw error
    const { result } = renderHook(() => useFeatureManager());
    
    // Verify error is handled gracefully
    expect(result.error).toBeUndefined();
  });
});
```

### Service Subscription Tests

```typescript
describe("MyManager - Subscription API", () => {
  it("should return unsubscribe function", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        const unsubscribe = yield* manager.subscribe((state) => {
          console.log("State updated:", state);
        });
        
        // Unsubscribe should be a function
        expect(typeof unsubscribe).toBe("function");
        
        // Call unsubscribe
        unsubscribe();
      }).pipe(Effect.provide(testLayer))
    );
  });

  it("should stop updates after unsubscribe", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        let updateCount = 0;
        
        const unsubscribe = yield* manager.subscribe(() => {
          updateCount++;
        });
        
        // Trigger update
        yield* manager.updateState({ value: 1 });
        expect(updateCount).toBe(1);
        
        // Unsubscribe
        unsubscribe();
        
        // Trigger another update
        yield* manager.updateState({ value: 2 });
        
        // Should not have received update
        expect(updateCount).toBe(1);
      }).pipe(Effect.provide(testLayer))
    );
  });
});
```

---

## WebSocket Testing

### WebSocket Test Server

The project includes a WebSocket test server for integration testing.

### Starting the Test Server

```bash
# Start WebSocket test server
bun run start:ws

# Or start with dev server
bun run dev:full
```

### WebSocket Test Example

```typescript
import { WebSocket } from "ws";

describe("WebSocket Communication", () => {
  let ws: WebSocket;

  beforeEach(() => {
    ws = new WebSocket("ws://localhost:3001");
    return new Promise((resolve) => {
      ws.on("open", resolve);
    });
  });

  afterEach(() => {
    ws.close();
  });

  it("should send and receive messages", async () => {
    const messagePromise = new Promise((resolve) => {
      ws.on("message", (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    ws.send(JSON.stringify({ type: "test", payload: "hello" }));

    const response = await messagePromise;
    expect(response).toMatchObject({ type: "test" });
  });
});
```

### WebSocket Test Server Location

```
apps/client/src/services/websocket/__tests__/websocket-test-server.ts
```

---

## Performance Testing

### Performance Test Structure

```typescript
describe("Performance Tests", () => {
  it("should handle high message throughput", async () => {
    const startTime = Date.now();
    
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        
        // Send 1000 messages
        yield* Effect.forEach(
          Array.from({ length: 1000 }, (_, i) => i),
          (i) => manager.sendMessage(`Message ${i}`),
          { concurrency: "unbounded" }
        );
      }).pipe(Effect.provide(testLayer))
    );
    
    const duration = Date.now() - startTime;
    
    // Should complete in under 10 seconds
    expect(duration).toBeLessThan(10000);
    
    // Log performance metrics
    console.log(`Processed 1000 messages in ${duration}ms`);
    console.log(`Throughput: ${1000 / (duration / 1000)} messages/second`);
  });

  it("should handle concurrent operations", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* MyManager;
        
        // Run 100 concurrent operations
        yield* Effect.forEach(
          Array.from({ length: 100 }),
          () => manager.doOperation(),
          { concurrency: 10 }
        );
      }).pipe(Effect.provide(testLayer))
    );
  });
});
```

### Performance Benchmarks

From integration tests README:

- **Message Throughput**: >100 messages/second
- **Concurrent Apps**: Support for 100+ concurrent apps
- **Message Bus**: Handle 1000+ messages without degradation
- **Subscription Updates**: <2 seconds for 10 concurrent updates
- **App Lifecycle**: <5 seconds for 20 app register/unregister cycles

---

## @effect/vitest Usage

### Installation

Already installed in the project:

```json
{
  "devDependencies": {
    "@effect/vitest": "^0.23.13"
  }
}
```

### Basic Usage

```typescript
import { Effect } from "effect";
import { describe, it } from "@effect/vitest";

describe("MyManager with @effect/vitest", () => {
  it.effect("should run effect directly", () =>
    Effect.gen(function* () {
      const manager = yield* MyManager;
      const result = yield* manager.doSomething();
      
      // Assertions work directly in Effect.gen
      expect(result).toBe(expectedValue);
    })
  );
});
```

### With Layers

```typescript
import { it } from "@effect/vitest";

it.effect("should use test layer", () =>
  Effect.gen(function* () {
    const manager = yield* MyManager;
    const result = yield* manager.doSomething();
    expect(result).toBeDefined();
  }).pipe(Effect.provide(testLayer))
);
```

### Scoped Tests

```typescript
it.scoped("should handle scoped resources", () =>
  Effect.gen(function* () {
    const resource = yield* acquireResource();
    // Resource automatically cleaned up after test
    yield* useResource(resource);
  })
);
```

### Live Tests

```typescript
it.live("should use live services", () =>
  Effect.gen(function* () {
    // Uses actual implementations, not mocks
    const manager = yield* MyManager;
    yield* manager.doRealOperation();
  })
);
```

---

## Best Practices

### 1. Test Independence

✅ **DO**: Reset state before each test
```typescript
beforeEach(() =>
  Effect.runPromise(
    Effect.gen(function* () {
      const manager = yield* MyManager;
      yield* manager.resetState();
    }).pipe(Effect.provide(testLayer))
  )
);
```

❌ **DON'T**: Rely on test execution order

### 2. Use Descriptive Names

✅ **DO**: Describe what the test does
```typescript
it("should update workspace name when user provides valid input", ...)
```

❌ **DON'T**: Use vague names
```typescript
it("test 1", ...)
```

### 3. Test Real Scenarios

✅ **DO**: Test actual user workflows
```typescript
it("should allow user to create workspace, add chat app, and send message", ...)
```

❌ **DON'T**: Only test individual methods in isolation

### 4. Handle Async Properly

✅ **DO**: Use Effect.runPromise and await
```typescript
it("should handle async", async () => {
  await Effect.runPromise(...)
});
```

❌ **DON'T**: Forget async/await
```typescript
it("should handle async", () => {
  Effect.runPromise(...) // Missing await!
});
```

### 5. Clean Up Resources

✅ **DO**: Clean up in afterEach
```typescript
afterEach(() => {
  // Close connections, clear timers, etc.
});
```

### 6. Use Test Layers

✅ **DO**: Provide dependencies via layers
```typescript
const testLayer = Layer.mergeAll(
  MyManager.Default,
  MockDependency.Default
);
```

❌ **DON'T**: Create services directly

### 7. Test Error Cases

✅ **DO**: Test both success and failure paths
```typescript
it("should handle invalid input", async () => {
  await expect(
    Effect.runPromise(manager.doSomething("invalid"))
  ).rejects.toThrow();
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Hang or Timeout

**Problem**: Test never completes

**Solutions**:
- Ensure all Effects are provided with necessary layers
- Check for missing `await` on `Effect.runPromise`
- Verify no infinite loops in Effect.gen
- Check for unresolved promises

#### 2. State Pollution Between Tests

**Problem**: Tests pass individually but fail when run together

**Solutions**:
- Add proper `beforeEach` state reset
- Ensure services are properly scoped
- Check for global state mutations
- Use fresh layers for each test

#### 3. Resource Leaks

**Problem**: Memory usage grows during test runs

**Solutions**:
- Verify subscription cleanup
- Check for unclosed connections
- Ensure proper Effect.scoped usage
- Add resource management tests

#### 4. Flaky Tests

**Problem**: Tests pass/fail intermittently

**Solutions**:
- Add proper synchronization (avoid arbitrary timeouts)
- Use TestClock for time-dependent logic
- Check for race conditions
- Ensure proper cleanup

### Debugging Tools

```typescript
// Log Effect execution
Effect.gen(function* () {
  yield* Effect.log("Starting operation");
  const result = yield* manager.doSomething();
  yield* Effect.log("Result:", result);
  return result;
});

// Inspect state
const state = await Effect.runPromise(
  manager.getState().pipe(Effect.provide(testLayer))
);
console.log("Current state:", state);

// Measure timing
const startTime = Date.now();
await Effect.runPromise(...);
console.log(`Duration: ${Date.now() - startTime}ms`);
```

---

## Running Tests

### All Tests

```bash
bun test                    # All unit tests
bun run test:coverage       # With coverage report
```

### Specific Tests

```bash
bunx vitest path/to/test.test.ts           # Specific file
bunx vitest -t "test name pattern"         # Matching pattern
bunx vitest --watch                        # Watch mode
```

### Integration Tests

```bash
bun run test:integration                    # All integration
bun run test:integration:e2e                # E2E only
bun run test:integration:services           # Services only
bun run test:integration:performance        # Performance only
bun run test:integration:websocket          # WebSocket only
```

### E2E Tests

```bash
bun e2e                                     # All E2E tests
bunx playwright test                        # Same as above
bunx playwright test --ui                   # With UI
bunx playwright test --debug                # Debug mode
```

---

## Test Coverage

### Generating Coverage Reports

```bash
bun run test:coverage
```

### Coverage Requirements

- **Managers**: >80% coverage
- **Services**: >70% coverage
- **Hooks**: >60% coverage (including resource management tests)
- **Components**: >50% coverage

---

## Related Documentation

- [EffectProvider Guide](./EffectProvider-Guide.md) - Service initialization
- [MDX Pattern Cleanup](./MDX-Pattern-Cleanup.md) - Service structure
- [CLAUDE.md](../CLAUDE.md) - Architecture patterns
- [EFFECTTALK.md](./EFFECTTALK.md) - EffectTalk 2025 patterns

---

**Last Updated**: October 14, 2025
**Status**: Comprehensive Testing Guide
**Maintainer**: QA & Architecture Team
