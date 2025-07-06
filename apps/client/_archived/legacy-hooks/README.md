# Hooks Directory

This directory contains React hooks that bridge Effect.js services and xState stores with React components.

## Available Hooks

### 🔧 useDynamicToolbar

**File**: `dynamic-toolbar/useDynamicToolbar.ts`

**Purpose**: Synchronizes toolbar button states with application store state.

**Usage**:
```typescript
import { useDynamicToolbar } from "@/hooks/dynamic-toolbar";

const baseToolbarConfig = { items: [...] };
const dynamicConfig = useDynamicToolbar(baseToolbarConfig);

// dynamicConfig.items will have updated active states based on store state
return <Toolbar config={dynamicConfig} />;
```

### 🎨 useApplyChatContainerStyle

**File**: `chat-style/useApplyChatContainerStyle.ts`

**Purpose**: Applies theme styling to chat container elements.

**Usage**:
```typescript
import { useApplyChatContainerStyle } from "@/hooks/chat-style/useApplyChatContainerStyle";

const containerRef = useApplyChatContainerStyle(theme);
return <div ref={containerRef}>Chat content</div>;
```

## Architecture

These hooks follow the pattern of bridging Effect.js services with React components:

1. **Store Synchronization**: Hooks like `useDynamicToolbar` sync external state with React
2. **DOM Manipulation**: Hooks like `useApplyChatContainerStyle` apply styles to DOM elements
3. **Service Integration**: All hooks provide clean interfaces to Effect.js services

## Testing

Each hook has comprehensive tests in the `__tests__` directory and individual test files. 