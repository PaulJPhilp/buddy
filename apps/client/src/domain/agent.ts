/**
 * Pure Agent Domain Model
 * Contains only business logic - no UI or presentation concerns
 */

// Core agent business model
export interface AgentModel {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly provider: string;
  readonly model: string;
  readonly prompt?: string;
  readonly capabilities: string[];
  readonly parameters: AgentParameters;
  readonly permissions: AgentPermissions;
  readonly isDefault?: boolean;
  readonly isShared?: boolean;
  readonly isArchived?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: Record<string, unknown>;
}

// Agent parameters for LLM configuration
export interface AgentParameters {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly stopSequences?: string[];
  readonly customParameters?: Record<string, unknown>;
}

// Agent business permissions
export interface AgentPermissions {
  readonly canAccessInternet: boolean;
  readonly canExecuteCode: boolean;
  readonly canAccessFiles: boolean;
  readonly canModifyFiles: boolean;
  readonly canAccessDatabase: boolean;
  readonly canSendEmails: boolean;
  readonly allowedDomains?: string[];
  readonly blockedDomains?: string[];
}

// Domain operations
export interface AgentDomainOperations {
  readonly canAgentPerformAction: (
    agent: AgentModel,
    action: string
  ) => boolean;
  readonly isAgentAvailable: (agent: AgentModel) => boolean;
  readonly getAgentCapabilities: (agent: AgentModel) => string[];
  readonly validateAgentConfig: (agent: AgentModel) => boolean;
}

// Factory functions
export function createAgentModel(params: {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  provider: string;
  model: string;
  prompt?: string;
  capabilities?: string[];
  parameters?: Partial<AgentParameters>;
  permissions?: Partial<AgentPermissions>;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}): AgentModel {
  const now = new Date().toISOString();

  return {
    id: params.id ?? generateAgentId(),
    name: params.name,
    description: params.description,
    version: params.version ?? "1.0.0",
    provider: params.provider,
    model: params.model,
    prompt: params.prompt,
    capabilities: params.capabilities ?? ["text-generation", "conversation"],
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stopSequences: [],
      customParameters: {},
      ...params.parameters,
    },
    permissions: {
      canAccessInternet: false,
      canExecuteCode: false,
      canAccessFiles: false,
      canModifyFiles: false,
      canAccessDatabase: false,
      canSendEmails: false,
      allowedDomains: [],
      blockedDomains: [],
      ...params.permissions,
    },
    isDefault: params.isDefault ?? false,
    isShared: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata ?? {},
  };
}

export function updateAgentModel(
  agent: AgentModel,
  updates: Partial<
    Pick<
      AgentModel,
      "name" | "description" | "parameters" | "permissions" | "metadata"
    >
  >
): AgentModel {
  return {
    ...agent,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

// Domain utilities
export function generateAgentId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidAgentName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}

export function isActiveAgent(agent: AgentModel): boolean {
  return !agent.isArchived && agent.capabilities.length > 0;
}

export function canAgentAccessInternet(agent: AgentModel): boolean {
  return agent.permissions.canAccessInternet;
}

export function validateAgentParameters(parameters: AgentParameters): boolean {
  if (
    parameters.temperature !== undefined &&
    (parameters.temperature < 0 || parameters.temperature > 2)
  ) {
    return false;
  }
  if (parameters.maxTokens !== undefined && parameters.maxTokens <= 0) {
    return false;
  }
  return true;
}
