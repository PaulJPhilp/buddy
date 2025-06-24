# LLM Workspace Integration Example

This document provides a practical example of how to integrate LLM control with the workspace system using both tool-calling and MCP server approaches.

## Integration Setup

### 1. App Component Integration

Add the LLM API initialization to your main app component:

```typescript
// apps/client/src/app/layout.tsx or main component
"use client";

import { useBuddyWorkspaceAPI } from "@/utils/llm-workspace-implementation";
import { useEffect } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize the LLM workspace API
  useBuddyWorkspaceAPI();
  
  useEffect(() => {
    // Verify API is available
    if (window.buddyWorkspace) {
      console.log("✅ Buddy Workspace API is ready for LLM control");
    }
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

### 2. Tool-Calling Integration

#### OpenAI Function Calling Example

```typescript
// LLM integration with OpenAI
import { ALL_WORKSPACE_TOOLS, LLM_TOOL_FUNCTIONS } from "@/utils/llm-workspace-api";
import { LLM_TOOL_FUNCTIONS } from "@/utils/llm-workspace-implementation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chatWithWorkspaceControl(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a workspace management assistant. You can help users create, organize, and manage workspaces and chat applications. Use the available tools to perform workspace operations.`
      },
      {
        role: "user", 
        content: userMessage
      }
    ],
    tools: ALL_WORKSPACE_TOOLS.map(tool => ({
      type: "function" as const,
      function: tool
    })),
    tool_choice: "auto"
  });

  // Handle tool calls
  const message = response.choices[0].message;
  if (message.tool_calls) {
    const results = [];
    
    for (const toolCall of message.tool_calls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      try {
        // Execute the tool function
        const result = await LLM_TOOL_FUNCTIONS[functionName](args);
        results.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(result)
        });
      } catch (error) {
        results.push({
          tool_call_id: toolCall.id,
          output: `Error: ${error.message}`
        });
      }
    }
    
    // Continue conversation with tool results
    const followUp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        ...messages,
        message,
        ...results.map(result => ({
          role: "tool" as const,
          content: result.output,
          tool_call_id: result.tool_call_id
        }))
      ]
    });
    
    return followUp.choices[0].message.content;
  }
  
  return message.content;
}
```

#### Claude Function Calling Example

```typescript
// LLM integration with Anthropic Claude
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function chatWithClaudeWorkspaceControl(userMessage: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1024,
    system: `You are a workspace management assistant with access to workspace control functions. Help users manage their workspaces and chat applications efficiently.`,
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ],
    tools: ALL_WORKSPACE_TOOLS
  });

  // Handle tool use
  for (const content of response.content) {
    if (content.type === "tool_use") {
      const functionName = content.name;
      const args = content.input;
      
      try {
        const result = await LLM_TOOL_FUNCTIONS[functionName](args);
        console.log(`Tool ${functionName} executed:`, result);
      } catch (error) {
        console.error(`Tool ${functionName} failed:`, error);
      }
    }
  }
  
  return response.content.find(c => c.type === "text")?.text || "";
}
```

## Natural Language Examples

### Workspace Management

```typescript
// Example conversations that would trigger workspace operations

