# Chat Service Design

## Overview
A chat service implementation using Effect.ts to manage chat state and messages in a type-safe, functional way.

## Core Types

### Message
```typescript
interface Message {
    id: string          // Unique message identifier
    text: string        // Message content
    sender: "user" | "assistant"  // Who sent the message
    timestamp: number   // When the message was sent
}
```

### ChatState
```typescript
interface ChatState {
    id: string          // Chat session identifier
    messages: Message[] // Ordered list of messages
    isTyping: boolean   // Current typing status
}
```

## Service Interface

```typescript
interface ChatService {
    // Get current chat state
    getState: () => Effect.Effect<ChatState, Error, never>
    
    // Update entire chat state
    setState: (state: ChatState) => Effect.Effect<ChatState, Error, never>
    
    // Send a new message
    sendMessage: (text: string) => Effect.Effect<Message, Error, never>
    
    // Update typing status
    setTyping: (isTyping: boolean) => Effect.Effect<ChatState, Error, never>
}
```

## Implementation Details

### State Management
- All state changes are handled through Effects
- Immutable state updates
- Thread-safe state access
- No direct state mutation outside Effects

### Error Handling
- All operations may return Error
- No thrown exceptions
- Errors are handled through Effect.ts type system

### Mock Strategy
Instead of static responses, the mock implementation will:
1. Use the MCP service to make actual LLM calls
2. Maintain conversation history for context
3. Stream responses for realistic typing simulation
4. Handle rate limiting and errors gracefully

#### Mock LLM Integration
```typescript
interface MockLLMConfig {
    model: string       // LLM model to use
    temperature: number // Response randomness
    maxTokens: number   // Max response length
}

interface MockChatDeps {
    mcp: McpService     // MCP service for LLM calls
    config: MockLLMConfig
}
```

## File Structure

```
app-chat/
├── ChatServiceApi.ts    # Interface and type definitions
├── ChatService.ts      # Live implementation
├── MockChatService/
│   ├── index.ts        # Mock service entry point
│   ├── types.ts        # Mock-specific types
│   ├── llm.ts         # LLM integration logic
│   └── state.ts       # State management
└── ChatApp.ts         # Example usage
```

## Testing

The service is designed for testability:
- LLM-based mock provides realistic responses
- All operations are pure functions
- State changes are traceable through Effects
- No side effects outside of Effects
- MCP service can be mocked for unit tests

## Example Mock Usage

```typescript
const program = Effect.gen(function* (_) {
    const service = yield* ChatService

    // Initialize chat
    const initialState = {
        id: `chat-${Date.now()}`,
        messages: [],
        isTyping: false
    }
    yield* service.setState(initialState)

    // Send message and get LLM response
    yield* service.setTyping(true)
    const message = yield* service.sendMessage("What is Effect.ts?")
    yield* service.setTyping(false)

    // Get updated state with LLM response
    const state = yield* service.getState()
})
``` 