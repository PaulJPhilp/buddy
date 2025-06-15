// Main exports
export type { ConfigLifecycleServiceApi } from "./api";
export {
  ConcurrentModificationError,
  ConfigLoadError,
  ConfigSaveError,
  ConfigValidationError,
} from "./errors";
export type {
  ConfigLifecycleContext,
  ConfigLifecycleServiceError,
} from "./errors";
export { ConfigLifecycleService } from "./ConfigLifecycleService";
export type {
  ChatAppConfig,
  ConfigLifecycleEvent,
  ConfigLifecycleServiceOptions,
} from "./types";

// Legacy exports for compatibility
export { ConfigLifecycleServiceLive } from "./ConfigLifecycleService";

// Hooks and utilities
export { useConfigEditor } from "../../hooks/useConfigEditor";
