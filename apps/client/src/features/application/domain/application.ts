/**
 * Pure App Domain Model
 * Composes workspace, chatapp, and agent domain models
 * Contains only business logic - no UI or presentation concerns
 */

import type { AppConfig, AgentConfig as AgentModel, ChatAppConfig as ChatAppModel } from "@/features/application/types/AppConfig";
import type { Workspace as WorkspaceModel } from "@buddy/config/types/workspace";

// Core app business model - clean composition
export interface AppDomainModel {
  readonly app: AppMetadata;
  readonly workspaces: WorkspaceModel[];
  readonly chatapps: ChatAppModel[];
  readonly agents: AgentModel[];
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly settings?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

// App metadata - business information only
export interface AppMetadata {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly environment?: "development" | "production" | "test";
  readonly locale?: string;
  readonly timezone?: string;
}

// Domain operations for the entire app
export interface AppDomainOperations {
  readonly getActiveWorkspaces: (app: AppConfig) => WorkspaceModel[];
  readonly getWorkspaceChatApps: (
    app: AppConfig,
    workspaceId: string
  ) => ChatAppModel[];
  readonly getWorkspaceAgents: (
    app: AppConfig,
    workspaceId: string
  ) => AgentModel[];
  readonly canUserAccessWorkspace: (
    app: AppConfig,
    workspaceId: string,
    userId: string
  ) => boolean;
  readonly validateAppConfiguration: (app: AppConfig) => boolean;
}

// Factory function for app domain model
export function createAppDomainModel(params: {
  app: Partial<AppMetadata>;
  workspaces?: WorkspaceModel[];
  chatapps?: ChatAppModel[];
  agents?: AgentModel[];
  version?: string;
  metadata?: Record<string, unknown>;
}): AppConfig {
  const now = new Date().toISOString();

  return {
    app: {
      name: "Buddy",
      version: "1.0.0",
      description: "AI Chat Application",
      environment: "development",
      locale: "en",
      timezone: "UTC",
      ...params.app,
    },
    workspaces: params.workspaces ?? [],
    chatapps: params.chatapps ?? [],
    agents: params.agents ?? [],
    version: params.version ?? "1.0.0",
    createdAt: now,
    updatedAt: now,
    settings: {},
  };
}

export function updateAppDomainModel(
  app: AppConfig,
  updates: Partial<Pick<AppConfig, "app" | "version">>
): AppConfig {
  return {
    ...app,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

// Domain utilities
export function getWorkspaceChatApps(
  app: AppConfig,
  workspaceId: string
): ChatAppModel[] {
  const workspace = app.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return [];

  return app.chatapps.filter((chatapp) =>
    workspace.chatappIds.includes(chatapp.id)
  );
}

export function getWorkspaceAgents(
  app: AppConfig,
  workspaceId: string
): AgentModel[] {
  const workspace = app.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return [];

  return app.agents.filter((agent) => workspace.agentIds.includes(agent.id));
}

export function getActiveWorkspaces(app: AppConfig): WorkspaceModel[] {
  return app.workspaces.filter((workspace) => !workspace.isArchived);
}

export function validateAppConfiguration(app: AppConfig): boolean {
  // Basic validation rules
  if (!app.app.name || app.app.name.trim().length === 0) return false;
  if (!app.version || app.version.trim().length === 0) return false;

  // Validate workspace references
  for (const workspace of app.workspaces) {
    for (const chatappId of workspace.chatappIds) {
      if (!app.chatapps.find((ca) => ca.id === chatappId)) return false;
    }
    for (const agentId of workspace.agentIds) {
      if (!app.agents.find((a) => a.id === agentId)) return false;
    }
  }

  // Validate chatapp agent references
  for (const chatapp of app.chatapps) {
    if (!app.agents.find((a) => a.id === chatapp.agentId)) return false;
  }

  return true;
}

export function getDefaultWorkspace(app: AppConfig): WorkspaceModel | null {
  return app.workspaces.find((w) => w.isDefault) ?? null;
}
