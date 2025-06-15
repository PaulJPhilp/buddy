// Re-export types used by ConfigLifecycleService
export type { ChatAppConfig } from "@/types/global";

// Events for the state machine
export type ConfigLifecycleEvent =
  | { type: "LOAD_CONFIGS" }
  | {
      type: "CONFIGS_LOADED";
      configs: import("@/types/global").ChatAppConfig[];
      lastModified: number;
    }
  | { type: "ADD_CONFIG"; config: import("@/types/global").ChatAppConfig }
  | {
      type: "UPDATE_CONFIG";
      configId: string;
      updates: Partial<import("@/types/global").ChatAppConfig>;
    }
  | {
      type: "UPDATE_CONFIG_IMMEDIATE";
      configId: string;
      updates: Partial<import("@/types/global").ChatAppConfig>;
    }
  | { type: "DELETE_CONFIG"; configId: string }
  | { type: "SET_ACTIVE"; configId: string | null }
  | { type: "TOGGLE_OPEN"; configId: string }
  | { type: "SET_DISPLAY_MODE"; mode: "expanded" | "compact" }
  | { type: "SAVE_SUCCESS"; configId: string }
  | { type: "SAVE_START"; configId: string }
  | { type: "SAVE_ERROR"; configId: string; error: string }
  | { type: "SET_DIRTY"; configId: string }
  | { type: "TOGGLE_AUTO_SAVE" }
  | { type: "ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "FILE_CHANGED"; lastModified: number }
  | { type: "REVERT_CONFIG"; configId: string };

// Service options
export interface ConfigLifecycleServiceOptions {
  readonly autoSaveEnabled?: boolean;
  readonly debounceDelayMs?: number;
  readonly fileWatchInterval?: number;
}
