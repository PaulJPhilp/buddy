import { Schema as S } from "effect";

// File type options
export type FileType = "CSV" | "XML" | "JSON" | "Markdown";

// Core Context Element Types
export class NamedPrompt extends S.Class<NamedPrompt>("NamedPrompt")({
  _tag: S.Literal("NamedPrompt"),
  id: S.String,
  name: S.String,
  content: S.String,
}) {}

export class NamedFile extends S.Class<NamedFile>("NamedFile")({
  _tag: S.Literal("NamedFile"),
  id: S.String,
  name: S.String,
  fileType: S.Union(
    S.Literal("CSV"),
    S.Literal("XML"),
    S.Literal("JSON"),
    S.Literal("Markdown")
  ),
  content: S.String, // The actual file content
  fileName: S.optional(S.String), // Original filename if uploaded
}) {}

// Union type for context elements
export type ContextElement = NamedPrompt | NamedFile;

// Schema for validation
export const ContextElementSchema = S.Union(NamedPrompt, NamedFile);

// Context sections
export interface ContextSections {
  readonly prePrompt: readonly ContextElement[];
  readonly postPrompt: readonly ContextElement[];
}

// Final assembled context for LLM
export interface FinalContext {
  readonly prePrompt: readonly ContextElement[];
  readonly userPrompt: string;
  readonly userAttachedFiles: readonly string[]; // File IDs
  readonly postPrompt: readonly ContextElement[];
}

// Manager configuration
export interface ContextEngineeringManagerConfig {
  readonly chatAppId: string;
  readonly autoSave: boolean;
  readonly maxElementsPerSection: number;
  readonly enableReordering: boolean;
}

// Manager state
export interface ContextEngineeringManagerState {
  readonly isInitialized: boolean;
  readonly isLoading: boolean;
  readonly chatAppId: string | null;
  readonly prePromptElements: readonly ContextElement[];
  readonly postPromptElements: readonly ContextElement[];
  readonly lastUpdated: Date;
  readonly operationCount: number;
  readonly lastError: string | null;
  readonly config: ContextEngineeringManagerConfig | null;
}

// Manager stats
export interface ContextEngineeringManagerStats {
  readonly totalElements: number;
  readonly prePromptCount: number;
  readonly postPromptCount: number;
  readonly namedPromptsCount: number;
  readonly namedFilesCount: number;
  readonly lastModified: Date | null;
  readonly operationCount: number;
}

// Constants
export const CONTEXT_ENGINEERING_CONSTANTS = {
  MAX_ELEMENTS_PER_SECTION: 50,
  MAX_ELEMENT_NAME_LENGTH: 100,
  MAX_PROMPT_CONTENT_LENGTH: 10000,
  MAX_FILE_CONTENT_LENGTH: 50000,
  DEFAULT_AUTO_SAVE: true,
  DEFAULT_ENABLE_REORDERING: true,
} as const;

// Helper function to create default state
export function createDefaultContextEngineeringState(): ContextEngineeringManagerState {
  return {
    isInitialized: false,
    isLoading: false,
    chatAppId: null,
    prePromptElements: [],
    postPromptElements: [],
    lastUpdated: new Date(),
    operationCount: 0,
    lastError: null,
    config: null,
  };
}

// Helper function to create default config
export function createDefaultContextEngineeringConfig(
  chatAppId: string
): ContextEngineeringManagerConfig {
  return {
    chatAppId,
    autoSave: CONTEXT_ENGINEERING_CONSTANTS.DEFAULT_AUTO_SAVE,
    maxElementsPerSection:
      CONTEXT_ENGINEERING_CONSTANTS.MAX_ELEMENTS_PER_SECTION,
    enableReordering: CONTEXT_ENGINEERING_CONSTANTS.DEFAULT_ENABLE_REORDERING,
  };
}
