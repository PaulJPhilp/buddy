import type { AgentServiceApi } from "../../services/agent/api";
import type { AgentConfig } from "../../services/agent/types";

// Re-export types from other services
export type { AgentConfig } from "../../services/agent/types";

// Agent instance metadata and state
export interface AgentInstance {
  readonly id: string;
  readonly config: AgentConfig;
  readonly status:
    | "initializing"
    | "active"
    | "inactive"
    | "terminating"
    | "error";
  readonly health: "healthy" | "unhealthy" | "unknown";
  readonly metadata: AgentInstanceMetadata;
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
  readonly lastHealthCheck: Date;
}

export interface AgentInstanceMetadata {
  readonly messageCount: number;
  readonly totalResponseTime: number;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly lastError?: string;
  readonly uptime: number;
  readonly version?: string;
  readonly capabilities?: string[];
  readonly tags?: Record<string, string>;
}

// Agent Manager configuration
export interface AgentManagerConfig {
  readonly maxActiveAgents: number;
  readonly healthCheckInterval: number;
  readonly agentTimeout: number;
  readonly enableAutoRestart: boolean;
  readonly defaultAgentConfig: Partial<AgentConfig>;
  readonly registryPath?: string;
  readonly enableMetrics: boolean;
}

// Agent Manager state
export interface AgentManagerState {
  readonly activeAgentId: string | null;
  readonly agentInstances: Record<string, AgentInstance>;
  readonly availableAgents: Record<string, AgentConfig>;
  readonly isLoading: boolean;
  readonly lastError: string | null;
  readonly stats: AgentManagerStats;
  readonly config: AgentManagerConfig;
  readonly listeners: Set<(state: AgentManagerState) => void>;
}

export interface AgentManagerStats {
  readonly totalAgents: number;
  readonly activeAgents: number;
  readonly healthyAgents: number;
  readonly unhealthyAgents: number;
  readonly totalMessages: number;
  readonly totalResponseTime: number;
  readonly averageResponseTime: number;
  readonly errorCount: number;
  readonly uptime: number;
  readonly lastUpdated: Date;
}

// Agent communication types
export interface AgentMessage {
  readonly id: string;
  readonly agentId: string;
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly type: "request" | "response" | "broadcast" | "system";
}

export interface AgentHealthStatus {
  readonly agentId: string;
  readonly status: "healthy" | "unhealthy" | "unknown";
  readonly lastSeen: Date;
  readonly responseTime?: number;
  readonly errorMessage?: string;
  readonly details?: Record<string, unknown>;
}

// Agent switching context
export interface AgentSwitchContext {
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly transferredData?: Record<string, unknown>;
  readonly switchedAt: Date;
  readonly reason?: string;
}

// Agent cloning configuration
export interface AgentCloneConfig {
  readonly sourceAgentId: string;
  readonly newAgentId: string;
  readonly configOverrides: Partial<AgentConfig>;
  readonly copyMetadata: boolean;
  readonly inheritCapabilities: boolean;
}

// Constants
export const AGENT_MANAGER_CONSTANTS = {
  DEFAULT_MAX_ACTIVE_AGENTS: 10,
  DEFAULT_HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  DEFAULT_AGENT_TIMEOUT: 60000, // 1 minute
  DEFAULT_ENABLE_AUTO_RESTART: true,
  DEFAULT_ENABLE_METRICS: true,
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
  MESSAGE_TIMEOUT: 30000, // 30 seconds
  MAX_ERROR_COUNT: 5,
  UPTIME_CALCULATION_INTERVAL: 1000, // 1 second
} as const;

// Agent lifecycle events
export type AgentLifecycleEvent =
  | { type: "initialized"; agentId: string; timestamp: Date }
  | { type: "activated"; agentId: string; timestamp: Date }
  | { type: "deactivated"; agentId: string; timestamp: Date }
  | { type: "terminated"; agentId: string; timestamp: Date }
  | { type: "error"; agentId: string; error: string; timestamp: Date }
  | {
      type: "health_check";
      agentId: string;
      status: "healthy" | "unhealthy";
      timestamp: Date;
    }
  | {
      type: "message_sent";
      agentId: string;
      messageId: string;
      timestamp: Date;
    }
  | {
      type: "message_received";
      agentId: string;
      messageId: string;
      timestamp: Date;
    };

// Agent registry entry
export interface AgentRegistryEntry {
  readonly config: AgentConfig;
  readonly registeredAt: Date;
  readonly lastUsed?: Date;
  readonly usageCount: number;
  readonly isEnabled: boolean;
  readonly metadata?: Record<string, unknown>;
}
