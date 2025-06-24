import { ChatAppConfig } from "@/types/global";
import type { ChatAppEntry, WorkspaceEntry } from "@/workspace/types";

// Global API interface for LLM tool-calling
export interface BuddyWorkspaceAPI {
  // Workspace operations
  createWorkspace: (options: CreateWorkspaceOptions) => Promise<string>;
  listWorkspaces: (
    options?: ListWorkspacesOptions,
  ) => Promise<WorkspaceEntry[]>;
  activateWorkspace: (workspaceId: string) => Promise<void>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceEntry>,
  ) => Promise<void>;
  archiveWorkspace: (workspaceId: string) => Promise<void>;
  restoreWorkspace: (workspaceId: string) => Promise<void>;

  // Chat app operations
  addChatApp: (
    workspaceId: string,
    config: ChatAppConfig | string,
  ) => Promise<void>;
  listChatApps: (options?: ListChatAppsOptions) => Promise<ChatAppEntry[]>;
  setChatAppStatus: (
    workspaceId: string,
    appId: string,
    status: ChatAppStatus,
  ) => Promise<void>;
  enterFocusMode: (workspaceId: string, appId: string) => Promise<void>;
  exitFocusMode: (workspaceId: string) => Promise<void>;

  // Utility operations
  getCurrentWorkspace: () => Promise<WorkspaceEntry | null>;
  getActiveWorkspaces: () => Promise<WorkspaceEntry[]>;
  getWorkspaceStats: () => Promise<WorkspaceStats>;
}

// Option types
export interface CreateWorkspaceOptions {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  availableAgents?: string[];
}

export interface ListWorkspacesOptions {
  includeArchived?: boolean;
}

export interface ListChatAppsOptions {
  workspaceId?: string;
  status?: ChatAppStatus;
  includeArchived?: boolean;
}

export type ChatAppStatus = "expanded" | "compact" | "stashed" | "closed";

export interface WorkspaceStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  archivedWorkspaces: number;
  totalChatApps: number;
  activeChatApps: number;
}

// Tool definitions for LLM function calling
export const WORKSPACE_TOOLS = [
  {
    name: "create_workspace",
    description: "Create a new workspace for organizing chat applications",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Human-readable workspace name",
        },
        description: {
          type: "string",
          description: "Optional workspace description",
        },
        icon: {
          type: "string",
          description: "Emoji icon (e.g., 🚀, 💼, 🏠)",
        },
        color: {
          type: "string",
          description: "Hex color code (e.g., #3b82f6)",
        },
        availableAgents: {
          type: "array",
          items: { type: "string" },
          description: "Agent IDs available in this workspace",
          default: ["default-agent"],
        },
      },
      required: ["name"],
    },
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
          default: false,
        },
      },
    },
  },

  {
    name: "activate_workspace",
    description: "Switch to a different workspace",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to activate",
        },
      },
      required: ["workspaceId"],
    },
  },

  {
    name: "update_workspace",
    description:
      "Update workspace properties like name, description, icon, or color",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to update",
        },
        name: {
          type: "string",
          description: "New workspace name",
        },
        description: {
          type: "string",
          description: "New workspace description",
        },
        icon: {
          type: "string",
          description: "New emoji icon",
        },
        color: {
          type: "string",
          description: "New hex color code",
        },
      },
      required: ["workspaceId"],
    },
  },

  {
    name: "archive_workspace",
    description: "Archive a workspace (hides it from active use)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to archive",
        },
      },
      required: ["workspaceId"],
    },
  },
] as const;

export const CHAT_APP_TOOLS = [
  {
    name: "add_chat_app",
    description: "Add a new chat application to a workspace",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Target workspace ID",
        },
        configId: {
          type: "string",
          description: "Predefined chat app configuration ID",
          enum: ["simple-chat", "pink-buddy", "slate-buddy", "teal-buddy"],
        },
        customConfig: {
          type: "object",
          description: "Custom configuration object (alternative to configId)",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            agentId: { type: "string" },
            theme: { type: "object" },
          },
        },
      },
      required: ["workspaceId"],
    },
  },

  {
    name: "list_chat_apps",
    description: "List chat applications in workspace(s)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Specific workspace ID (current workspace if omitted)",
        },
        status: {
          type: "string",
          enum: ["expanded", "compact", "stashed", "closed"],
          description: "Filter by chat app status",
        },
        includeArchived: {
          type: "boolean",
          description: "Include archived chat apps",
          default: false,
        },
      },
    },
  },

  {
    name: "set_chat_app_status",
    description: "Change the display status of a chat application",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace containing the chat app",
        },
        appId: {
          type: "string",
          description: "Chat app ID to modify",
        },
        status: {
          type: "string",
          enum: ["expanded", "compact", "stashed", "closed"],
          description: "New status for the chat app",
        },
      },
      required: ["workspaceId", "appId", "status"],
    },
  },

  {
    name: "enter_focus_mode",
    description:
      "Enter focus mode on a specific chat app (hides all other apps)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID",
        },
        appId: {
          type: "string",
          description: "Chat app ID to focus on",
        },
      },
      required: ["workspaceId", "appId"],
    },
  },

  {
    name: "exit_focus_mode",
    description: "Exit focus mode and restore previous chat app states",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to exit focus mode",
        },
      },
      required: ["workspaceId"],
    },
  },
] as const;

