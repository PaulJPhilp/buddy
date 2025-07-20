# ChatApp Communication Test Suite

This directory contains a comprehensive test suite for the chatapp communication functionality in the Buddy application. The test suite covers all aspects of inter-chatapp communication, including message passing, subscription management, error handling, and performance testing.

## Test Files Overview

### 1. `chatapp-communication.test.ts`
**Main integration test suite covering core communication functionality**

- **Basic Message Passing**: Tests fundamental message exchange between chatapps
- **Message Bus Direct Testing**: Tests the underlying PubSub message bus
- **Subscription Configuration**: Tests various subscription scenarios
- **Complex Multi-App Scenarios**: Tests circular subscriptions and message chains
- **Error Handling**: Tests edge cases and error conditions
- **Performance**: Tests concurrency and rapid message handling

### 2. `chatapp-message-bus.test.ts`
**Focused tests for the message bus infrastructure**

- **Message Publishing**: Tests message publication to the bus
- **Message Subscription**: Tests subscribing to and receiving messages
- **Message Ordering**: Tests message delivery order and concurrency
- **Message Filtering**: Tests message validation and filtering
- **Error Handling**: Tests bus error recovery and resilience
- **Performance**: Tests high-throughput message processing

### 3. `chatapp-subscription-config.test.ts`
**Detailed tests for subscription configuration and management**

- **Basic Configuration**: Tests simple subscription setup
- **Subscription Filtering**: Tests message filtering based on subscriptions
- **MaxTurns Configuration**: Tests turn limits and enforcement
- **Turn Counting**: Tests turn tracking and reset behavior
- **Dynamic Updates**: Tests runtime subscription changes

### 4. `chatapp-error-handling.test.ts`
**Comprehensive error handling and edge case testing**

- **Invalid Messages**: Tests handling of malformed or invalid messages
- **Subscription Errors**: Tests error scenarios in subscription management
- **Concurrent Access**: Tests concurrent operation error handling
- **Resource Cleanup**: Tests cleanup during app lifecycle events
- **Message Bus Recovery**: Tests recovery from bus errors
- **Edge Cases**: Tests unusual but valid scenarios

### 5. `chatapp-performance.test.ts`
**Performance and scalability testing**

- **Message Throughput**: Tests high-volume message processing
- **Concurrent Operations**: Tests concurrent app and message operations
- **Memory Management**: Tests resource usage with large payloads
- **Scalability**: Tests performance with increasing numbers of apps

### 6. `chatapp-subscriptions.test.ts`
**Original subscription test (legacy)**

- Basic subscription functionality tests
- Turn limit enforcement tests
- Message loop prevention tests

## Key Testing Patterns

### Effect.ts Integration
All tests use Effect.ts patterns for:
- Async operations with `Effect.gen`
- Error handling with `Effect.catchAll`
- Resource management with proper cleanup
- Concurrent operations with `Effect.forEach`

### Test Layer Setup
```typescript
const testLayer = Layer.mergeAll(ChatManager.Default, ChatAppsManager.Default);
```

### State Management
Each test properly resets state before execution:
```typescript
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
```

## Core Communication Architecture

### Message Bus (`ChatAppBusMessage`)
```typescript
interface ChatAppBusMessage {
  readonly sourceAppId: string;
  readonly message: ChatMessage;
}
```

### Subscription Configuration
```typescript
interface SubscriptionConfig {
  appId: string;
  maxTurns?: number;
}
```

### Message Flow
1. **Source App** sends message via `ChatManager.sendMessage()`
2. **Message Bus** receives message via `ChatAppsManager.publishMessage()`
3. **Subscriber Apps** receive message if:
   - They have an active subscription to the source app
   - They are the currently active conversation
   - They haven't exceeded maxTurns limit
   - The message sender is "assistant" (not "user")

## Test Execution

### Running All Tests
```bash
bun test apps/client/__tests__/integration/chatapp-*.test.ts
```

### Running Specific Test Suites
```bash
# Core communication tests
bun test apps/client/__tests__/integration/chatapp-communication.test.ts

# Message bus tests
bun test apps/client/__tests__/integration/chatapp-message-bus.test.ts

# Subscription configuration tests
bun test apps/client/__tests__/integration/chatapp-subscription-config.test.ts

# Error handling tests
bun test apps/client/__tests__/integration/chatapp-error-handling.test.ts

# Performance tests
bun test apps/client/__tests__/integration/chatapp-performance.test.ts
```

### Test Environment Configuration
Tests use the Vitest configuration from `apps/client/vitest.config.ts` with:
- Node.js environment for most tests
- Playwright environment for UI-related tests
- Shared test setup from `vitest.setup.shared.ts`

## Performance Benchmarks

### Expected Performance Metrics
- **Message Throughput**: >100 messages/second
- **Concurrent Apps**: Support for 100+ concurrent apps
- **Message Bus**: Handle 1000+ messages without degradation
- **Subscription Updates**: <2 seconds for 10 concurrent updates
- **App Lifecycle**: <5 seconds for 20 app register/unregister cycles

### Memory Usage
- **Large Messages**: Handle 50KB+ messages efficiently
- **Sustained Load**: Maintain performance over extended periods
- **Resource Cleanup**: Proper cleanup on app unregistration

## Error Handling Coverage

### Message Validation
- Malformed message structures
- Missing required fields
- Invalid message content
- Timestamp handling

### Subscription Management
- Non-existent app subscriptions
- Circular subscription references
- Dynamic configuration changes
- Turn limit enforcement

### Concurrency
- Concurrent message publishing
- Concurrent app registration/unregistration
- Race conditions in subscription updates
- Resource contention

### Recovery
- Message bus error recovery
- Subscriber error handling
- State reset during active operations
- Cleanup on unexpected failures

## Best Practices for Adding Tests

### 1. Follow Existing Patterns
- Use Effect.ts patterns consistently
- Include proper state cleanup
- Use descriptive test names
- Group related tests in describe blocks

### 2. Test Real Scenarios
- Test actual user workflows
- Include edge cases and error conditions
- Test performance under realistic loads
- Verify cleanup and resource management

### 3. Maintain Test Independence
- Each test should be independent
- Use proper setup/teardown
- Avoid test order dependencies
- Clean up resources after tests

### 4. Performance Considerations
- Include timing assertions where appropriate
- Test scalability with increasing loads
- Verify memory usage patterns
- Test sustained operation scenarios

## Debugging Test Failures

### Common Issues
1. **Timing Issues**: Use appropriate `Effect.sleep()` delays
2. **State Pollution**: Ensure proper state reset in beforeEach
3. **Resource Leaks**: Verify proper cleanup in Effect.fork operations
4. **Concurrency Issues**: Use proper synchronization patterns

### Debugging Tools
- Console logging in Effect.gen functions
- State inspection via manager APIs
- Message bus monitoring
- Performance timing measurements

## Contributing

When adding new tests:
1. Follow the existing file structure and naming conventions
2. Include comprehensive error handling tests
3. Add performance benchmarks for new features
4. Update this README with new test descriptions
5. Ensure all tests pass before submitting changes

## Related Documentation

- [Architecture.md](../../docs/Architecture.md) - Overall system architecture
- [ChatApp Design](../../docs/archive/Buddy-ChatApp-Design-v1.md) - ChatApp design patterns
- [Effect.ts Documentation](https://effect.website/) - Effect.ts patterns and best practices 