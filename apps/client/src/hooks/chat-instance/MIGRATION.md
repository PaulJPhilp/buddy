# Migration Guide: useChatInstance → useChatInstanceV2

This guide walks you through migrating from the old `useChatInstance` hook to the new event-driven `useChatInstanceV2` architecture.

## Overview

The new `useChatInstanceV2` hook provides the **exact same interface** as the original hook, making migration straightforward. The key difference is the underlying architecture:

- **Old**: Monolithic hook with mixed concerns (489 lines)
- **New**: Event-driven architecture with clean separation of concerns

## Quick Migration Script

For most cases, migration is as simple as running this find-and-replace:

```bash
# In your project root
find apps/client/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/from "@\/hooks\/useChatInstance"/from "@\/hooks\/chat-instance"/g'
find apps/client/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/useChatInstance(/useChatInstanceV2(/g'
```

Or manually update each file:

## Migration Steps

### Step 1: Import the New Hook

**Before:**
```typescript
import { useChatInstance } from "@/hooks/useChatInstance";
```

**After:**
```typescript
import { useChatInstanceV2 } from "@/hooks/chat-instance";
```

### Step 2: Update Hook Usage

The interface is **100% backward compatible**, so no changes needed:

```typescript
// This works exactly the same with both hooks
const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
  chatId,
  agentConfigData,
  injectedLayer // Optional, same as before
);
```

### Step 3: Verify Functionality

Both hooks return the exact same interface:

```typescript
interface HookReturn {
  chatState: ChatInstanceHookState;
  runtimeError: AgentRuntimeError | null;
  dispatchAction: (action: ChatInstanceAction) => void;
}

interface ChatInstanceHookState {
  readonly chatId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly status: "initializing" | "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
  readonly agentName: string;
  readonly isTyping: boolean;
  readonly error?: string;
}
```

## Real Migration Examples

### Example 1: Test File Migration

**Before (`useChatInstance.test.ts`):**
```typescript
import { useChatInstance } from "./useChatInstance";

describe("useChatInstance", () => {
  it("should initialize with correct initial state", () => {
    const testLayer = createTestLayer();

    const { result } = renderHook(() =>
      useChatInstance(testChatId, testAgentConfig, testLayer),
    );

    expect(result.current.chatState.chatId).toBe(testChatId);
    expect(result.current.chatState.status).toBe("initializing");
  });
});
```

**After:**
```typescript
import { useChatInstanceV2 } from "@/hooks/chat-instance";

describe("useChatInstanceV2", () => {
  it("should initialize with correct initial state", () => {
    const testLayer = createTestLayer();

    const { result } = renderHook(() =>
      useChatInstanceV2(testChatId, testAgentConfig, testLayer),
    );

    expect(result.current.chatState.chatId).toBe(testChatId);
    expect(result.current.chatState.status).toBe("initializing");
  });
});
```

### Example 2: Mock Migration in Tests

**Before (`ChatApp.test.tsx`):**
```typescript
// Mock the useChatInstance hook
vi.mock("@/hooks/useChatInstance", () => ({
    useChatInstance: vi.fn(() => ({
        chatState: {
            chatId: "test-chat",
            messages: [],
            status: "connected",
            agentName: "Test Agent",
            isTyping: false,
        },
        runtimeError: null,
        dispatchAction: vi.fn(),
    })),
}));
```

**After:**
```typescript
// Mock the useChatInstanceV2 hook
vi.mock("@/hooks/chat-instance", () => ({
    useChatInstanceV2: vi.fn(() => ({
        chatState: {
            chatId: "test-chat",
            messages: [],
            status: "connected",
            agentName: "Test Agent",
            isTyping: false,
        },
        runtimeError: null,
        dispatchAction: vi.fn(),
    })),
}));
```

### Example 3: Component Migration

**Before:**
```typescript
import { useChatInstance } from "@/hooks/useChatInstance";

function ChatComponent({ chatId, agentConfig }) {
  const { chatState, runtimeError, dispatchAction } = useChatInstance(
    chatId,
    agentConfig
  );

  const handleSendMessage = (text: string) => {
    dispatchAction({
      _tag: "sendMessage",
      text,
      chatId,
    });
  };

  return (
    <div>
      <div>Status: {chatState.status}</div>
      <div>Messages: {chatState.messages.length}</div>
      <button onClick={() => handleSendMessage("Hello")}>
        Send Message
      </button>
    </div>
  );
}
```

