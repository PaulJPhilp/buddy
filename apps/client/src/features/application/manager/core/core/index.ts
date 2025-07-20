// Main exports
export type { CoreManagerApi } from "./api";
export {
  CoreManagerInitializationError,
  CoreManagerStateError,
  CoreManagerSubscriptionError,
  CoreManagerOperationError,
  CoreManagerCoordinationError,
} from "./errors";
export type { CoreManagerError } from "./errors";
export { CoreManager } from "./service";
export * from "./commands";
export type {
  CoreManagerState,
  CoreManagerConfig,
  ManagerSubscriptionCallback,
  ManagerLifecycleState,
  ManagerOperationType,
} from "./types";
export {
  MANAGER_LIFECYCLE,
  MANAGER_OPERATIONS,
  createDefaultManagerState,
} from "./types";
