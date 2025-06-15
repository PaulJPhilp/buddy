// Re-export types used by ToolbarService
export type { ToolbarConfig } from "@/types/global";

// ToolbarService-specific options
export interface ToolbarServiceOptions {
  readonly validateOnCreate?: boolean;
  readonly allowDuplicateIds?: boolean;
}
