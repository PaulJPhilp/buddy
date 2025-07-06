// Main exports
export type { AgentManagerApi } from "./api";
export {
  AgentAlreadyExistsError,
  AgentCommunicationError,
  AgentConfigurationError,
  AgentHealthCheckError,
  AgentInitializationError,
  AgentNotFoundError,
  AgentRegistryError,
  AgentTerminationError,
  NoActiveAgentError,
  AgentManagerOperationError,
} from "./errors";
export type { AgentManagerError } from "./errors";
export { AgentManager } from "./service";
export type {
  AgentInstance,
  AgentInstanceMetadata,
  AgentManagerConfig,
  AgentManagerState,
  AgentManagerStats,
  AgentMessage,
  AgentHealthStatus,
  AgentSwitchContext,
  AgentCloneConfig,
  AgentLifecycleEvent,
  AgentRegistryEntry,
  AgentConfig,
} from "./types";
export { AGENT_MANAGER_CONSTANTS } from "./types";
