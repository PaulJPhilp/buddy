# Migration Example: Step-by-Step Guide

This document shows a practical example of migrating from `useChatInstance` to `useChatInstanceV2`.

## Before Migration

Let's say you have a component using the old hook:

```typescript
// src/components/ChatComponent.tsx
import { useChatInstance } from "@/hooks/useChatInstance";

export function ChatComponent({ chatId }: { chatId: string }) {
  const { chatState, runtimeError, dispatchAction } = useChatInstance(
    chatId,
    { agentId: "my-agent", initialAgentName: "My Agent" }
  );

  return (
    <div>
      <h2>Chat: {chatState.agentName}</h2>
      <p>Status: {chatState.status}</p>
      <p>Messages: {chatState.messages.length}</p>
      
      <button 
        onClick={() => dispatchAction({
          _tag: "sendMessage",
          text: "Hello!",
          chatId
        })}
      >
        Send Message
      </button>
    </div>
  );
}
```

And a test file:

```typescript
// src/components/ChatComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ChatComponent } from "./ChatComponent";

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

describe("ChatComponent", () => {
  it("renders correctly", () => {
    render(<ChatComponent chatId="test-chat" />);
    expect(screen.getByText("Chat: Test Agent")).toBeInTheDocument();
  });
});
```

## Running the Migration

1. **Navigate to the client directory:**
   ```bash
   cd apps/client
   ```

2. **Run the migration script:**
   ```bash
   ./migrate-chat-instance.sh
   ```

3. **Expected output:**
   ```
   🚀 Starting useChatInstance → useChatInstanceV2 migration...

   💾 Creating backup of files to be modified...
     📁 Backed up: src/components/ChatComponent.tsx
     📁 Backed up: src/components/ChatComponent.test.tsx

   📝 Updating imports...
     🔄 Updating imports in: src/components/ChatComponent.tsx

   🔄 Updating function calls...
     🔧 Updating function calls in: src/components/ChatComponent.tsx

   🎭 Updating test mocks...
     🧪 Updating mock imports in: src/components/ChatComponent.test.tsx
     🔧 Updating mock function names in: src/components/ChatComponent.test.tsx

   🔍 Checking for any remaining references...
   ✅ No remaining useChatInstance references found!

   🧪 Running tests to verify migration...
   Running tests with bun...
   ✅ Tests passed!

   🏗️  Checking build...
   Running build check...
   ✅ Build successful!

   ✅ Migration complete!

   📋 Summary:
     • Updated imports from useChatInstance to chat-instance
     • Updated function calls from useChatInstance to useChatInstanceV2
     • Updated test mocks and vi.mock calls
     • Created backup in: migration-backup-20241220-143022

   🔍 Next steps:
     1. Review any remaining references shown above
     2. Run 'bun test' to ensure all tests pass
     3. Run 'bun run build' to ensure build works
     4. Test your application manually
     5. If everything works, you can remove the backup: rm -rf migration-backup-20241220-143022

   🚀 Happy coding with the new event-driven architecture!
   ```

## After Migration

Your files are automatically updated:

```typescript
// src/components/ChatComponent.tsx
import { useChatInstanceV2 } from "@/hooks/chat-instance";

export function ChatComponent({ chatId }: { chatId: string }) {
  const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
    chatId,
    { agentId: "my-agent", initialAgentName: "My Agent" }
  );

  return (
    <div>
      <h2>Chat: {chatState.agentName}</h2>
      <p>Status: {chatState.status}</p>
      <p>Messages: {chatState.messages.length}</p>
      
      <button 
        onClick={() => dispatchAction({
          _tag: "sendMessage",
          text: "Hello!",
          chatId
        })}
      >
        Send Message
      </button>
    </div>
  );
}
```

```typescript
// src/components/ChatComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ChatComponent } from "./ChatComponent";

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

describe("ChatComponent", () => {
  it("renders correctly", () => {
    render(<ChatComponent chatId="test-chat" />);
    expect(screen.getByText("Chat: Test Agent")).toBeInTheDocument();
  });
});
```

## What Changed

1. **Import statement**: `"@/hooks/useChatInstance"` → `"@/hooks/chat-instance"`
2. **Function name**: `useChatInstance` → `useChatInstanceV2`
3. **Mock import**: Updated to match new module path
4. **Mock function**: Updated to match new function name

## Verification Steps

1. **Check the backup was created:**
   ```bash
   ls -la migration-backup-*
   ```

2. **Run tests to ensure everything works:**
   ```bash
   bun test
   ```

3. **Build the project:**
   ```bash
   bun run build
   ```

4. **Start the development server and test manually:**
   ```bash
   bun run dev
   ```

## Rollback (if needed)

If something goes wrong, you can easily rollback:

```bash
# Restore from backup
cp -r migration-backup-20241220-143022/* src/

# Or restore specific files
cp migration-backup-20241220-143022/components/ChatComponent.tsx src/components/
```

## Advanced Usage After Migration

Once migrated, you can take advantage of the new architecture:

```typescript
// Advanced usage with direct store access
import { useStore } from "@xstate/store/react";
import { 
  useChatInstanceV2,
  chatInstanceStore,
  chatInstanceSelectors 
} from "@/hooks/chat-instance";

export function AdvancedChatComponent({ chatId }: { chatId: string }) {
  // Main hook for actions
  const { dispatchAction } = useChatInstanceV2(
    chatId,
    { agentId: "my-agent", initialAgentName: "My Agent" }
  );

  // Direct store subscriptions for performance
  const messages = useStore(chatInstanceStore, chatInstanceSelectors.getMessages);
  const isTyping = useStore(chatInstanceStore, chatInstanceSelectors.getIsTyping);
  const status = useStore(chatInstanceStore, chatInstanceSelectors.getStatus);

  return (
    <div>
      <h2>Advanced Chat</h2>
      <p>Status: {status}</p>
      <p>Messages: {messages.length}</p>
      {isTyping && <p>Agent is typing...</p>}
      
      <button 
        onClick={() => dispatchAction({
          _tag: "sendMessage",
          text: "Hello from advanced component!",
          chatId
        })}
      >
        Send Message
      </button>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Script permission denied:**
   ```bash
   chmod +x migrate-chat-instance.sh
   ```

2. **Tests fail after migration:**
   - Check the console output for specific errors
   - Verify mock imports are correct
   - Ensure all dependencies are installed

3. **Build fails:**
   - Check for TypeScript errors
   - Verify all imports are correct
   - Run `bun install` to ensure dependencies

4. **Runtime errors:**
   - Check browser console for errors
   - Verify the new hook is properly imported
   - Check that all required services are available

### Getting Help

If you encounter issues:

1. Check the backup files to see what changed
2. Review the migration guide in `MIGRATION.md`
3. Look at the example usage in `example.tsx`
4. Check the test files for correct patterns

## Summary

The migration script automates the tedious parts of migration while preserving your existing functionality. The new architecture provides:

- **Same interface** - No changes to your component logic
- **Better performance** - Event-driven updates and selective subscriptions
- **Improved maintainability** - Clean separation of concerns
- **Enhanced debugging** - Better logging and state inspection

Your components work exactly the same, but now have access to a more powerful and scalable architecture! 🚀 