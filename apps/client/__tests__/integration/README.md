# Chat Integration Test Suite

This directory contains comprehensive integration tests for the ChatApp message flow, covering the complete pipeline from user input to response display.

## 📋 Test Coverage

### 1. **ChatApp E2E Tests** (`chat-app-flow.test.ts`)
**Purpose**: End-to-end testing of the complete ChatApp React component

**What it tests**:
- ✅ Full React component rendering with all services
- ✅ User input → message sending → response display flow
- ✅ Real-time typing indicators and streaming responses
- ✅ Multiple message exchanges in sequence
- ✅ Clear chat functionality
- ✅ Expand/collapse and close functionality
- ✅ Error handling for WebSocket connection failures
- ✅ Markdown content processing and display

**Technology**: React Testing Library + MockWebSocket

### 2. **Chat Services Tests** (`chat-services-flow.test.ts`)
**Purpose**: Integration testing of the Effect services layer without React

**What it tests**:
- ✅ ChatService initialization and state management
- ✅ Message flow through Effect services pipeline
- ✅ WebSocket service integration and message handling
- ✅ Message stream processing and queue management
- ✅ Concurrent message handling and order preservation
- ✅ Typing state management during processing
- ✅ Clear history functionality at service level
- ✅ MDX compilation integration
- ✅ Input validation and error handling

**Technology**: Pure Effect.ts runtime with mock services

### 3. **Performance Tests** (`chat-performance.test.ts`)
**Purpose**: Stress testing and performance validation under high load

**What it tests**:
- ✅ Rapid message sending (100+ messages concurrently)
- ✅ High-frequency stream consumption
- ✅ Multiple concurrent chat sessions (10+ simultaneous)
- ✅ Memory efficiency with large message histories (1000+ messages)
- ✅ Rapid state updates (500+ operations)
- ✅ Queue pressure handling without message loss
- ✅ Sustained load performance (50 msg/sec for 5+ seconds)

**Technology**: Performance-optimized mock services with metrics

### 4. **WebSocket Protocol Tests** (`chat-flow.test.ts`)
**Purpose**: Low-level protocol testing with live agent communication

**What it tests**:
- ✅ WebSocket connection establishment
- ✅ Message protocol compatibility with LLM agent
- ✅ Raw message sending and receiving
- ✅ Protocol message type handling
- ✅ Connection error scenarios

**Technology**: Real WebSocket connections (requires live agent)

## 🚀 Running Tests

### Run All Integration Tests
```bash
bun run test:integration
```

### Run Specific Test Suites
```bash
# E2E React component tests
bun run test:integration:e2e

# Effect services tests
bun run test:integration:services

# Performance/stress tests
bun run test:integration:performance

# WebSocket protocol tests
bun run test:integration:websocket
```

### Manual Test Execution
```bash
# Individual test files
bun test __tests__/integration/chat-app-flow.test.ts
bun test __tests__/integration/chat-services-flow.test.ts
bun test __tests__/integration/chat-performance.test.ts
bun test __tests__/integration/chat-flow.test.ts
```

## 🔧 Test Configuration

### Timeouts
- **E2E Tests**: 30 seconds (React rendering + async operations)
- **Services Tests**: 20 seconds (Effect runtime operations)
- **Performance Tests**: 60 seconds (stress testing scenarios)
- **WebSocket Tests**: 45 seconds (network communication)

### Mock Services
All tests use controlled mock services except WebSocket protocol tests:

- **MockWebSocketService**: Simulates agent responses with configurable delays
- **MockConfigService**: Provides test configuration values
- **MockMdxService**: Simple markdown processing for testing

### Test Helpers (`test-helpers.ts`)
Shared utilities for consistent testing:
- `createTestLayer()`: Creates complete service layer for testing
- `TestUtils`: Common operations (waitFor, measureTime, etc.)
- `TestAssertions`: Standardized assertions for message flows

## 📊 Data Flow Testing

### Complete Message Flow
```
User Input → ChatApp → ChatService → WebSocketService → Mock Agent
                ↓                              ↑
            React State ← MessageStream ← Response Processing
```

