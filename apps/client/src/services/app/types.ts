// Re-export types used by AppService
export type { ChatAppConfig } from "@/types/global";

// AppService-specific types (if any are needed in the future)
export interface AppServiceOptions {
  readonly autoSave?: boolean;
  readonly validateReferences?: boolean;
}
