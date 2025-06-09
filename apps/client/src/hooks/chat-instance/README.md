# Chat Instance Architecture

## Overview

This directory implements a clean, event-driven chat instance architecture using **xState/store** for state management and **Effect.js** for business logic. The architecture follows strict separation of concerns with clear boundaries between state management, business logic, and React integration.

## Architecture Phases

### ✅ Phase 1: Event-Driven State Management (Completed)
- **xState/store** implementation with three focused stores
- Type-safe event definitions and state transitions
- Clean separation of concerns across stores
- Comprehensive test coverage

### ✅ Phase 2: Business Logic Extraction (Completed)
- **Effect.js services** for pure business logic
- **Bridge pattern** for service ↔ store integration
- Proper error handling and logging
- Service composition and dependency injection

### ✅ Phase 3: React Integration (Completed)
- **useChatInstanceV2** hook using stores + services
- Backward compatible interface with original hook
- Store subscriptions and state consumption
- Performance optimized with selective subscriptions

## Directory Structure

```
src/hooks/chat-instance/
├── types/
│   └── index.ts                    # Type definitions
├── stores/                         # xState/store (Pure State Management)
│   ├── chatInstanceStore.ts        # Core chat state
│   ├── agentStore.ts              # Agent communication & streaming
│   ├── connectionStore.ts         # Connection state & reconnection
│   ├── chatInstanceStore.test.ts  # Store tests
│   └── index.ts                   # Store exports
├── bridges/                       # Integration Layer
│   ├── ChatInstanceBridge.ts     # Effect.js ↔ xState/store bridge
│   └── index.ts                  # Bridge exports
├── useChatInstanceV2.ts          # New React hook
├── useChatInstanceV2.test.ts     # Hook tests
├── example.tsx                   # Usage examples
├── index.ts                      # Main exports
└── README.md                     # This file

src/services/chat-instance/        # Effect.js Services (Pure Business Logic)
├── ChatInstanceService.ts        # Message processing & conversion
├── AgentCommunicationService.ts  # Agent session & communication
├── ConnectionManagementService.ts # Connection state management
├── ChatInstanceService.test.ts   # Service tests
└── index.ts                      # Service exports
```

## Architecture Layers

### 1. **Effect.js Services** (Pure Business Logic)
Located in `src/services/chat-instance/`

**Responsibilities:**
- Pure business logic with no side effects
- Protocol message conversion and processing
- Agent session establishment and management
- Connection state transitions and error handling
- MDX compilation and message finalization

**Key Services:**
- **ChatInstanceService**: Message processing, protocol conversion, MDX compilation
- **AgentCommunicationService**: Session management, message sending, stream handling
- **ConnectionManagementService**: Connection state logic, reconnection handling

**Characteristics:**
- No React hooks, components, or DOM access
- No xState/store dependencies
- Pure Effect.js patterns with proper error handling
- Comprehensive logging and observability
- Dependency injection via Effect.Service pattern

### 2. **xState/store** (Pure State Management)
Located in `src/hooks/chat-instance/stores/`

**Responsibilities:**
- Pure state transitions with no side effects
- Event-driven state updates
- State selectors and computed values
- Action creators for type-safe dispatching

**Key Stores:**
- **chatInstanceStore**: Core chat state (messages, status, typing, errors)
- **agentStore**: Agent communication state (streaming, pending messages)
- **connectionStore**: Connection state (status, attempts, errors)

**Characteristics:**
- No Effect.js services or async operations
- No React dependencies
- Pure state machines with descriptive events
- Type-safe event definitions and state shapes

### 3. **Bridge Layer** (Integration)
Located in `src/hooks/chat-instance/bridges/`

**Responsibilities:**
- Coordinates between Effect.js services and xState stores
- Handles service initialization and lifecycle
- Processes business events and updates state
- Manages Effect.js fibers and cleanup

**Key Components:**
- **ChatInstanceBridge**: Main coordination service
- Service composition and dependency management
- Event processing and state synchronization
- Resource cleanup and error handling

### 4. **React Hook Layer** (UI Integration)
Located in `src/hooks/chat-instance/useChatInstanceV2.ts`