### What Each Test Validates

1. **Input Validation**: Message length, content safety, format
2. **Service Communication**: Effect service composition and dependencies  
3. **WebSocket Protocol**: Message types, streaming, error handling
4. **State Management**: React state sync with Effect services
5. **Stream Processing**: Real-time message updates via Effect streams
6. **Error Handling**: Connection failures, validation errors, timeout handling
7. **Performance**: Memory usage, throughput, concurrent operations

## 🎯 Test Patterns

### Effect Service Testing
```typescript
const result = await Effect.runPromise(testRuntime)(
  Effect.gen(function* () {
    const chatService = yield* ChatService;
    yield* chatService.initialize("test-chat");
    yield* chatService.sendMessage("Hello");
    return yield* chatService.getState();
  })
);
```

### React Component Testing
```typescript
render(<ChatApp config={testConfig} />);
fireEvent.change(messageInput, { target: { value: "Test message" } });
fireEvent.click(sendButton);
await waitFor(() => {
  expect(screen.getByText("Test message")).toBeInTheDocument();
});
```

### Stream Testing
```typescript
const streamMessages = yield* TestUtils.collectStreamMessages(
  chatService.messageStream,
  1000 // Collect for 1 second
);
```

## 🔍 Debugging Integration Tests

### Enable Debug Logging
All tests include console.log statements for debugging:
```bash
bun test __tests__/integration/chat-app-flow.test.ts --reporter=verbose
```

### Common Issues

1. **Timeout Errors**: Increase test timeouts if operations take longer
2. **State Sync Issues**: Check that React state updates match service state
3. **Mock Service Delays**: Adjust `responseDelay` in mock configurations
4. **Memory Leaks**: Ensure Effect fibers are properly interrupted

### Debugging Tools
- `TestUtils.measureTime()`: Track operation performance
- `TestAssertions.assertMessageFlowCompleted()`: Validate end states
- Console logging in mock services shows message flow

## 📈 Performance Benchmarks

### Expected Performance Metrics
- **Message Sending**: >100 msg/sec for rapid burst
- **Stream Processing**: <1ms per message processing time
- **Memory Usage**: <10KB per message in memory
- **Concurrent Sessions**: 10+ simultaneous chat sessions
- **Error Rate**: <5% under normal load, 0% under light load

### Performance Test Output
```
Sent 100 messages in 1234ms (81.03 msg/sec)
Stream processed 247 messages
Average stream processing time: 0.203ms per message
Memory increase: 8.5MB (4.2KB per message)
```

## 🛡️ Error Scenarios Tested

1. **WebSocket Connection Failures**
2. **Message Validation Errors** (empty, too long, unsafe content)
3. **Service Initialization Failures**
4. **Stream Processing Errors**
5. **Concurrent Operation Conflicts**
6. **Memory Pressure Conditions**
7. **Network Timeout Scenarios**

## 🚦 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Integration Tests
  run: bun run test:integration
  timeout-minutes: 10
```

### Exit Codes
- `0`: All tests passed
- `1`: One or more tests failed
- `2`: Test runner error (missing files, etc.)

## 📝 Adding New Tests

### Test File Structure
```typescript
import { describe, expect, it } from "vitest";
import { createTestLayer, TestUtils, TestAssertions } from "./test-helpers";

describe("New Integration Test", () => {
  it("should test specific functionality", async () => {
    // Use test helpers and assertions
  });
});
```

### Best Practices
1. Use shared test helpers for consistency
2. Include performance measurements for critical paths
3. Test both success and error scenarios
4. Verify complete message flows, not just individual operations
5. Clean up resources (interrupt Effect fibers)
6. Use descriptive test names and comments

## 📚 Related Documentation

- [ChatService API](../../src/services/chat/README.md)
- [Effect Service Pattern](../../src/services/README.md)
- [WebSocket Protocol](../../../protocol.md)
- [Performance Guidelines](../../docs/performance.md) 