export interface WorkspaceEntry {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly isActive: boolean;
  readonly isArchived?: boolean;
  readonly chatAppCount: number;
  readonly activeChatAppCount: number;
  readonly availableAgents: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

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

export interface WorkspaceStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  archivedWorkspaces: number;
  totalChatApps: number;
  activeChatApps: number;
}

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