**After:**
```typescript
import { useChatInstanceV2 } from "@/hooks/chat-instance";

function ChatComponent({ chatId, agentConfig }) {
  const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
    chatId,
    agentConfig
  );

  const handleSendMessage = (text: string) => {
    dispatchAction({
      _tag: "sendMessage",
      text,
      chatId,
    });
  };

  return (
    <div>
      <div>Status: {chatState.status}</div>
      <div>Messages: {chatState.messages.length}</div>
      <button onClick={() => handleSendMessage("Hello")}>
        Send Message
      </button>
    </div>
  );
}
```

**Changes:** Only the import statement! 🎉

## Advanced Migration: Leveraging New Features

While the basic interface is the same, the new architecture offers additional capabilities:

### Direct Store Access

```typescript
import { useStore } from "@xstate/store/react";
import { 
  useChatInstanceV2,
  chatInstanceStore, 
  chatInstanceSelectors,
  agentStore,
  agentSelectors 
} from "@/hooks/chat-instance";

function AdvancedChatComponent({ chatId, agentConfig }) {
  // Use the main hook for core functionality
  const { dispatchAction } = useChatInstanceV2(chatId, agentConfig);
  
  // Use direct store access for fine-grained subscriptions
  const messages = useStore(chatInstanceStore, chatInstanceSelectors.getMessages);
  const isTyping = useStore(chatInstanceStore, chatInstanceSelectors.getIsTyping);
  const activeStreams = useStore(agentStore, agentSelectors.getActiveStreams);
  
  return (
    <div>
      <div>Messages: {messages.length}</div>
      <div>Typing: {isTyping ? "Yes" : "No"}</div>
      <div>Active Streams: {activeStreams.size}</div>
      {/* Render messages, handle actions, etc. */}
    </div>
  );
}
```

### Performance Optimization

```typescript
import { useStore } from "@xstate/store/react";
import { chatInstanceStore, chatInstanceSelectors } from "@/hooks/chat-instance";

// Instead of subscribing to entire chatState, subscribe only to what you need
function MessageCount() {
  // Only re-renders when message count changes
  const messageCount = useStore(
    chatInstanceStore, 
    (state) => state.context.messages.length
  );
  
  return <div>Messages: {messageCount}</div>;
}

function TypingIndicator() {
  // Only re-renders when typing state changes
  const isTyping = useStore(chatInstanceStore, chatInstanceSelectors.getIsTyping);
  
  return isTyping ? <div>Agent is typing...</div> : null;
}
```

## Current Codebase Migration Status

Based on analysis of the current codebase, here are the files that need migration:

### Files Using Old Hook:
1. **`apps/client/src/hooks/useChatInstance.test.ts`** - Unit tests
2. **`apps/client/src/hooks/useChatInstance.integration.test.ts`** - Integration tests  
3. **`apps/client/src/features/chat/ChatApp.test.tsx`** - Component test mocks

### Files Already Using New Hook:
1. **`apps/client/src/hooks/chat-instance/example.tsx`** - Example usage
2. **`apps/client/src/hooks/chat-instance/useChatInstanceV2.test.ts`** - New tests

## Migration Checklist

### Phase 1: Preparation
- [x] Review current usage of `useChatInstance` ✅ (3 test files found)
- [x] Identify all components using the hook ✅ (Mainly in tests)
- [x] Ensure test coverage for existing functionality ✅ (Tests exist)
- [ ] Plan migration order (start with least critical components)

### Phase 2: Gradual Migration
- [ ] Update test file imports one at a time
- [ ] Update mock implementations in test files
- [ ] Test each file after migration
- [ ] Verify no functionality is broken

### Phase 3: Optimization (Optional)
- [ ] Identify components that could benefit from direct store access
- [ ] Optimize subscriptions for better performance
- [ ] Add new features using the event-driven architecture
- [ ] Update documentation and examples

