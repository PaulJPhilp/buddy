// Main exports
export type { LayoutServiceApi } from "./api";
export {
  LayoutStateError,
  LayoutSubscriptionError,
  LayoutValidationError,
} from "./errors";
export type { LayoutError } from "./errors";
export { LayoutService } from "./service";
export type {
  LayoutConfig,
  LayoutMode,
  LayoutState,
  ScreenSize,
  SidebarEditor,
} from "./types";
export { DEFAULT_LAYOUT_STATE, LAYOUT_CONSTANTS } from "./types";

// React hooks
export { useLayoutService, useSidebarState } from "./hooks";