**Responsibilities:**
- React-specific concerns (useEffect, useState, etc.)
- Store subscriptions and state consumption
- Action dispatching and user interactions
- Component lifecycle integration

**Key Features:**
- **useChatInstanceV2**: Main hook with backward compatible interface
- Store subscriptions using `useStore` from xState/store
- Effect.js service integration via bridge pattern
- Proper cleanup and resource management
- Type-safe action dispatching

## Event Flow

```
User Action → React Hook → Bridge → Effect.js Service → Business Logic
                ↓                                            ↓
            xState Store ← Events ← Service Results ← Processing
                ↓
            React State Update → UI Re-render
```

### Data Flow Example: Sending a Message

1. **User Action**: User types message and clicks send
2. **React Hook**: Dispatches `sendMessage` action
3. **Bridge**: Receives action, calls `ChatInstanceService.createUserMessage`
4. **Service**: Creates user message, calls `AgentCommunicationService.sendMessage`
5. **Service**: Sends protocol message to agent via WebSocket
6. **Bridge**: Updates `chatInstanceStore` with new user message
7. **React**: Store subscription triggers re-render with new message

### Data Flow Example: Receiving Streaming Response

1. **Agent**: Sends `LLM_STREAM` protocol message
2. **Service**: `AgentCommunicationService` receives message
3. **Bridge**: Processes message, calls `agentStore.addChunk`
4. **Store**: Updates streaming state with new chunk
5. **React**: Store subscription triggers re-render with updated text
6. **Agent**: Sends completion signal
7. **Bridge**: Calls `ChatInstanceService.finalizeStreamingMessage`
8. **Service**: Compiles MDX and creates final message
9. **Bridge**: Updates stores with final message
10. **React**: Final re-render with completed message

## Error Handling

### Service-Level Errors
- **Tagged Errors**: Type-safe error definitions with context
- **Error Mapping**: Convert low-level errors to domain errors
- **Error Recovery**: Graceful degradation and fallback strategies
- **Logging**: Comprehensive error logging with context

### Store-Level Errors
- **Error State**: Dedicated error fields in state
- **Error Events**: Specific events for error conditions
- **Error Clearing**: Mechanisms to clear errors on recovery

### Bridge-Level Errors
- **Error Coordination**: Translate service errors to store events
- **Error Propagation**: Ensure errors reach appropriate state
- **Error Cleanup**: Handle errors during cleanup operations

## Testing Strategy

### Service Tests
- **Unit Tests**: Test individual service methods
- **Integration Tests**: Test service composition
- **Mock Dependencies**: Use Layer.succeed for mocking
- **Error Scenarios**: Test all error conditions

### Store Tests
- **State Transitions**: Test all event handlers
- **Selectors**: Test computed state access
- **Action Creators**: Test type-safe dispatching
- **Pure Functions**: No side effects in tests

### Bridge Tests
- **Coordination**: Test service ↔ store integration
- **Lifecycle**: Test initialization and cleanup
- **Error Handling**: Test error propagation
- **Resource Management**: Test fiber management

## Development Guidelines

### Adding New Features

1. **Define Events**: Add events to appropriate store types
2. **Implement State Logic**: Add event handlers to stores
3. **Create Service Methods**: Add business logic to services
4. **Update Bridge**: Add coordination logic to bridge
5. **Write Tests**: Test all layers independently
6. **Update Types**: Ensure type safety throughout

### Service Development
- Follow Effect.Service pattern with proper dependencies
- Use tagged errors for type-safe error handling
- Add comprehensive logging for observability
- Keep services pure with no side effects
- Test with mocked dependencies

### Store Development
- Keep state minimal and focused
- Use descriptive event names
- Implement proper selectors for computed state
- Test state transitions independently
- No async operations in stores

### Bridge Development
- Coordinate between services and stores
- Handle service lifecycle properly
- Manage Effect.js fibers and cleanup
- Translate between service and store domains
- Handle errors gracefully

## Performance Considerations

### Store Optimization
- **Minimal State**: Keep only necessary state
- **Efficient Updates**: Use immutable updates
- **Selective Subscriptions**: Subscribe to specific state slices
- **Memoized Selectors**: Cache computed values

