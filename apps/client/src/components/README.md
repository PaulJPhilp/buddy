# Components Directory

This directory contains all React components for the Buddy Chat Client. After extensive cleanup and refactoring, we have achieved a clean, focused component architecture that follows consistent patterns and naming conventions.

## 🏗️ Component Architecture

Our components follow the **Pure Effect Service Pattern** where:
- React components are thin UI wrappers
- All business logic lives in Effect.js services
- Components use `Runtime.runPromise()` for Effect operations
- State management is minimal and UI-focused only

## 📁 Component Structure

All components follow the **PascalCase folder convention** with consistent structure:

```
ComponentName/
├── ComponentName.tsx    # Main component implementation
└── index.ts            # Barrel export
```

## 🧩 Current Components

### **Core Chat Components**

#### `ChatApp/`
- **Purpose**: Main chat application orchestrator
- **Responsibilities**: 
  - Integrates ChatService, AgentService, AppService, ToolbarService
  - Manages chat lifecycle (initialize, send messages, clear history)
  - Handles expand/collapse functionality
  - Provides chat configuration management
- **Pattern**: Pure Effect Service Pattern
- **Key Features**: Real-time messaging, agent integration, dynamic configuration

#### `ChatArea/`
- **Purpose**: Message display and conversation area
- **Responsibilities**:
  - Renders chat messages with proper styling
  - Handles message scrolling and overflow
  - Displays conversation history
  - Manages message layout and formatting
- **Integration**: Uses shared `ChatBubble` from `packages/ui`

#### `HeaderBar/`
- **Purpose**: Chat header with controls and status
- **Responsibilities**:
  - Displays chat title and status
  - Provides expand/collapse button
  - Shows clear conversation controls
  - Renders custom children (buttons, indicators)
- **Features**: Flexible children support, status indicators

#### `UserArea/`
- **Purpose**: User input and interaction controls
- **Responsibilities**:
  - Message input field and send functionality
  - Attachment handling and file uploads
  - Agent toolbar integration
  - User interaction controls
- **Components**: `AgentToolBar.tsx`, `AttachmentBar.tsx`

### **Infrastructure Components**

#### `AppShell/`
- **Purpose**: Main application layout and shell
- **Responsibilities**:
  - Provides overall app structure and layout
  - Integrates toolbar and sidebar functionality
  - Manages app-level state and configuration
  - Handles responsive design and layout switching
- **Integration**: Uses Toolbar and sidebar components

#### `Chat/`
- **Purpose**: Chat container and orchestration
- **Responsibilities**:
  - Manages multiple chat instances
  - Handles chat routing and selection
  - Provides chat context and configuration
  - Integrates with layout system
- **Component**: `ChatContainer.tsx`

#### `Toolbar/`
- **Purpose**: Dynamic toolbar system
- **Responsibilities**:
  - Provides configurable toolbar interface
  - Supports multiple toolbar layouts (main, compact)
  - Integrates with dynamic toolbar hooks
  - Manages toolbar state and interactions
- **Features**: Command system, custom elements, responsive design

## 🎯 Design Principles

### **1. Single Responsibility**
Each component has one clear purpose and responsibility.

### **2. Pure Effect Integration**
Components use Effect services directly via `Runtime.runPromise()`:

```typescript
const handleSendMessage = async (message: string) => {
  try {
    await Runtime.runPromise(
      ChatService.sendMessage(chatId, message)
    )
  } catch (error) {
    console.error("Failed to send message:", error)
  }
}
```

### **3. Minimal React State**
React state is only used for UI concerns:
- `isExpanded` for UI visibility
- `isLoading` for loading indicators
- Local form state for inputs

### **4. Service Dependencies**
Components declare their service dependencies clearly:
- ChatService for chat operations
- AgentService for agent interactions
- AppService for app-level operations
- ToolbarService for toolbar management

### **5. Type Safety**
All components use proper TypeScript interfaces:
- Props interfaces for component contracts
- Service types for Effect operations
- Domain types for business logic

## 🔄 Component Lifecycle

### **Initialization Pattern**
```typescript
useEffect(() => {
  const initializeChat = async () => {
    try {
      await Runtime.runPromise(
        ChatService.initialize(chatId)
      )
    } catch (error) {
      console.error("Chat initialization failed:", error)
    }
  }
  
  initializeChat()
}, [chatId])
```

### **Event Handling Pattern**
```typescript
const handleAction = async (data: ActionData) => {
  try {
    const result = await Runtime.runPromise(
      ServiceName.performAction(data)
    )
    // Handle success
  } catch (error) {
    // Handle error
  }
}
```

## 🧪 Testing Strategy

Components follow our **no-mocking testing approach**:
- Tests use real services and dependencies
- Integration tests verify complete workflows
- E2E tests validate user interactions
- No `vi.mock()` or artificial mocking

## 📚 Usage Examples

### **Basic Component Usage**
```typescript
import { ChatApp } from "@/components/ChatApp"

export function MyPage() {
  return (
    <ChatApp 
      chatId="my-chat-id"
      config={chatConfig}
      onExpand={handleExpand}
    />
  )
}
```

### **Service Integration**
```typescript
import { Runtime } from "effect"
import { ChatService } from "@/services/chat"

const component = () => {
  const handleAction = async () => {
    const result = await Runtime.runPromise(
      ChatService.performOperation()
    )
    return result
  }
  
  return <div onClick={handleAction}>Action</div>
}
```

## 🚀 Development Guidelines

### **Adding New Components**

1. **Create folder structure**:
   ```
   NewComponent/
   ├── NewComponent.tsx
   └── index.ts
   ```

2. **Follow naming convention**: PascalCase for folders and files

3. **Use Pure Effect Pattern**: Integrate with Effect services, minimal React state

4. **Add proper TypeScript**: Define interfaces for props and state

5. **Write tests**: Follow no-mocking approach with real dependencies

### **Component Checklist**

- [ ] Follows PascalCase naming convention
- [ ] Has proper folder structure with index.ts
- [ ] Uses Effect services for business logic
- [ ] Minimal React state (UI concerns only)
- [ ] Proper TypeScript interfaces
- [ ] Error handling for Effect operations
- [ ] Tests without mocking
- [ ] Documentation in component file

## 🎉 Architecture Benefits

This clean component architecture provides:

- **Maintainability**: Clear separation of concerns
- **Testability**: Real dependencies, no mocking complexity
- **Scalability**: Easy to add new components and features
- **Type Safety**: Full TypeScript coverage
- **Consistency**: Uniform patterns across all components
- **Performance**: Efficient Effect service integration
- **Developer Experience**: Clear structure and conventions

---

*This component architecture represents the result of extensive cleanup and refactoring to achieve a production-ready, maintainable codebase following modern React and Effect.js best practices.* 