const examples = [
  {
    user: "Create a new workspace called 'Project Alpha' with a rocket icon",
    expectedTool: "create_workspace",
    expectedArgs: {
      name: "Project Alpha",
      icon: "🚀"
    }
  },
  
  {
    user: "List all my workspaces",
    expectedTool: "list_workspaces",
    expectedArgs: {}
  },
  
  {
    user: "Switch to my Development workspace",
    expectedTool: "activate_workspace", 
    expectedArgs: {
      workspaceId: "workspace-development-123" // LLM would need to resolve this
    }
  },
  
  {
    user: "Archive the old Testing workspace",
    expectedTool: "archive_workspace",
    expectedArgs: {
      workspaceId: "workspace-testing-456"
    }
  }
];
```

### Chat App Management

```typescript
const chatAppExamples = [
  {
    user: "Add a simple chat app to my current workspace",
    expectedTool: "add_chat_app",
    expectedArgs: {
      workspaceId: "current", // Would be resolved by LLM
      configId: "simple-chat"
    }
  },
  
  {
    user: "Expand the pink buddy chat",
    expectedTool: "set_chat_app_status",
    expectedArgs: {
      workspaceId: "current",
      appId: "pink-buddy", // Would be resolved by LLM
      status: "expanded"
    }
  },
  
  {
    user: "Enter focus mode on the main chat app",
    expectedTool: "enter_focus_mode",
    expectedArgs: {
      workspaceId: "current",
      appId: "main-chat" // Would be resolved by LLM
    }
  }
];
```

## MCP Server Integration

### 1. Create MCP Server

```typescript
// workspace-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createWorkspaceStore } from "@/workspace/workspaceStore";
import { ALL_WORKSPACE_TOOLS } from "@/utils/llm-workspace-api";

class WorkspaceMCPServer {
  private server: Server;
  private workspaceStore: ReturnType<typeof createWorkspaceStore>;

