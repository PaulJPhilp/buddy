// Main exports
export type { CoreComponentApi } from "./api";
export {
  CoreComponentInitializationError,
  CoreComponentStateError,
  CoreComponentSubscriptionError,
  CoreComponentCleanupError,
} from "./errors";
export type { CoreComponentError } from "./errors";
export { CoreComponent } from "./service";
export type {
  CoreComponentState,
  CoreComponentConfig,
  StateSubscriptionCallback,
  ComponentLifecycleState,
} from "./types";
export { COMPONENT_LIFECYCLE, createDefaultState } from "./types";
