# ChatService Tests

This directory contains comprehensive tests for the ChatService, including both unit tests and integration tests.

## Test Files

### Unit Tests
- `ChatService.test.ts` - Unit tests for ChatService functionality using mocks
- `ChatService.realSession.test.ts` - Unit tests using real Effect services but mocked WebSocket

### Integration Tests
- `ChatService.integration.test.ts` - Full integration tests that connect to a live LLM agent

## Running Tests

### Unit Tests Only
```bash
bun test src/services/chat/__tests__/ChatService.test.ts
bun test src/services/chat/__tests__/ChatService.realSession.test.ts
```

### Integration Tests
```bash
# First, start the test LLM agent server
cd llm-agent
bun run test-integration-server.ts

# Then run the integration tests
cd apps/client
bun test src/services/chat/__tests__/ChatService.integration.test.ts
```

### All Tests
```bash
bun test src/services/chat/__tests__/
```

## Integration Test Setup

The integration tests require a running LLM agent server. We provide a test server (`llm-agent/test-integration-server.ts`) that:

- Mimics the real LLM agent behavior
- Responds to different types of messages with appropriate content
- Supports streaming responses
- Handles multiple chat IDs
- Provides markdown-formatted responses

### Test Server Features

The test server responds intelligently to different message types:
- **Greetings** ("hello") → Friendly response
- **TypeScript questions** → Technical explanation with code examples
- **REST vs GraphQL** → Comparison with markdown formatting
- **Markdown requests** → Structured lists and formatting
- **General messages** → Echo with test server identification

### Message Flow

1. Client connects to `ws://localhost:8080/chat`
2. Server sends welcome message
3. Client sends `USER_MESSAGE` with text and chatId
4. Server responds with:
   - `RECEIVED` acknowledgment
   - `PROCESSING` status
   - `THINKING` state (on)
   - Multiple `LLM_STREAM` chunks with content
   - `THINKING` state (off)

## Test Coverage

The integration tests verify:
- ✅ WebSocket connection establishment
- ✅ Message sending and receiving
- ✅ Streaming response handling
- ✅ Multiple message sequences
- ✅ Different chat ID handling
- ✅ Markdown content processing
- ✅ Error handling and timeouts

## Protocol Compatibility

The integration tests use the message format expected by the LLM agent:

```typescript
// Outgoing message format
{
  type: "USER_MESSAGE",
  text: string,
  metadata: { chatId: string }
}

// Incoming message types
{
  type: "WELCOME" | "RECEIVED" | "PROCESSING" | "THINKING" | "LLM_STREAM",
  // ... type-specific fields
}
```

This ensures compatibility between the ChatService and the actual LLM agent implementation. 