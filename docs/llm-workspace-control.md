# LLM Workspace Control: Design and Implementation Guide

## Overview

This document analyzes how to enable LLM control over the workspace system, focusing on CRUD operations for workspaces and chat apps. We compare two primary approaches: **Tool-Calling** vs **Local MCP Server** and provide implementation recommendations.

## Current Workspace System Architecture

### Core Components

1. **Workspace State Machine** (`workspaceStore.ts`)
   - XState-based state management
   - Event-driven architecture with UIEvent types
   - Comprehensive CRUD operations for workspaces and chat apps

2. **Service Layer** (`useServiceLayer.ts`)
   - Effect.js-based service architecture
   - Layered dependency injection
   - Shared configuration management

3. **UI Integration** (`useWorkspace.ts`)
   - React hooks for state access
   - Action dispatchers for state mutations
   - Selector-based data access patterns

## CRUD Operations Analysis

### Workspace CRUD Operations

#### Current Implementation
```typescript
// Create
createWorkspace(options: {
  name: string;
  color?: string;
  description?: string;
  icon?: string;
  availableAgents: string[];
}) => workspaceId

// Read
useCurrentWorkspace() => WorkspaceEntry | null
useWorkspaceStore(selector) => any
useActiveWorkspaces() => WorkspaceEntry[]

// Update
updateWorkspace(workspaceId: string, updates: Partial<WorkspaceEntry>)
activateWorkspace(workspaceId: string)
addAgentToWorkspace(workspaceId: string, agentId: string)

// Delete/Archive
archiveWorkspace(workspaceId: string)
restoreWorkspace(workspaceId: string)
```

#### UIEvent Types
```typescript
type WorkspaceEvents = 
  | "WORKSPACE_ADDED"
  | "WORKSPACE_UPDATED" 
  | "WORKSPACE_ACTIVATED"
  | "WORKSPACE_ARCHIVED"
  | "WORKSPACE_RESTORED"
  | "WORKSPACE_AGENT_ADDED"
  | "WORKSPACE_AGENT_REMOVED"
  | "WORKSPACE_LAYOUT_PREFERENCES_UPDATED"
  | "WORKSPACE_MAX_EXPANDED_APPS_UPDATED"
```

### Chat App CRUD Operations

#### Current Implementation
```typescript
// Create
addChatApps(apps: ChatAppConfig[])
// Individual: CHAT_APP_ADDED event

// Read
useChatAppsInCurrentWorkspace() => ChatAppEntry[]
useStashedChatApps() => ChatAppEntry[]

// Update
expandChatApp(workspaceId: string, appId: string)
compactChatApp(workspaceId: string, appId: string)
activateChatApp(workspaceId: string, appId: string)
stashChatApp(workspaceId: string, appId: string)
setChatAppStatus(workspaceId: string, appId: string, status: ChatAppStatus)

// Delete/Archive
closeChatApp(workspaceId: string, appId: string)
// Archive: CHAT_APP_ARCHIVED event
// Restore: CHAT_APP_RESTORED event
```

#### UIEvent Types
```typescript
type ChatAppEvents =
  | "CHAT_APP_ADDED"
  | "CHAT_APPS_ADDED"
  | "CHAT_APP_UPDATED"
  | "CHAT_APP_REMOVED"
  | "CHAT_APP_EXPANDED"
  | "CHAT_APP_COMPACTED"
  | "CHAT_APP_CLOSED"
  | "CHAT_APP_ARCHIVED"
  | "CHAT_APP_RESTORED"
  | "CHAT_APP_ACTIVATED"
  | "CHAT_APP_STASHED"
  | "CHAT_APP_FOCUS_ENTERED"
  | "CHAT_APP_FOCUS_EXITED"
```

## LLM Control Approaches

### Approach 1: Tool-Calling (Function Calling)

#### Architecture
```
LLM → Function Calls → Web UI JavaScript → Workspace Store → State Update
```