### Service Optimization
- **Resource Management**: Proper cleanup of resources
- **Fiber Management**: Efficient concurrent operations
- **Stream Processing**: Backpressure and flow control
- **Connection Pooling**: Reuse connections when possible

### Bridge Optimization
- **Batched Updates**: Group related state updates
- **Debounced Operations**: Avoid excessive updates
- **Efficient Coordination**: Minimize service ↔ store calls
- **Memory Management**: Proper cleanup of subscriptions

## Migration Strategy

### Phase 3: React Integration
1. Create new `useChatInstanceV2` hook using stores + bridge
2. Implement backward compatibility layer
3. Migrate components incrementally
4. Remove old `useChatInstance` when migration complete
5. Rename `useChatInstanceV2` to `useChatInstance`

### Backward Compatibility
- Maintain existing hook interface
- Provide migration guide for consumers
- Support both implementations during transition
- Comprehensive testing of migration path

## Benefits Achieved

### ✅ Phase 1 Benefits
- **Event-Driven Architecture**: Clear, descriptive events
- **Separation of Concerns**: Focused, single-responsibility stores
- **Type Safety**: Strongly typed events and state
- **Testability**: Pure functions, isolated testing

### ✅ Phase 2 Benefits
- **Business Logic Separation**: Pure Effect.js services
- **Proper Error Handling**: Tagged errors, comprehensive logging
- **Service Composition**: Dependency injection, modular design
- **Resource Management**: Proper cleanup, fiber management

### ✅ Phase 3 Benefits (Completed)
- **React Integration**: Clean hook interface with backward compatibility
- **Performance**: Optimized subscriptions, minimal re-renders
- **Developer Experience**: Better debugging, clearer data flow
- **Maintainability**: Easier to test, modify, and extend

## Usage

### Basic Usage

```typescript
import { useChatInstanceV2 } from "@/hooks/chat-instance";

function ChatComponent() {
  const agentConfig = {
    agentId: "my-agent",
    initialAgentName: "My Agent",
  };

  const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
    "my-chat-id",
    agentConfig
  );

  const handleSendMessage = (text: string) => {
    dispatchAction({
      _tag: "sendMessage",
      text,
      chatId: "my-chat-id",
    });
  };

  return (
    <div>
      <div>Status: {chatState.status}</div>
      <div>Agent: {chatState.agentName}</div>
      {chatState.messages.map((message) => (
        <div key={message.id}>
          {message.role}: {message.text}
        </div>
      ))}
      <button onClick={() => handleSendMessage("Hello!")}>
        Send Message
      </button>
    </div>
  );
}
```

### With Dependency Injection (for testing)

```typescript
import { Layer } from "effect";
import { useChatInstanceV2 } from "@/hooks/chat-instance";

function TestChatComponent() {
  // Create mock layer for testing
  const mockLayer = Layer.merge(
    MockChatRuntimeService,
    MockMdxService
  );

  const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
    "test-chat",
    { agentId: "test", initialAgentName: "Test" },
    mockLayer // Inject mocks for testing
  );

  // ... rest of component
}
```

### Store Access (for advanced usage)

```typescript
import { useStore } from "@xstate/store/react";
import { 
  chatInstanceStore, 
  chatInstanceSelectors,
  agentStore,
  agentSelectors 
} from "@/hooks/chat-instance";

function AdvancedChatComponent() {
  // Direct store access for fine-grained subscriptions
  const messages = useStore(chatInstanceStore, chatInstanceSelectors.getMessages);
  const isTyping = useStore(chatInstanceStore, chatInstanceSelectors.getIsTyping);
  const activeStreams = useStore(agentStore, agentSelectors.getActiveStreams);

  // ... component logic
}
```

## Current Status

**✅ Completed:**
- xState/store implementation (3 stores)
- Effect.js services (3 services)
- Bridge coordination layer
- React integration hook (useChatInstanceV2)
- Comprehensive test coverage
- Type safety throughout
- Error handling and logging
- Usage examples and documentation

**🔄 Next Steps:**
- Migration from existing useChatInstance hook
- Performance optimization and monitoring
- Additional React hooks for specific use cases
- Integration with existing components 