import { Effect } from "effect";
import type { ContextEngineeringError } from "./errors";
import type {
  ContextElement,
  ContextEngineeringManagerConfig,
  ContextEngineeringManagerState,
  ContextEngineeringManagerStats,
  FinalContext,
} from "./types";

export interface ContextEngineeringManagerApi {
  // State Management
  readonly getState: () => Effect.Effect<
    ContextEngineeringManagerState,
    ContextEngineeringError
  >;
  readonly setState: (
    updates: Partial<ContextEngineeringManagerState>
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly resetState: () => Effect.Effect<void, ContextEngineeringError>;

  // Initialization and Configuration
  readonly initialize: (
    config: ContextEngineeringManagerConfig
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly getConfig: () => Effect.Effect<
    ContextEngineeringManagerConfig | null,
    ContextEngineeringError
  >;
  readonly updateConfig: (
    updates: Partial<ContextEngineeringManagerConfig>
  ) => Effect.Effect<void, ContextEngineeringError>;

  // Context Assembly - Core Function
  readonly getFinalContext: (
    userPrompt: string,
    userAttachedFiles: readonly string[]
  ) => Effect.Effect<FinalContext, ContextEngineeringError>;

  // Pre-Prompt Element Management
  readonly getPrePromptElements: () => Effect.Effect<
    readonly ContextElement[],
    ContextEngineeringError
  >;
  readonly addPrePromptElement: (
    element: ContextElement,
    index?: number
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly updatePrePromptElement: (
    elementId: string,
    updates: Partial<ContextElement>
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly removePrePromptElement: (
    elementId: string
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly reorderPrePromptElements: (
    elementIds: readonly string[]
  ) => Effect.Effect<void, ContextEngineeringError>;

  // Post-Prompt Element Management
  readonly getPostPromptElements: () => Effect.Effect<
    readonly ContextElement[],
    ContextEngineeringError
  >;
  readonly addPostPromptElement: (
    element: ContextElement,
    index?: number
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly updatePostPromptElement: (
    elementId: string,
    updates: Partial<ContextElement>
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly removePostPromptElement: (
    elementId: string
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly reorderPostPromptElements: (
    elementIds: readonly string[]
  ) => Effect.Effect<void, ContextEngineeringError>;

  // Element Queries
  readonly getElementById: (
    elementId: string
  ) => Effect.Effect<ContextElement | null, ContextEngineeringError>;
  readonly getElementsByName: (
    name: string
  ) => Effect.Effect<readonly ContextElement[], ContextEngineeringError>;
  readonly getElementsByType: (
    type: "NamedPrompt" | "NamedFile"
  ) => Effect.Effect<readonly ContextElement[], ContextEngineeringError>;

  // Validation
  readonly validateElement: (
    element: ContextElement
  ) => Effect.Effect<void, ContextEngineeringError>;
  readonly validateSection: (
    section: "prePrompt" | "postPrompt",
    elements: readonly ContextElement[]
  ) => Effect.Effect<void, ContextEngineeringError>;

  // Statistics and Metrics
  readonly getStats: () => Effect.Effect<
    ContextEngineeringManagerStats,
    ContextEngineeringError
  >;
  readonly getElementCount: () => Effect.Effect<
    {
      prePrompt: number;
      postPrompt: number;
      total: number;
    },
    ContextEngineeringError
  >;

  // Persistence (for future use)
  readonly save: () => Effect.Effect<void, ContextEngineeringError>;
  readonly load: () => Effect.Effect<void, ContextEngineeringError>;

  // Subscription for state changes
  readonly subscribe: (
    callback: (state: ContextEngineeringManagerState) => void
  ) => Effect.Effect<() => void, ContextEngineeringError>;

  // Utility methods
  readonly clear: () => Effect.Effect<void, ContextEngineeringError>;
  readonly export: () => Effect.Effect<string, ContextEngineeringError>;
  readonly import: (
    data: string
  ) => Effect.Effect<void, ContextEngineeringError>;
}