  constructor() {
    this.server = new Server(
      {
        name: "buddy-workspace-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.workspaceStore = createWorkspaceStore();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_WORKSPACE_TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.parameters
        }))
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          case "create_workspace":
            result = await this.createWorkspace(args);
            break;
          case "list_workspaces":
            result = await this.listWorkspaces(args);
            break;
          case "activate_workspace":
            result = await this.activateWorkspace(args);
            break;
          // ... handle other tools
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          content: [
            {
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text", 
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async createWorkspace(args: any) {
    const workspaceId = generateWorkspaceId(args.name);
    
    this.workspaceStore.send({
      type: "WORKSPACE_ADDED",
      workspaceId,
      name: args.name,
      description: args.description,
      icon: args.icon || "📁",
      color: args.color || "#3b82f6",
      availableAgents: args.availableAgents || ["default-agent"]
    });
    
    return `Created workspace "${args.name}" with ID: ${workspaceId}`;
  }

  private async listWorkspaces(args: any) {
    const state = this.workspaceStore.getSnapshot().context;
    const workspaces = Object.values(state.workspaces);
    
    const filtered = args?.includeArchived 
      ? workspaces 
      : workspaces.filter(w => !w.isArchived);
    
    return filtered;
  }

  private async activateWorkspace(args: any) {
    this.workspaceStore.send({
      type: "WORKSPACE_ACTIVATED",
      workspaceId: args.workspaceId
    });
    
    return `Activated workspace: ${args.workspaceId}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
const server = new WorkspaceMCPServer();
server.run().catch(console.error);
```

### 2. MCP Configuration

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "buddy-workspace": {
      "command": "node",
      "args": ["dist/workspace-mcp-server.js"]
    }
  }
}
```

### 3. CLI Integration

```typescript
// cli/workspace-cli.ts
#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

class WorkspaceCLI {
  private client: Client;

  constructor() {
    this.client = new Client(
      {
        name: "workspace-cli",
        version: "1.0.0",
      },
      {
        capabilities: {}
      }
    );
  }

  async connect() {
    const serverProcess = spawn("node", ["dist/workspace-mcp-server.js"]);
    const transport = new StdioClientTransport({
      stdin: serverProcess.stdin!,
      stdout: serverProcess.stdout!
    });
    
    await this.client.connect(transport);
  }

  async createWorkspace(name: string, options: any = {}) {
    const result = await this.client.callTool({
      name: "create_workspace",
      arguments: { name, ...options }
    });
    
    console.log(result.content[0].text);
  }

  async listWorkspaces() {
    const result = await this.client.callTool({
      name: "list_workspaces",
      arguments: {}
    });
    
    const workspaces = JSON.parse(result.content[0].text);
    console.table(workspaces);
  }
}

// CLI usage
async function main() {
  const cli = new WorkspaceCLI();
  await cli.connect();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case "create":
      await cli.createWorkspace(args[0], { icon: "🚀" });
      break;
    case "list":
      await cli.listWorkspaces();
      break;
    default:
      console.log("Usage: workspace-cli <create|list> [args...]");
  }
  
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}
```

## Testing the Integration

### 1. Unit Tests

```typescript
// __tests__/llm-workspace-integration.test.ts
import { LLM_TOOL_FUNCTIONS } from "@/utils/llm-workspace-implementation";
import { createWorkspaceStore } from "@/workspace/workspaceStore";

describe("LLM Workspace Integration", () => {
  beforeEach(() => {
    // Mock window.buddyWorkspace
    global.window = {
      buddyWorkspace: {
        createWorkspace: jest.fn(),
        listWorkspaces: jest.fn(),
        activateWorkspace: jest.fn(),
        // ... other methods
      }
    } as any;
  });

  test("creates workspace via LLM tool", async () => {
    const mockCreate = window.buddyWorkspace.createWorkspace as jest.Mock;
    mockCreate.mockResolvedValue("workspace-123");

    const result = await LLM_TOOL_FUNCTIONS.create_workspace({
      name: "Test Workspace",
      icon: "🧪"
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: "Test Workspace",
      icon: "🧪"
    });
    expect(result).toBe("workspace-123");
  });

  test("lists workspaces via LLM tool", async () => {
    const mockList = window.buddyWorkspace.listWorkspaces as jest.Mock;
    mockList.mockResolvedValue([
      { id: "ws-1", name: "Workspace 1" },
      { id: "ws-2", name: "Workspace 2" }
    ]);

    const result = await LLM_TOOL_FUNCTIONS.list_workspaces();

    expect(mockList).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/llm-e2e.test.ts
import { chatWithWorkspaceControl } from "@/utils/llm-integration";

describe("LLM End-to-End Integration", () => {
  test("handles workspace creation request", async () => {
    const response = await chatWithWorkspaceControl(
      "Create a new workspace called 'Project Alpha' with a rocket icon"
    );

    expect(response).toContain("Created workspace");
    expect(response).toContain("Project Alpha");
  });

  test("handles workspace listing request", async () => {
    const response = await chatWithWorkspaceControl(
      "Show me all my workspaces"
    );

    expect(response).toContain("workspace");
  });
});
```

## Usage Examples

### 1. Direct API Usage

```typescript
// Direct usage in React components
import { useBuddyWorkspaceAPI } from "@/utils/llm-workspace-implementation";

function WorkspaceManager() {
  useBuddyWorkspaceAPI(); // Initialize API
  
  const handleCreateWorkspace = async () => {
    if (window.buddyWorkspace) {
      const workspaceId = await window.buddyWorkspace.createWorkspace({
        name: "New Workspace",
        icon: "✨"
      });
      console.log("Created:", workspaceId);
    }
  };

  return (
    <button onClick={handleCreateWorkspace}>
      Create Workspace
    </button>
  );
}
```

### 2. LLM Chat Integration

```typescript
// Chat component with LLM workspace control
function LLMChat() {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (text: string) => {
    const response = await chatWithWorkspaceControl(text);
    setMessages(prev => [...prev, 
      { role: "user", content: text },
      { role: "assistant", content: response }
    ]);
  };
  
  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.role}: {msg.content}</div>
        ))}
      </div>
      <input 
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(e.target.value);
            e.target.value = "";
          }
        }}
        placeholder="Ask me to manage your workspaces..."
      />
    </div>
  );
}
```

## Best Practices

1. **Error Handling**: Always wrap LLM tool calls in try-catch blocks
2. **Validation**: Validate all inputs before passing to workspace functions
3. **Logging**: Add comprehensive logging for debugging LLM interactions
4. **Type Safety**: Use TypeScript interfaces for all tool parameters
5. **Testing**: Test both individual tools and complete LLM workflows
6. **Documentation**: Provide clear examples for each tool function

This integration provides a complete foundation for LLM-controlled workspace management, supporting both immediate tool-calling and persistent MCP server approaches. 