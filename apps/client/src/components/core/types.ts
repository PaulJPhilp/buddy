// Core component state structure
export interface CoreComponentState {
  readonly isInitialized: boolean;
  readonly isLoading: boolean;
  readonly error?: string;
  readonly lastUpdated: number;
}

// Core component configuration
export interface CoreComponentConfig {
  readonly id: string;
  readonly name: string;
  readonly configPath?: string;
  readonly autoLoadConfig?: boolean;
  readonly autoRenderShell?: boolean;
  readonly autoCleanup?: boolean;
  readonly debugMode?: boolean;
  readonly chatAppId?: string;
  readonly workspaceId?: string;
}

// Subscription callback type
export type StateSubscriptionCallback<T = CoreComponentState> = (
  state: T
) => void;

// Component lifecycle states
export const COMPONENT_LIFECYCLE = {
  UNINITIALIZED: "uninitialized",
  INITIALIZING: "initializing",
  INITIALIZED: "initialized",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  CLEANUP: "cleanup",
} as const;

export type ComponentLifecycleState =
  (typeof COMPONENT_LIFECYCLE)[keyof typeof COMPONENT_LIFECYCLE];

// Default state factory
export function createDefaultState(): CoreComponentState {
  return {
    isInitialized: false,
    isLoading: false,
    lastUpdated: Date.now(),
  };
}
