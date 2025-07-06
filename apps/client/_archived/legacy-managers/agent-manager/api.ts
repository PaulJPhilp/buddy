import type { Effect } from "effect";
import type { AgentConfig } from "../../services/agent/types";
import type { AgentManagerError } from "./errors";
import type { AgentInstance, AgentManagerState } from "./types";

export interface AgentManagerApi {
  // Agent instance management
  readonly initializeAgent: (
    agentId: string,
    config?: Partial<AgentConfig>,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly getAgentInstance: (
    agentId: string,
  ) => Effect.Effect<AgentInstance, AgentManagerError>;

  readonly getAllActiveAgents: () => Effect.Effect<string[], AgentManagerError>;

  readonly terminateAgent: (
    agentId: string,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly restartAgent: (
    agentId: string,
  ) => Effect.Effect<void, AgentManagerError>;

  // Agent configuration management
  readonly updateAgentConfig: (
    agentId: string,
    config: Partial<AgentConfig>,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly getAgentConfig: (
    agentId: string,
  ) => Effect.Effect<AgentConfig, AgentManagerError>;

  readonly setActiveAgent: (
    agentId: string,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly getActiveAgent: () => Effect.Effect<
    AgentInstance | null,
    AgentManagerError
  >;

  // Agent discovery and registry
  readonly discoverAvailableAgents: () => Effect.Effect<
    AgentConfig[],
    AgentManagerError
  >;

  readonly registerAgent: (
    config: AgentConfig,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly unregisterAgent: (
    agentId: string,
  ) => Effect.Effect<void, AgentManagerError>;

  // Health monitoring
  readonly getAgentHealth: (
    agentId: string,
  ) => Effect.Effect<
    { status: "healthy" | "unhealthy" | "unknown"; lastSeen: Date },
    AgentManagerError
  >;

  readonly performHealthCheck: (
    agentId?: string,
  ) => Effect.Effect<void, AgentManagerError>;

  // Bulk operations
  readonly initializeAllAgents: () => Effect.Effect<void, AgentManagerError>;

  readonly terminateAllAgents: () => Effect.Effect<void, AgentManagerError>;

  readonly refreshAgentRegistry: () => Effect.Effect<void, AgentManagerError>;

  // State management
  readonly getState: () => Effect.Effect<AgentManagerState, AgentManagerError>;

  readonly subscribe: (
    listener: (state: AgentManagerState) => void,
  ) => Effect.Effect<() => Effect.Effect<void>, AgentManagerError>;

  // Agent communication
  readonly sendToAgent: (
    agentId: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly sendToActiveAgent: (
    message: string,
    metadata?: Record<string, unknown>,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly broadcastToAllAgents: (
    message: string,
    metadata?: Record<string, unknown>,
  ) => Effect.Effect<void, AgentManagerError>;

  // Agent switching and management
  readonly switchToAgent: (
    fromAgentId: string,
    toAgentId: string,
    transferContext?: boolean,
  ) => Effect.Effect<void, AgentManagerError>;

  readonly cloneAgent: (
    sourceAgentId: string,
    newAgentId: string,
    configOverrides?: Partial<AgentConfig>,
  ) => Effect.Effect<AgentInstance, AgentManagerError>;

  // Statistics and monitoring
  readonly getAgentStats: () => Effect.Effect<
    {
      totalAgents: number;
      activeAgents: number;
      healthyAgents: number;
      unhealthyAgents: number;
      totalMessages: number;
      averageResponseTime: number;
    },
    AgentManagerError
  >;

  readonly getAgentMetrics: (agentId: string) => Effect.Effect<
    {
      messageCount: number;
      averageResponseTime: number;
      lastActivity: Date;
      uptime: number;
    },
    AgentManagerError
  >;
}
