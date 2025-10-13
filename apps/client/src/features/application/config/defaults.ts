import type { AppConfig } from "../types/AppConfig";
import { CONFIG_CONSTANTS } from "./constants";

// Default configuration factory
export function createDefaultAppConfig(): AppConfig {
  return {
    version: CONFIG_CONSTANTS.CURRENT_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    app: {
      name: "Buddy",
      version: "1.0.0",
      description: "AI Chat Application",
      author: "Buddy Team",
      environment: "development",
    },
    workspaces: [],
    chatapps: [],
    agents: [],
    settings: {},
  } as AppConfig;
}

// Additional factory functions for compatibility
// TODO: Implement these if needed
export function createDefaultWorkspaceConfig(name?: string, id?: string) {
  return {
    id: id ?? `workspace-${Date.now()}`,
    name: name ?? "Default Workspace",
    description: "Default workspace configuration",
    icon: "📁",
    color: "#3b82f6",
    agentIds: [],
    chatappIds: [],
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isArchived: false,
    maxExpandedApps: 3,
    activeAppId: null,
  };
}

export function createDefaultChatAppConfig(name?: string, agentId?: string) {
  return {
    id: `chatapp-${Date.now()}`,
    name: name ?? "Default Chat App",
    description: "Default chat app configuration",
    version: "1.0.0",
    agentId: agentId ?? "default-agent",
    permissions: {
      canSendMessages: true,
      canReceiveMessages: true,
      canViewHistory: true,
      canDeleteMessages: false,
      canModifySettings: false,
      canShareConversations: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultAgentConfig(
  name?: string,
  provider: "openai" | "google" | "anthropic" = "openai",
  model?: string
) {
  return {
    id: `agent-${Date.now()}`,
    name: name ?? "Default Agent",
    description: "Default agent configuration",
    version: "1.0.0",
    provider: provider,
    model: model ?? "gpt-4",
    capabilities: [],
    parameters: {},
    permissions: {
      canAccessInternet: false,
      canExecuteCode: false,
      canAccessFiles: false,
      canModifyFiles: false,
      canAccessDatabase: false,
      canSendEmails: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