#### Implementation Pattern
```typescript
// Tool definitions for LLM
const workspaceTools = {
  create_workspace: {
    name: "create_workspace",
    description: "Create a new workspace",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Workspace name" },
        description: { type: "string", description: "Optional description" },
        icon: { type: "string", description: "Emoji icon" },
        color: { type: "string", description: "Hex color code" },
        availableAgents: { 
          type: "array", 
          items: { type: "string" },
          description: "List of available agent IDs"
        }
      },
      required: ["name", "availableAgents"]
    }
  },
  
  list_workspaces: {
    name: "list_workspaces",
    description: "List all workspaces with their status",
    parameters: { type: "object", properties: {} }
  },
  
  activate_workspace: {
    name: "activate_workspace", 
    description: "Switch to a specific workspace",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID to activate" }
      },
      required: ["workspaceId"]
    }
  }
  
  // ... more tools
}
```

#### Advantages
- **Direct Integration**: Functions execute in the same context as the UI
- **Real-time Updates**: Immediate state synchronization with UI
- **Type Safety**: Full TypeScript integration
- **Performance**: No network overhead for function execution
- **Debugging**: Easy to debug with browser dev tools

#### Disadvantages
- **Context Limitations**: Limited to single browser session
- **No Persistence**: Functions don't persist across page reloads
- **UI Dependency**: Requires active web UI to function
- **Limited Scope**: Can't control external systems

### Approach 2: Local MCP Server

#### Architecture
```
LLM → MCP Protocol → Local MCP Server → HTTP/WebSocket API → Workspace Store
```

#### Implementation Pattern
```typescript
// MCP Server Implementation
class WorkspaceMCPServer {
  private workspaceStore: WorkspaceStore;
  
  constructor() {
    this.workspaceStore = createWorkspaceStore();
  }
  
  // MCP Tool Implementations
  async createWorkspace(args: CreateWorkspaceArgs): Promise<MCPResult> {
    const workspaceId = this.workspaceStore.send({
      type: "WORKSPACE_ADDED",
      workspaceId: generateId(),
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      availableAgents: args.availableAgents
    });
    
    return {
      content: [{
        type: "text",
        text: `Created workspace "${args.name}" with ID: ${workspaceId}`
      }]
    };
  }
  
  async listWorkspaces(): Promise<MCPResult> {
    const state = this.workspaceStore.getSnapshot().context;
    const workspaces = Object.values(state.workspaces)
      .filter(w => !w.isArchived);
      
    return {
      content: [{
        type: "text", 
        text: JSON.stringify(workspaces, null, 2)
      }]
    };
  }
  
  // ... more methods
}
```

#### Advantages
- **Persistence**: State persists across browser sessions
- **Multi-Interface**: Can be controlled via CLI, web UI, other tools
- **Scalability**: Can handle multiple concurrent connections
- **External Access**: Other applications can interact with workspace
- **Protocol Standard**: Uses standardized MCP protocol

#### Disadvantages
- **Complexity**: Requires separate server process
- **Latency**: Network round-trips for each operation
- **Synchronization**: Need to sync state between server and UI
- **Setup Overhead**: Additional infrastructure to manage

## Recommended Architecture: Hybrid Approach

### Core Design

Combine both approaches for maximum flexibility:

1. **Primary Interface**: Tool-calling for direct UI interaction
2. **Persistent Layer**: Local MCP server for state persistence and external access
3. **Sync Mechanism**: WebSocket bridge between UI and MCP server

### Implementation Strategy

#### Phase 1: Tool-Calling Foundation
```typescript
// 1. Expose workspace actions as global functions
declare global {
  interface Window {
    buddyWorkspace: {
      createWorkspace: (options: CreateWorkspaceOptions) => Promise<string>;
      listWorkspaces: () => Promise<WorkspaceEntry[]>;
      activateWorkspace: (id: string) => Promise<void>;
      updateWorkspace: (id: string, updates: Partial<WorkspaceEntry>) => Promise<void>;
      archiveWorkspace: (id: string) => Promise<void>;
      
      // Chat App operations
      addChatApp: (workspaceId: string, config: ChatAppConfig) => Promise<void>;
      listChatApps: (workspaceId?: string) => Promise<ChatAppEntry[]>;
      expandChatApp: (workspaceId: string, appId: string) => Promise<void>;
      compactChatApp: (workspaceId: string, appId: string) => Promise<void>;
      stashChatApp: (workspaceId: string, appId: string) => Promise<void>;
      closeChatApp: (workspaceId: string, appId: string) => Promise<void>;
    };
  }
}

// 2. Initialize global API in app startup
function initializeBuddyWorkspaceAPI() {
  const { send } = useWorkspaceDispatch();
  const store = useWorkspaceStore();
  
  window.buddyWorkspace = {
    createWorkspace: async (options) => {
      const workspaceId = generateWorkspaceId(options.name);
      send({
        type: "WORKSPACE_ADDED",
        workspaceId,
        ...options
      });
      return workspaceId;
    },
    
    listWorkspaces: async () => {
      const state = store.getSnapshot().context;
      return Object.values(state.workspaces).filter(w => !w.isArchived);
    },
    
    // ... implement other methods
  };
}
```

