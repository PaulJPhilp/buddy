# Hooks Directory

This directory contains React hooks that bridge **Effect.js services** and **xState stores** with **React components**. Each hook serves a specific purpose in the chat application architecture.

## Hook Overview

| Hook | Purpose | Pattern | Status |
|------|---------|---------|--------|
| `useAgentSession` | Agent session lifecycle management | Service lifecycle + stream management | ✅ Active |
| `useChatAppRuntime` | Composite runtime state for chat apps | Composite data fetching + service integration | ✅ Active |
| `useChatInstance` | Complex chat state management | State machine + stream processing | ✅ Active |
| `useChatTheme` | Theme processing and merging | Pure computation | ✅ Active |
| `useDynamicToolbar` | Toolbar state synchronization | Store synchronization | ✅ Active |
| `useThemeIntegration` | next-themes integration | Store synchronization | ✅ Active |

---

## Individual Hook Documentation

### 🔌 useAgentSession

**File**: `agent-session/useAgentSession.ts` (89 lines)

**Purpose**: Manages the lifecycle of individual agent sessions with real-time message streaming.

**Responsibilities**:
- Establishes WebSocket connections to LLM agents via `ChatRuntimeService`
- Manages session lifecycle (initialization → connected → cleanup)
- Subscribes to real-time status and message streams
- Provides imperative methods for sending messages and closing sessions
- Handles fiber cleanup and error recovery

**Interface**:
```typescript
function useAgentSession(agentId: string, chatId: string): {
  status: string;           // "initializing" | "connected" | "error"
  messages: ProtocolMessage[];  // Real-time message stream
  error: string | null;     // Connection/session errors
  sendMessage: (msg: ProtocolMessage) => void;  // Imperative send
  closeSession: () => void; // Imperative close
}
```

**Key Operations**:
1. **Session Establishment**: Creates scoped Effect.js program that establishes agent session
2. **Stream Subscription**: Subscribes to status and message streams using Effect streams
3. **Lifecycle Management**: Manages fiber lifecycle with proper cleanup on unmount
4. **Error Handling**: Catches and surfaces connection/session errors to UI

**Usage Pattern**:
```typescript
const { status, messages, sendMessage, error } = useAgentSession('agent-1', 'chat-123');

// Send a message
sendMessage({
  type: 'COMMAND',
  payload: { command: 'userMessage', data: { text: 'Hello' } }
});
```

---

### 🚀 useChatAppRuntime

**File**: `chat-app-runtime/useChatAppRuntime.ts` (114 lines)

**Purpose**: Composite hook that provides complete runtime state for chat applications.

**Responsibilities**:
- Fetches chat app configuration from `AppService`
- Loads associated toolbar configuration from `ToolbarService`
- Retrieves theme configuration from `ThemesService`
- Integrates with `useAgentSession` for live chat functionality
- Supports theme overrides for live preview/testing
- Combines all runtime data into unified state object

**Interface**:
```typescript
function useChatAppRuntime(
  chatAppId: string,
  themeOverride?: ChatAppTheme
): {
  config: ChatAppConfig | null;        // App configuration
  toolbar: ToolbarConfig | null;       // Toolbar configuration  
  theme: ChatAppTheme | null;          // Theme configuration
  loading: boolean;                    // Loading state
  error: string | null;                // Any loading errors
  status: string;                      // Agent session status
  messages: ProtocolMessage[];         // Live messages
  sendMessage: (msg: ProtocolMessage) => void; // Send to agent
}
```

**Key Operations**:
1. **Configuration Loading**: Parallel fetching of app config, toolbar, and theme
2. **Service Coordination**: Orchestrates multiple Effect.js services (App, Toolbar, Themes)
3. **Live Integration**: Establishes agent session based on app configuration
4. **State Composition**: Combines static config with live runtime state
5. **Theme Override**: Supports runtime theme replacement for testing

**Usage Pattern**:
```typescript
const runtime = useChatAppRuntime('app-123', optionalThemeOverride);

if (runtime.loading) return <LoadingSpinner />;
if (runtime.error) return <ErrorDisplay error={runtime.error} />;

// Use complete runtime state
return <ChatApp config={runtime.config} theme={runtime.theme} />;
```

---

### 💬 useChatInstance