### Phase 4: Cleanup
- [ ] Remove old `useChatInstance` hook when all components migrated
- [ ] Update import statements in documentation
- [ ] Remove old test utilities and mocks
- [ ] Celebrate! 🎉

## Automated Migration Script

Here's a complete migration script you can run:

```bash
#!/bin/bash
# migrate-chat-instance.sh

echo "🚀 Starting useChatInstance → useChatInstanceV2 migration..."

# Update imports
echo "📝 Updating imports..."
find apps/client/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/from "@\/hooks\/useChatInstance"/from "@\/hooks\/chat-instance"/g'

# Update function calls
echo "🔄 Updating function calls..."
find apps/client/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/useChatInstance(/useChatInstanceV2(/g'

# Update mock imports
echo "🎭 Updating mock imports..."
find apps/client/src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i '' 's/"@\/hooks\/useChatInstance"/"@\/hooks\/chat-instance"/g'

# Update mock function names
echo "🧪 Updating mock function names..."
find apps/client/src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i '' 's/useChatInstance:/useChatInstanceV2:/g'

echo "✅ Migration complete! Please run tests to verify everything works."
echo "🧪 Run: bun test"
echo "🏗️  Run: bun run build"
```

## Benefits After Migration

### 1. **Performance Improvements**
- **Selective Subscriptions**: Components only re-render when relevant state changes
- **Efficient Updates**: Event-driven updates minimize unnecessary work
- **Resource Management**: Proper cleanup prevents memory leaks

### 2. **Better Developer Experience**
- **Clear Architecture**: Easy to understand data flow
- **Type Safety**: Comprehensive type checking throughout
- **Error Handling**: Better error messages and recovery
- **Debugging**: Clear logging and state inspection

### 3. **Maintainability**
- **Separation of Concerns**: Business logic, state, and UI are cleanly separated
- **Testability**: Easy to test individual layers
- **Extensibility**: Simple to add new features
- **Documentation**: Comprehensive guides and examples

### 4. **Future-Proof**
- **Scalable Architecture**: Handles complex chat features easily
- **Modern Patterns**: Uses latest React and Effect.js patterns
- **Event-Driven**: Ready for real-time features and complex workflows

## Troubleshooting

### Common Issues

#### 1. **Import Errors**
```typescript
// ❌ Wrong
import { useChatInstance } from "@/hooks/chat-instance";

// ✅ Correct
import { useChatInstanceV2 } from "@/hooks/chat-instance";
```

#### 2. **Type Errors**
The interfaces are identical, so type errors likely indicate:
- Outdated type definitions
- Missing dependencies
- Incorrect import paths

#### 3. **Runtime Errors**
If you see runtime errors after migration:
- Check that all required services are available
- Verify mock layers in tests are correctly configured
- Ensure Effect.js dependencies are properly installed

#### 4. **Performance Issues**
If you notice performance regressions:
- Consider using direct store subscriptions for frequently updating components
- Check for unnecessary re-renders using React DevTools
- Verify proper cleanup in useEffect hooks

### Getting Help

If you encounter issues during migration:

1. **Check the Documentation**: Review the README and examples
2. **Look at Tests**: The test files show correct usage patterns
3. **Use the Example Component**: Reference the example.tsx file
4. **Check Console Logs**: The new architecture has comprehensive logging

## Migration Timeline

### Recommended Approach

1. **Day 1**: Run automated migration script, fix any immediate issues
2. **Day 2**: Update test mocks and verify all tests pass
3. **Day 3**: Test in development environment, fix any runtime issues
4. **Day 4**: Deploy to staging, monitor for issues, then production

### Rollback Plan

If issues arise, rollback is simple:
1. Change imports back to `useChatInstance`
2. The interface is identical, so no other changes needed
3. Fix any issues with the new architecture
4. Resume migration when ready

## Conclusion

Migration to `useChatInstanceV2` is straightforward due to the backward-compatible interface. The main benefit is the improved architecture that provides:

- **Better performance** through selective subscriptions
- **Improved maintainability** with clean separation of concerns  
- **Enhanced developer experience** with better tooling and debugging
- **Future-proof foundation** for complex chat features

The migration can be done gradually, component by component, with minimal risk and maximum benefit! 🚀 