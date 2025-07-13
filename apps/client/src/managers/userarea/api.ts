import { Effect } from "effect";
import type { UserAreaManagerErrors } from "./errors";
import type {
  AgentInfo,
  UserAreaManagerConfig,
  UserAreaManagerState,
  UserAreaManagerStats,
  ValidationError,
} from "./types";

export interface UserAreaManagerApi {
  // Core lifecycle operations
  readonly initialize: (
    config: UserAreaManagerConfig
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly cleanup: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly reset: () => Effect.Effect<void, UserAreaManagerErrors>;

  // State management
  readonly getState: () => Effect.Effect<
    UserAreaManagerState,
    UserAreaManagerErrors
  >;
  readonly setState: (
    state: Partial<UserAreaManagerState>
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly subscribe: (
    callback: (state: UserAreaManagerState) => void
  ) => Effect.Effect<() => void, UserAreaManagerErrors>;

  // Text input operations
  readonly setText: (
    text: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly getText: () => Effect.Effect<string, UserAreaManagerErrors>;
  readonly clearText: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly validateText: (
    text: string
  ) => Effect.Effect<readonly ValidationError[], UserAreaManagerErrors>;

  // Message operations
  readonly sendMessage: (
    text?: string,
    attachments?: readonly File[]
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly canSendMessage: () => Effect.Effect<boolean, UserAreaManagerErrors>;
  readonly getMessagePreview: () => Effect.Effect<
    { text: string; attachments: readonly File[] },
    UserAreaManagerErrors
  >;

  // File attachment operations
  readonly addAttachment: (
    file: File
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly addAttachments: (
    files: readonly File[]
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly removeAttachment: (
    file: File
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly clearAttachments: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly getAttachments: () => Effect.Effect<
    readonly File[],
    UserAreaManagerErrors
  >;
  readonly validateFile: (
    file: File
  ) => Effect.Effect<readonly ValidationError[], UserAreaManagerErrors>;

  // Agent operations
  readonly setSelectedAgent: (
    agentId: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly getSelectedAgent: () => Effect.Effect<
    string | null,
    UserAreaManagerErrors
  >;
  readonly getAvailableAgents: () => Effect.Effect<
    readonly AgentInfo[],
    UserAreaManagerErrors
  >;
  readonly setAvailableAgents: (
    agents: readonly AgentInfo[]
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly refreshAgents: () => Effect.Effect<void, UserAreaManagerErrors>;

  // Input state operations
  readonly setInputDisabled: (
    disabled: boolean
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly isInputDisabled: () => Effect.Effect<boolean, UserAreaManagerErrors>;
  readonly setInputPlaceholder: (
    placeholder: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly setInputRows: (
    rows: number
  ) => Effect.Effect<void, UserAreaManagerErrors>;

  // UI state operations
  readonly setShowAttachments: (
    show: boolean
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly setShowAgentToolbar: (
    show: boolean
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly setLoading: (
    loading: boolean
  ) => Effect.Effect<void, UserAreaManagerErrors>;

  // Event handlers
  readonly onInputFocus: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onInputBlur: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onInputKeyDown: (
    event: KeyboardEvent
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onTextChange: (
    text: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onAgentChange: (
    agentId: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onFileAttach: (
    files: readonly File[]
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onFileRemove: (
    file: File
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly onSendMessage: () => Effect.Effect<void, UserAreaManagerErrors>;

  // Validation operations
  readonly validateState: () => Effect.Effect<
    readonly ValidationError[],
    UserAreaManagerErrors
  >;
  readonly validateConfig: (
    config: UserAreaManagerConfig
  ) => Effect.Effect<readonly ValidationError[], UserAreaManagerErrors>;
  readonly clearValidationErrors: () => Effect.Effect<
    void,
    UserAreaManagerErrors
  >;

  // Statistics and monitoring
  readonly getStats: () => Effect.Effect<
    UserAreaManagerStats,
    UserAreaManagerErrors
  >;
  readonly resetStats: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly recordInteraction: (
    type: string,
    details?: Record<string, unknown>
  ) => Effect.Effect<void, UserAreaManagerErrors>;

  // Configuration operations
  readonly updateConfig: (
    config: Partial<UserAreaManagerConfig>
  ) => Effect.Effect<void, UserAreaManagerErrors>;
  readonly getConfig: () => Effect.Effect<
    UserAreaManagerConfig,
    UserAreaManagerErrors
  >;

  // Error handling
  readonly clearError: () => Effect.Effect<void, UserAreaManagerErrors>;
  readonly getLastError: () => Effect.Effect<
    Error | null,
    UserAreaManagerErrors
  >;
  readonly handleError: (
    error: Error,
    context?: string
  ) => Effect.Effect<void, UserAreaManagerErrors>;
}
