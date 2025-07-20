// Core manager state structure
export interface CoreManagerState {
  readonly isInitialized: boolean;
  readonly isRunning: boolean;
  readonly isLoading: boolean;
  readonly error?: string;
  readonly lastUpdated: number;
  readonly operationCount: number;
}

// Core manager configuration
export interface CoreManagerConfig {
  readonly id: string;
  readonly name: string;
  readonly autoStart?: boolean;
  readonly autoCleanup?: boolean;
  readonly debugMode?: boolean;
  readonly maxOperations?: number;
}

// Subscription callback type
export type ManagerSubscriptionCallback<T = CoreManagerState> = (
  state: T
) => void;

// Manager lifecycle states
export const MANAGER_LIFECYCLE = {
  UNINITIALIZED: "uninitialized",
  INITIALIZING: "initializing",
  INITIALIZED: "initialized",
  STARTING: "starting",
  RUNNING: "running",
  STOPPING: "stopping",
  STOPPED: "stopped",
  ERROR: "error",
  CLEANUP: "cleanup",
} as const;

export type ManagerLifecycleState =
  (typeof MANAGER_LIFECYCLE)[keyof typeof MANAGER_LIFECYCLE];

// Manager operation types
export const MANAGER_OPERATIONS = {
  COORDINATE: "coordinate",
  ORCHESTRATE: "orchestrate",
  MANAGE: "manage",
  MONITOR: "monitor",
} as const;

export type ManagerOperationType =
  (typeof MANAGER_OPERATIONS)[keyof typeof MANAGER_OPERATIONS];

// Default state factory
export function createDefaultManagerState(): CoreManagerState {
  return {
    isInitialized: false,
    isRunning: false,
    isLoading: false,
    lastUpdated: Date.now(),
    operationCount: 0,
  };
}
