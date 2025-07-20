import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import type { ChatAppStatus } from "@/features/chatapps/types/chatapp";

export interface ChatAppEntry {
  readonly id: string;
  readonly name: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly status: ChatAppStatus;
  readonly isActive: boolean;
  readonly isArchived?: boolean;
  readonly createdAt: string;
  readonly lastActiveAt: string;
}

export interface ListChatAppsOptions {
  workspaceId?: string;
  status?: ChatAppStatus;
  includeArchived?: boolean;
}

export class ChatAppToolError extends Error {
  constructor(
    public readonly operation: string,
    public readonly details: string,
    public readonly cause?: unknown
  ) {
    super(`ChatAppToolError during ${operation}: ${details}`);
    this.name = "ChatAppToolError";
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${
        cause instanceof Error ? cause.stack : String(cause)
      }`;
    }
  }
}

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
          description: "Filter by app status",
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
    description:
      "Set the status of a chat application (expanded, compact, stashed, closed)",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID of the chat app",
        },
        appId: {
          type: "string",
          description: "Chat app ID to update",
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
      "Enter focus mode for a specific chat application, hiding others",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID of the chat app",
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
    description:
      "Exit focus mode and show all chat applications in the workspace",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to exit focus mode from",
        },
      },
      required: ["workspaceId"],
    },
  },
] as const;
