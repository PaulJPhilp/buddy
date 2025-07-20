import { createAgentModel } from "@domain/agent";
import { createAppDomainModel } from "@domain/app";
import { createChatAppModel } from "@domain/chatapp";
import { createWorkspaceModel } from "@domain/workspace";
import type { AppConfig } from "../types/AppConfig";
import { CONFIG_CONSTANTS } from "./constants";

// Default configuration factory
export function createDefaultAppConfig(): AppConfig {
  const baseConfig = createAppDomainModel({
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
    version: CONFIG_CONSTANTS.CURRENT_VERSION,
  });

  // Add the settings field that the schema expects
  return {
    ...baseConfig,
    settings: {},
  } as AppConfig;
}

// Additional factory functions for compatibility
export function createDefaultWorkspaceConfig(name?: string, id?: string) {
  return createWorkspaceModel({
    id,
    name: name ?? "Default Workspace",
    description: "Default workspace configuration",
  });
}

export function createDefaultChatAppConfig(name?: string, agentId?: string) {
  return createChatAppModel({
    name: name ?? "Default Chat App",
    description: "Default chat app configuration",
    agentId: agentId ?? "default-agent",
  });
}

export function createDefaultAgentConfig(
  name?: string,
  provider?: string,
  model?: string
) {
  return createAgentModel({
    name: name ?? "Default Agent",
    description: "Default agent configuration",
    provider: provider ?? "openai",
    model: model ?? "gpt-4",
  });
}