#### Phase 2: MCP Server Integration
```typescript
// 1. Create workspace MCP server
class BuddyWorkspaceMCPServer extends MCPServer {
  private stateStore: WorkspaceStore;
  private webSocketBridge: WebSocketBridge;
  
  constructor() {
    super();
    this.stateStore = createWorkspaceStore();
    this.webSocketBridge = new WebSocketBridge();
    this.setupTools();
  }
  
  private setupTools() {
    this.addTool("workspace_create", this.createWorkspace.bind(this));
    this.addTool("workspace_list", this.listWorkspaces.bind(this));
    this.addTool("workspace_activate", this.activateWorkspace.bind(this));
    this.addTool("workspace_update", this.updateWorkspace.bind(this));
    this.addTool("workspace_archive", this.archiveWorkspace.bind(this));
    
    this.addTool("chatapp_add", this.addChatApp.bind(this));
    this.addTool("chatapp_list", this.listChatApps.bind(this));
    this.addTool("chatapp_expand", this.expandChatApp.bind(this));
    this.addTool("chatapp_compact", this.compactChatApp.bind(this));
    this.addTool("chatapp_stash", this.stashChatApp.bind(this));
    this.addTool("chatapp_close", this.closeChatApp.bind(this));
  }
  
  // Tool implementations...
}

// 2. WebSocket bridge for real-time sync
class WebSocketBridge {
  private wsServer: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  
  constructor() {
    this.wsServer = new WebSocketServer({ port: 8081 });
    this.setupEventHandlers();
  }
  
  broadcastStateChange(event: UIEvent) {
    const message = JSON.stringify({ type: "state_change", event });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
```

#### Phase 3: CLI Interface
```bash
# CLI tool using MCP server
buddy workspace create "My Workspace" --description "Work project" --icon "💼"
buddy workspace list
buddy workspace activate workspace-123
buddy chatapp add workspace-123 --config simple-chat.json
buddy chatapp expand workspace-123 app-456
```

## Key Use Cases and Implementation

### Use Case 1: Workspace Management

#### Natural Language Commands
```
"Create a new workspace called 'Project Alpha' with a rocket icon"
"List all my workspaces and their current status"
"Switch to the 'Development' workspace"
"Archive the old 'Testing' workspace"
"Add the business-agent to my current workspace"
```

#### Tool Definitions
```typescript
const workspaceManagementTools = [
  {
    name: "create_workspace",
    description: "Create a new workspace for organizing chat applications",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Human-readable workspace name" },
        description: { type: "string", description: "Optional workspace description" },
        icon: { type: "string", description: "Emoji icon (e.g., 🚀, 💼, 🏠)" },
        color: { type: "string", description: "Hex color code (e.g., #3b82f6)" },
        availableAgents: {
          type: "array",
          items: { type: "string" },
          description: "Agent IDs available in this workspace",
          default: ["default-agent"]
        }
      },
      required: ["name"]
    }
  },
  
  {
    name: "list_workspaces", 
    description: "Get all workspaces with their status and active chat apps",
    parameters: {
      type: "object",
      properties: {
        includeArchived: { 
          type: "boolean", 
          description: "Include archived workspaces",
          default: false 
        }
      }
    }
  },
  
  {
    name: "activate_workspace",
    description: "Switch to a different workspace",
    parameters: {
      type: "object", 
      properties: {
        workspaceId: { type: "string", description: "Workspace ID or name" }
      },
      required: ["workspaceId"]
    }
  }
];
```

