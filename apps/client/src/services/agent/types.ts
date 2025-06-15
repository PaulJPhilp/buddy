// Agent configuration interface
export interface AgentConfig {
  readonly id: string;
  readonly initialAgentName: string;
  readonly prompt?: string;
}

// AgentService-specific options
export interface AgentServiceOptions {
  readonly validateOnCreate?: boolean;
  readonly allowDuplicateIds?: boolean;
}
