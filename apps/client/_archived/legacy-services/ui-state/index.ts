/**
 * UI State Service
 * Manages presentation state separately from business domain
 */

export type { UIStateServiceApi } from "./api";
export type {
  UIStateServiceError,
  UIStateNotFoundError,
  UIStateValidationError,
  UIStatePersistenceError,
  UIStateOperationError,
} from "./errors";
export type {
  UIStatePersistenceOptions,
  UIStateValidationOptions,
  UIStateRestoreOptions,
  UIStateChangeEvent,
  UIStateSnapshot,
} from "./types";
export { UI_STATE_CONSTANTS } from "./types";

// Note: Service implementation would go in service.ts
// Following the MDX pattern: api.ts, errors.ts, types.ts, service.ts, index.ts