**File**: `chat-instance/useChatInstance.ts` (227 lines)

**Purpose**: Comprehensive chat instance management with advanced state handling.

**Responsibilities**:
- Manages complex chat state machine (initializing → connecting → connected → error)
- Handles message streaming and accumulation from multiple sources
- Implements reconnection logic with exponential backoff
- Converts protocol messages to UI messages with MDX compilation
- Bridges Effect.js services with xState stores
- Provides imperative action dispatch interface

**Architecture**:
- Uses **3 xState stores**: `chatInstanceStore`, `agentStore`, `connectionStore`
- Integrates **ChatInstanceBridge** for Effect.js ↔ xState communication
- Manages complex service layer with proper cleanup

**Interface**:
```typescript
function useChatInstance(
  chatId: string,
  agentConfigData: ChatAgentConfig,
  injectedLayer?: Layer.Layer<any, any, any>
): {
  chatState: ChatInstanceHookState;     // Combined chat state
  runtimeError: AgentRuntimeError | null; // Runtime errors
  dispatchAction: (action: ChatInstanceAction) => void; // Action dispatch
}
```

**Key Operations**:
1. **State Machine Management**: Coordinates multiple xState stores for different concerns
2. **Service Integration**: Initializes complex Effect.js service layer
3. **Bridge Coordination**: Uses ChatInstanceBridge for Effect ↔ xState communication
4. **Message Processing**: Handles streaming message accumulation and MDX compilation
5. **Error Recovery**: Implements sophisticated error handling and recovery logic

**Usage Pattern**:
```typescript
const { chatState, dispatchAction, runtimeError } = useChatInstance(
  'chat-123',
  { agentId: 'agent-1', initialAgentName: 'Assistant' }
);

// Dispatch actions
dispatchAction({ type: 'SEND_MESSAGE', payload: { text: 'Hello' } });
dispatchAction({ type: 'CLEAR_MESSAGES' });
```

---

### 🎨 useChatTheme

**File**: `chat-theme/useChatTheme.ts` (61 lines)

**Purpose**: Pure utility hook for theme processing, parsing, and merging.

**Responsibilities**:
- Handles string theme parsing (JSON strings, named themes)
- Performs deep merging of partial themes with defaults
- Supports named themes ('system', 'dark', 'light')
- Provides memoized theme computation for performance
- Error recovery for malformed theme data

**Interface**:
```typescript
function useChatTheme(
  theme?: Partial<ChatAppTheme> | string
): ChatAppTheme
```

**Key Operations**:
1. **String Parsing**: Handles JSON string themes and named theme strings
2. **Deep Merging**: Recursively merges partial theme objects with defaults
3. **Named Theme Support**: Recognizes and processes built-in theme names
4. **Error Recovery**: Falls back to default theme on parse errors
5. **Memoization**: Optimized recalculation only when input changes

**Usage Pattern**:
```typescript
// Object theme
const theme1 = useChatTheme({ 
  colors: { primary: '#ff0000' } 
});

// JSON string theme
const theme2 = useChatTheme('{"colors":{"primary":"#00ff00"}}');

// Named theme
const theme3 = useChatTheme('dark');
```

---

### 🔧 useDynamicToolbar

**File**: `dynamic-toolbar/useDynamicToolbar.ts` (71 lines)

**Purpose**: Synchronizes toolbar button states with application store state.

**Responsibilities**:
- Subscribes to multiple xState stores for UI state
- Updates toolbar button active states based on store state
- Provides reactive toolbar configuration
- Maintains store reactivity through `useSelector`
- Maps store state to toolbar command states

**Monitored Stores**:
- `appLayoutStore` - Sidebar open/closed state
- `themeStore` - Theme editor visibility
- `clerkAdminStore` - Admin panel visibility
- `sidebarToolStore` - Sidebar tool visibility
- `errorManagerStore` - Error manager visibility
- `debugToolStore` - Debug tool visibility

**Interface**:
```typescript
function useDynamicToolbar(baseConfig: ToolbarConfig): ToolbarConfig
```

**Key Operations**:
1. **Store Subscription**: Uses `useSelector` for reactive store subscriptions
2. **State Mapping**: Maps store state to toolbar button active states
3. **Configuration Update**: Creates updated toolbar config with current states
4. **Memoization**: Optimized recalculation based on store state changes