### Use Case 2: Chat App Management

#### Natural Language Commands
```
"Add a new simple chat app to my current workspace"
"Expand the pink buddy chat app"
"Show me all chat apps in compact view"
"Stash the chat app I'm not using"
"Close the debugging chat app"
"Enter focus mode on the main chat"
```

#### Tool Definitions
```typescript
const chatAppManagementTools = [
  {
    name: "add_chat_app",
    description: "Add a new chat application to a workspace",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Target workspace ID" },
        configId: { 
          type: "string", 
          description: "Chat app configuration ID",
          enum: ["simple-chat", "pink-buddy", "slate-buddy", "teal-buddy"]
        },
        customConfig: {
          type: "object",
          description: "Custom configuration object",
          properties: {
            name: { type: "string" },
            agentId: { type: "string" },
            theme: { type: "object" }
          }
        }
      },
      required: ["workspaceId"]
    }
  },
  
  {
    name: "list_chat_apps",
    description: "List chat applications in workspace(s)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Specific workspace (current if omitted)" },
        status: { 
          type: "string", 
          enum: ["expanded", "compact", "stashed", "closed"],
          description: "Filter by status"
        }
      }
    }
  },
  
  {
    name: "set_chat_app_status",
    description: "Change the display status of a chat application",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace containing the app" },
        appId: { type: "string", description: "Chat app ID" },
        status: { 
          type: "string",
          enum: ["expanded", "compact", "stashed", "closed"],
          description: "New status for the chat app"
        }
      },
      required: ["workspaceId", "appId", "status"]
    }
  },
  
  {
    name: "enter_focus_mode",
    description: "Enter focus mode on a specific chat app (hides all others)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        appId: { type: "string", description: "Chat app to focus on" }
      },
      required: ["workspaceId", "appId"]
    }
  },
  
  {
    name: "exit_focus_mode",
    description: "Exit focus mode and restore previous chat app states",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" }
      },
      required: ["workspaceId"]
    }
  }
];
```

## Implementation Roadmap

### Phase 1: Core Tool-Calling (Week 1-2)
1. ✅ Expose workspace actions as global functions
2. ✅ Create tool definitions for workspace CRUD
3. ✅ Create tool definitions for chat app CRUD  
4. ✅ Implement error handling and validation
5. ✅ Add comprehensive logging

### Phase 2: MCP Server Foundation (Week 3-4)
1. ⏳ Create local MCP server with workspace tools
2. ⏳ Implement WebSocket bridge for state sync
3. ⏳ Add persistence layer for workspace state
4. ⏳ Create CLI interface for workspace management

### Phase 3: Advanced Features (Week 5-6)
1. ⏳ Multi-workspace operations
2. ⏳ Bulk chat app management
3. ⏳ Workspace templates and presets
4. ⏳ Advanced querying and filtering
5. ⏳ Integration with external systems

### Phase 4: Polish and Optimization (Week 7-8)
1. ⏳ Performance optimization
2. ⏳ Enhanced error handling
3. ⏳ Comprehensive testing
4. ⏳ Documentation and examples

## Comparison Summary

| Feature | Tool-Calling | MCP Server | Hybrid |
|---------|-------------|------------|--------|
| **Setup Complexity** | Low | High | Medium |
| **Real-time UI Updates** | Excellent | Good | Excellent |
| **Multi-Interface Support** | Poor | Excellent | Excellent |
| **State Persistence** | Poor | Excellent | Excellent |
| **Performance** | Excellent | Good | Good |
| **Development Speed** | Fast | Slow | Medium |
| **Scalability** | Limited | High | High |
| **Debugging** | Easy | Medium | Medium |

## Recommendation

**Implement the Hybrid Approach** starting with tool-calling for immediate functionality, then adding MCP server for persistence and multi-interface support. This provides:

1. **Immediate Value**: Tool-calling gives instant LLM control
2. **Future Flexibility**: MCP server enables CLI and external access
3. **Best Performance**: Direct UI integration where possible
4. **Maximum Compatibility**: Works with any LLM that supports function calling

The hybrid approach balances development speed, functionality, and future extensibility while providing the best user experience across all interfaces. 