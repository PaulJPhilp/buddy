# Buddy Chat Application Architecture

**A comprehensive guide to the Buddy chat application ecosystem - from static components to dynamic chat construction and real-time LLM interactions.**

## Table of Contents

1. [Overview](#overview)
2. [Static Component Hierarchy](#static-component-hierarchy)
3. [Dynamic Chat App Construction](#dynamic-chat-app-construction)
4. [LLM Agent WebSocket Server](#llm-agent-websocket-server)
5. [Complete Data Flow](#complete-data-flow)
6. [Package Architecture](#package-architecture)
7. [Development Workflow](#development-workflow)

---

## Overview

The Buddy chat application is a modern, scalable chat platform built with:

- **Frontend**: Next.js 15 with TypeScript, React, and Tailwind CSS
- **Backend**: Effect.js HTTP API server with SQLite database
- **LLM Server**: WebSocket-based AI agent server using Google Gemini
- **Architecture**: Clean separation between Effect.js services, xState stores, and React components
- **Protocol**: Standardized WebSocket messaging via `@buddy/protocol`

### Key Design Principles

1. **Effect/React Isolation**: Clean separation between functional Effect.js services and React UI
2. **Event-Driven Architecture**: xState stores bridge Effect services to React components
3. **Protocol-First Communication**: Standardized WebSocket messaging for all agent interactions
4. **Dynamic Configuration**: Chat apps are constructed dynamically from configuration objects
5. **Modular Packages**: Shared UI components, API schemas, and protocol definitions

---

## Static Component Hierarchy

### 1. Package Structure

```
packages/
├── ui/                     # Shared UI components and utilities
│   ├── components/
│   │   ├── ui/            # Base UI components (buttons, inputs, etc.)
│   │   ├── chat/          # Chat-specific components (ChatBubble, etc.)
│   │   ├── Icon.tsx       # Icon component system
│   │   ├── ToolBar.tsx    # Toolbar component
│   │   └── ...
│   ├── lib/utils.ts       # Utility functions (cn, etc.)
│   └── styles/            # Shared styles
├── api/                   # HTTP API schemas and groups
│   ├── schemas/           # Data schemas (User, Prompt, etc.)
│   └── groups/            # API endpoint groups
└── protocol/              # WebSocket protocol definitions
    └── WebSocketMessage.ts # Standardized message format
```

### 2. Client App Structure

```
apps/client/src/
├── app/                   # Next.js app router
├── components/            # React components
│   ├── ChatApp.tsx       # Main chat application component
│   └── ...
├── hooks/                 # React hooks
│   └── chat-instance/    # Chat instance management
│       ├── useChatInstance.ts    # Main hook bridging Effect to React
│       ├── stores/              # xState stores
│       └── bridges/             # Effect ↔ xState bridges
├── services/              # Effect.js services
│   ├── app/              # App configuration service
│   ├── chat/             # Chat services
│   ├── chat-runtime/     # Runtime chat services
│   ├── chat-instance/    # Chat instance services
│   ├── websocket/        # WebSocket communication
│   ├── themes/           # Theme management
│   └── toolbar/          # Toolbar configuration
├── schemas/              # TypeScript schemas
├── stores/               # xState store definitions
└── types/                # TypeScript type definitions
```

### 3. Server App Structure

```
apps/server/src/
├── index.ts              # Main server entry point
├── User.ts               # User management endpoints
├── Prompt.ts             # Prompt management endpoints
├── PromptVoice.ts        # Voice prompt endpoints
├── database.ts           # Database configuration
├── config.ts             # Server configuration
└── migrations/           # Database migrations
```

### 4. LLM Agent Structure

```
llm-agent/
├── index.ts              # Main WebSocket server (328 lines)
├── start-llm-server.ts   # Helper startup script
├── test-client-effect.ts # Effect.js test client
├── __tests__/            # Comprehensive test suite
└── README.md             # Server documentation
```

---

## Dynamic Chat App Construction

### 1. Configuration-Driven Architecture

Chat applications are dynamically constructed from configuration objects:

```typescript
interface ChatAppConfig {
  id: string;           // Unique chat app identifier
  name: string;         // Display name
  agentId: string;      // LLM agent to connect to
  toolbarId: string;    // Toolbar configuration
  themeId: string;      // Theme configuration
}
```

### 2. Service Layer Architecture

The application uses a layered service architecture with Effect.js:

```typescript
// Service Dependencies (bottom to top)
WebSocketService           // Raw WebSocket communication
  ↓
ChatRuntimeService        // Agent session management
  ↓
AgentCommunicationService // High-level agent communication
  ↓
ChatInstanceService       // Chat instance coordination
  ↓
AppService               // Application configuration
```

### 3. Effect → xState → React Bridge

The architecture maintains clean separation between layers:

```typescript
// Effect.js Services (Business Logic)
ChatInstanceService.sendMessage(text) 
  ↓
// xState Stores (State Management)  
chatInstanceStore.send({ type: 'MESSAGE_SENT', text })
  ↓
// React Hooks (UI Bridge)
const { chatState, dispatchAction } = useChatInstance(config)
  ↓
// React Components (UI)
<ChatApp config={config} />
```

### 4. Dynamic Construction Flow

1. **Configuration Loading**: `AppService` loads `ChatAppConfig` from database/API
2. **Service Initialization**: Effect services are initialized with configuration
3. **Store Creation**: xState stores are created and connected to services
4. **Component Rendering**: React components receive state via hooks
5. **Runtime Connection**: WebSocket connection established to LLM agent

---

## LLM Agent WebSocket Server

### 1. Server Architecture

The LLM agent server (`llm-agent/index.ts`) provides:

- **WebSocket Server**: Handles multiple concurrent chat connections
- **Google Gemini Integration**: Uses `@ai-sdk/google` for LLM processing
- **Streaming Responses**: Real-time response streaming with rich markdown
- **Protocol Compliance**: Uses `@buddy/protocol` for standardized messaging
- **Session Management**: Per-connection conversation history

### 2. Message Processing Pipeline

```typescript
// Incoming WebSocket Message
WebSocket.onmessage(data)
  ↓
// Protocol Parsing
parseMessage(data) → WebSocketMessage
  ↓
// Message Routing
switch (message.type) {
  case 'COMMAND': handleCommand()
  case 'QUERY': handleQuery()
  case 'EVENT': handleEvent()
}
  ↓
// LLM Processing
callLLM(inputText, ws, chatId)
  ↓
// Streaming Response
for await (const delta of result.textStream) {
  ws.send(createMessage('LLM_STREAM', delta))
}
```

### 3. Rich Markdown Support

The server generates responses with comprehensive markdown formatting:

- **Headers and Sub-headers**: `## Main Topic`, `### Sub-topic`
- **Text Formatting**: **bold**, *italic*, `inline code`
- **Code Blocks**: ```language syntax highlighting```
- **Lists**: Bulleted and numbered lists
- **Tables**: Structured data presentation
- **Blockquotes**: > Important notes and quotes
- **Links**: [External references](https://example.com)

---

## Complete Data Flow

### User Input → LLM Response Journey

Here's the complete data flow from when a user enters a prompt to when the response is fully displayed:

#### 1. User Input (React Layer)

```typescript
// User types in chat input and presses enter
<ChatInput onSubmit={(text) => dispatchAction({ 
  type: 'SEND_MESSAGE', 
  payload: { text } 
})} />
```

#### 2. Hook Processing (React → xState Bridge)

```typescript
// useChatInstance.ts
const dispatchAction = useCallback((action: ChatInstanceAction) => {
  if (!bridge) return;
  
  Effect.runFork(
    bridge.processAction(action).pipe(
      Effect.catchAll(error => Effect.logError("Action processing failed", error))
    )
  );
}, [bridge]);
```

#### 3. Bridge Coordination (xState → Effect Bridge)

```typescript
// ChatInstanceBridge.ts
processAction: (action: ChatInstanceAction) => Effect.gen(function* () {
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Update stores
      chatInstanceStore.send({ type: 'MESSAGE_SENDING', text: action.payload.text });
      
      // Delegate to services
      const communicationService = yield* AgentCommunicationService;
      yield* communicationService.sendMessage(action.payload.text);
      break;
  }
})
```

#### 4. Service Layer Processing (Effect.js)

```typescript
// AgentCommunicationService.ts
sendMessage: (text: string) => Effect.gen(function* () {
  const session = yield* getCurrentSession();
  
  // Create protocol message
  const message = createMessage('COMMAND', {
    command: 'userMessage',
    data: { text },
    __tag: 'CommandPayload'
  });
  
  // Send via WebSocket
  yield* session.send(message);
})
```

#### 5. WebSocket Transmission (Protocol Layer)

```typescript
// WebSocketService.ts
send: (message: WebSocketMessage) => Effect.gen(function* () {
  const ws = yield* ensureConnection;
  const serialized = JSON.stringify(message);
  
  yield* Effect.try({
    try: () => ws.send(serialized),
    catch: (error) => new WebSocketError("Send failed", "SEND_ERROR")
  });
})
```

#### 6. LLM Server Processing (llm-agent)

```typescript
// llm-agent/index.ts
wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const message = parseMessage(data.toString());
    
    if (message.type === 'COMMAND' && message.payload.command === 'userMessage') {
      const inputText = message.payload.data.text;
      await callLLM(inputText, ws, chatId);
    }
  });
});

async function callLLM(inputText: string, ws: WebSocket, chatId: string) {
  // Add to conversation history
  history.push({ role: 'user', content: inputText });
  
  // Send thinking state
  ws.send(createSimpleMessage('THINKING', 'true'));
  
  // Stream LLM response
  const result = await streamText({
    model: google('models/gemini-1.5-flash-latest'),
    messages: history,
    temperature: 0.7,
    maxTokens: 2000
  });
  
  // Send thinking state off
  ws.send(createSimpleMessage('THINKING', 'false'));
  
  // Stream response chunks
  for await (const delta of result.textStream) {
    ws.send(createSimpleMessage('LLM_STREAM', delta));
  }
  
  // Send completion
  ws.send(createSimpleMessage('LLM_RESPONSE', fullContent));
}
```

#### 7. Response Reception (WebSocket → Effect)

```typescript
// WebSocketService.ts
ws.onmessage = (event) => {
  const parsed = JSON.parse(event.data);
  const protocolMessage: ProtocolMessage = {
    id: parsed.id || crypto.randomUUID(),
    type: parsed.type || "SYSTEM",
    payload: parsed,
    // ... other fields
  };
  
  // Broadcast to all subscribers
  broadcastMessage(protocolMessage);
};
```

#### 8. Service Layer Response Handling (Effect.js)

```typescript
// AgentCommunicationService.ts
startMessageProcessing: (session: AgentSession) => Effect.gen(function* () {
  yield* Stream.runForEach(session.incomingMessages$, (message) =>
    Effect.gen(function* () {
      switch (message.type) {
        case 'LLM_STREAM':
          // Update streaming state
          agentStore.send({ 
            type: 'STREAM_CHUNK_RECEIVED', 
            chunk: message.payload.content 
          });
          break;
          
        case 'LLM_RESPONSE':
          // Complete message received
          chatInstanceStore.send({
            type: 'MESSAGE_RECEIVED',
            message: {
              id: crypto.randomUUID(),
              text: message.payload.content,
              sender: 'assistant',
              timestamp: Date.now()
            }
          });
          break;
      }
    })
  );
})
```

#### 9. Store Updates (xState)

```typescript
// stores/chatInstanceStore.ts
const chatInstanceStore = createStore({
  messages: [],
  isTyping: false
}, {
  MESSAGE_RECEIVED: (context, event) => ({
    ...context,
    messages: [...context.messages, event.message],
    isTyping: false
  }),
  
  STREAM_CHUNK_RECEIVED: (context, event) => ({
    ...context,
    isTyping: true,
    streamingContent: (context.streamingContent || '') + event.chunk
  })
});
```

#### 10. React Re-render (UI Update)

```typescript
// useChatInstance.ts
const chatInstanceState = useStore(chatInstanceStore, chatInstanceSelectors.getState);
const agentState = useStore(agentStore, agentSelectors.getState);

const chatState: ChatInstanceHookState = useMemo(() => {
  const chatMessages = chatInstanceState.messages || [];
  const pendingMessages = agentState.pendingMessages || [];
  
  return {
    chatId: chatInstanceState.chatId,
    messages: [...chatMessages, ...pendingMessages],
    status: chatInstanceState.status,
    agentName: chatInstanceState.agentName,
    isTyping: chatInstanceState.isTyping
  };
}, [chatInstanceState, agentState]);

// ChatApp.tsx
export function ChatApp({ config }: ChatAppProps) {
  const { chatState, dispatchAction } = useChatInstance(config);
  
  return (
    <div>
      <MessageList messages={chatState.messages} />
      {chatState.isTyping && <TypingIndicator />}
      <ChatInput onSubmit={(text) => dispatchAction({ 
        type: 'SEND_MESSAGE', 
        payload: { text } 
      })} />
    </div>
  );
}
```

### Data Flow Summary

1. **User Input** → React component event handler
2. **Action Dispatch** → useChatInstance hook processes action
3. **Bridge Processing** → ChatInstanceBridge coordinates between layers
4. **Service Execution** → Effect.js services handle business logic
5. **WebSocket Send** → Message sent to LLM agent server
6. **LLM Processing** → Google Gemini generates streaming response
7. **WebSocket Receive** → Response chunks received by client
8. **Service Processing** → Effect services process incoming messages
9. **Store Updates** → xState stores update with new data
10. **React Re-render** → UI updates with new messages and state

---

## Package Architecture

### 1. Shared Packages

#### `packages/ui`
- **Purpose**: Shared UI components and utilities
- **Exports**: React components, utility functions, styles
- **Usage**: Imported by all apps for consistent UI

#### `packages/api`
- **Purpose**: HTTP API schemas and endpoint definitions
- **Structure**: Separated schemas and API groups
- **Usage**: Shared between client and server for type safety

#### `packages/protocol`
- **Purpose**: WebSocket protocol definitions
- **Exports**: `WebSocketMessage` type, `createMessage`, `parseMessage`
- **Usage**: Ensures consistent messaging between client and LLM agent

### 2. Application Packages

#### `apps/client`
- **Purpose**: Next.js frontend application
- **Architecture**: Effect.js services → xState stores → React hooks → React components
- **Features**: Dynamic chat app construction, real-time messaging, theme system

#### `apps/server`
- **Purpose**: HTTP API server for data management
- **Architecture**: Effect.js HTTP API with SQLite database
- **Features**: User management, prompt storage, configuration APIs

#### `llm-agent`
- **Purpose**: WebSocket-based LLM agent server
- **Architecture**: WebSocket server with Google Gemini integration
- **Features**: Real-time chat, streaming responses, rich markdown formatting

---

## Development Workflow

### 1. Starting the Development Environment

```bash
# Install dependencies
bun install

# Start the HTTP API server (port 3001)
cd apps/server
bun run dev

# Start the LLM agent server (port 8080)
cd llm-agent
bun run dev

# Start the client application (port 3000)
cd apps/client
bun run dev
```

### 2. Testing

```bash
# Run all tests
bun test

# Test specific packages
cd packages/protocol && bun test
cd llm-agent && bun test
cd apps/client && bun test
```

### 3. Building

```bash
# Build all packages
bun run build

# Build specific packages
cd packages/ui && bun run build
cd apps/client && bun run build
cd apps/server && bun run build
```

### 4. Key Development Patterns

#### Adding New Chat Features
1. **Define types** in `apps/client/src/types/`
2. **Create Effect service** in `apps/client/src/services/`
3. **Add xState store** in `apps/client/src/stores/`
4. **Update bridge** in `apps/client/src/hooks/chat-instance/bridges/`
5. **Create React hook** in `apps/client/src/hooks/`
6. **Build UI component** using `packages/ui` components

#### Extending the Protocol
1. **Update types** in `packages/protocol/src/WebSocketMessage.ts`
2. **Update client handling** in WebSocket services
3. **Update server handling** in `llm-agent/index.ts`
4. **Add tests** for new message types

#### Adding UI Components
1. **Create component** in `packages/ui/src/components/`
2. **Export from index** in `packages/ui/src/index.ts`
3. **Use in apps** by importing from `@ui/components/`

---

## Architecture Benefits

### 1. Separation of Concerns
- **Effect.js**: Pure functional business logic
- **xState**: Predictable state management
- **React**: Declarative UI rendering
- **Protocol**: Standardized communication

### 2. Scalability
- **Modular packages**: Easy to extend and maintain
- **Service-oriented**: Clear boundaries and dependencies
- **Event-driven**: Loose coupling between components
- **Type-safe**: End-to-end TypeScript safety

### 3. Developer Experience
- **Hot reloading**: Fast development iteration
- **Comprehensive testing**: Unit and integration tests
- **Clear patterns**: Consistent architecture across features
- **Rich tooling**: Effect.js debugging and xState devtools

### 4. Production Ready
- **Error handling**: Comprehensive error boundaries
- **Performance**: Optimized rendering and state updates
- **Monitoring**: Structured logging and observability
- **Deployment**: Container-ready with proper configuration

---

This architecture provides a robust foundation for building scalable, maintainable chat applications with real-time LLM interactions while maintaining clean separation of concerns and excellent developer experience. 