export const UTILITY_TOOLS = [
  {
    name: "get_current_workspace",
    description: "Get the currently active workspace",
    parameters: {
      type: "object",
      properties: {},
    },
  },

  {
    name: "get_active_workspaces",
    description: "Get all workspaces that have active chat applications",
    parameters: {
      type: "object",
      properties: {},
    },
  },

  {
    name: "get_workspace_stats",
    description: "Get statistics about workspaces and chat apps",
    parameters: {
      type: "object",
      properties: {},
    },
  },
] as const;

// Combined tool definitions
export const ALL_WORKSPACE_TOOLS = [
  ...WORKSPACE_TOOLS,
  ...CHAT_APP_TOOLS,
  ...UTILITY_TOOLS,
] as const;

// Global declaration for window object
declare global {
  interface Window {
    buddyWorkspace?: BuddyWorkspaceAPI;
  }
}

// Error types for tool operations
export class WorkspaceToolError extends Error {
  constructor(
    public readonly operation: string,
    public readonly details: string,
    public readonly cause?: unknown,
  ) {
    super(`Workspace ${operation} failed: ${details}`);
    this.name = "WorkspaceToolError";
  }
}

export class ChatAppToolError extends Error {
  constructor(
    public readonly operation: string,
    public readonly details: string,
    public readonly cause?: unknown,
  ) {
    super(`Chat app ${operation} failed: ${details}`);
    this.name = "ChatAppToolError";
  }
}

// Utility functions for tool implementations
export function generateWorkspaceId(name: string): string {
  const timestamp = Date.now();
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `workspace-${sanitizedName}-${timestamp}`;
}

export function validateWorkspaceId(workspaceId: string): boolean {
  return typeof workspaceId === "string" && workspaceId.length > 0;
}

export function validateChatAppStatus(status: string): status is ChatAppStatus {
  return ["expanded", "compact", "stashed", "closed"].includes(status);
}

// Example usage documentation
export const USAGE_EXAMPLES = {
  workspace: {
    create: `
// Create a new workspace
await window.buddyWorkspace.createWorkspace({
  name: "Project Alpha",
  description: "Development workspace for Project Alpha",
  icon: "🚀",
  color: "#3b82f6",
  availableAgents: ["default-agent", "coding-agent"]
});
    `,

    list: `
// List all active workspaces
const workspaces = await window.buddyWorkspace.listWorkspaces();

// List all workspaces including archived
const allWorkspaces = await window.buddyWorkspace.listWorkspaces({ 
  includeArchived: true 
});
    `,

    activate: `
// Switch to a workspace
await window.buddyWorkspace.activateWorkspace("workspace-project-alpha-1234567890");
    `,
  },

  chatApp: {
    add: `
// Add a predefined chat app
await window.buddyWorkspace.addChatApp("workspace-123", "simple-chat");

// Add a custom chat app
await window.buddyWorkspace.addChatApp("workspace-123", {
  id: "custom-chat-1",
  name: "Custom Assistant",
  agentId: "custom-agent",
  theme: { primaryColor: "#ff6b6b" }
});
    `,

    list: `
// List chat apps in current workspace
const apps = await window.buddyWorkspace.listChatApps();

// List expanded chat apps in specific workspace
const expandedApps = await window.buddyWorkspace.listChatApps({
  workspaceId: "workspace-123",
  status: "expanded"
});
    `,

    control: `
// Expand a chat app
await window.buddyWorkspace.setChatAppStatus("workspace-123", "app-456", "expanded");

// Enter focus mode
await window.buddyWorkspace.enterFocusMode("workspace-123", "app-456");

// Exit focus mode
await window.buddyWorkspace.exitFocusMode("workspace-123");
    `,
  },
} as const;