**Usage Pattern**:
```typescript
const baseToolbarConfig = { items: [...] };
const dynamicConfig = useDynamicToolbar(baseToolbarConfig);

// dynamicConfig.items will have updated active states
return <Toolbar config={dynamicConfig} />;
```

---

### 🌈 useThemeIntegration

**File**: `theme-integration/useThemeIntegration.ts` (23 lines)

**Purpose**: Bridges next-themes with internal theme store state.

**Responsibilities**:
- Subscribes to next-themes theme changes
- Updates internal `themeStore` when next-themes changes
- Maintains synchronization between external and internal theme state
- Provides raw theme value for consumption

**Interface**:
```typescript
function useThemeIntegration(): {
  rawTheme: string | undefined;
}
```

**Key Operations**:
1. **Theme Subscription**: Listens to next-themes theme changes
2. **Store Synchronization**: Updates `themeStore` with raw theme values
3. **Integration Bridge**: Connects external theme provider to internal state

**Usage Pattern**:
```typescript
// Usually used in root layout or theme provider
function ThemeProvider({ children }) {
  useThemeIntegration(); // Automatic synchronization
  
  return <NextThemesProvider>{children}</NextThemesProvider>;
}
```

---

## Architecture Patterns

### 🏗️ Service Lifecycle Management
Hooks like `useAgentSession` and `useChatInstance` manage Effect.js service lifecycles:
```typescript
useEffect(() => {
  const program = Effect.gen(function* () {
    const service = yield* ServiceClass;
    // Use service
  });
  
  const fiber = Effect.runFork(program);
  return () => Fiber.interrupt(fiber); // Cleanup
}, [dependencies]);
```

### 🔄 Store Synchronization
Hooks like `useDynamicToolbar` and `useThemeIntegration` sync external state:
```typescript
const storeValue = useSelector(store, selector);

useEffect(() => {
  externalSystem.update(storeValue);
}, [storeValue]);
```

### 🧮 Pure Computation
Hooks like `useChatTheme` provide memoized calculations:
```typescript
const result = useMemo(() => {
  return expensiveComputation(input);
}, [input]);
```

### 🌉 Effect.js ↔ xState Bridge
Complex hooks like `useChatInstance` bridge Effect.js services with xState stores:
```typescript
// Effect.js handles business logic
const program = Effect.gen(function* () {
  const result = yield* businessLogic();
  
  // Bridge to xState store
  return Effect.sync(() => {
    store.send({ type: 'UPDATE', data: result });
  });
});
```

---

## Usage Guidelines

### ✅ When to Use Each Hook

**useAgentSession**:
- Direct agent communication needed
- Real-time message streaming required
- Session lifecycle management necessary

**useChatAppRuntime**:
- Building complete chat applications
- Need unified config + runtime state
- Composite data fetching required

**useChatInstance**:
- Complex chat interfaces
- Advanced state management needed
- Multiple store coordination required

**useChatTheme**:
- Theme processing and merging
- Support for multiple theme formats
- Performance-optimized theme computation

**useDynamicToolbar**:
- Toolbar with reactive button states
- UI state synchronization needed
- Multiple store dependencies

**useThemeIntegration**:
- Integrating with next-themes
- Theme store synchronization needed
- Root-level theme management

### ❌ Anti-patterns to Avoid

1. **Don't bypass hooks for direct service access** in React components
2. **Don't mix Effect.js code directly in React** - use hooks as bridges
3. **Don't create hooks for simple one-off operations** - use Effect.runPromise
4. **Don't duplicate hook functionality** - compose existing hooks instead

---

## Testing Approach

Each hook follows specific testing patterns:

- **Service Integration Hooks**: Test lifecycle and state transitions
- **Pure Computation Hooks**: Test calculation logic and edge cases  
- **Store Synchronization Hooks**: Test reactive updates and store integration
- **Bridge Hooks**: Test Effect.js ↔ React integration without testing service logic

See individual `*.test.ts` files for comprehensive test examples.

---

## Related Documentation

- **Services**: `../services/` - Effect.js service implementations
- **Stores**: `../stores/` - xState store definitions
- **Types**: `../types/` - TypeScript type definitions
- **Components**: `../components/` - React components that consume these hooks 