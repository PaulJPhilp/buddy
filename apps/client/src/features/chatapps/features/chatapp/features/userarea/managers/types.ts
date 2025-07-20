export interface UserAreaManagerState {
  readonly chatAppId: string;
  readonly inputText: string;
  readonly attachments: readonly File[];
  readonly selectedAgentId: string | null;
  readonly availableAgents: readonly AgentInfo[];
  readonly isInputDisabled: boolean;
  readonly isLoading: boolean;
  readonly inputPlaceholder: string;
  readonly showAttachments: boolean;
  readonly showAgentToolbar: boolean;
  readonly inputRows: number;
  readonly maxInputLength: number;
  readonly isInitialized: boolean;
  readonly lastActivity: Date;
  readonly errorInfo: ErrorInfo | null;
  readonly validationErrors: readonly ValidationError[];
  readonly stats: UserAreaManagerStats;
}

export interface AgentInfo {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly isAvailable: boolean;
  readonly description?: string;
  readonly capabilities?: readonly string[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ErrorInfo {
  readonly message: string;
  readonly code: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

export interface UserAreaManagerConfig {
  readonly chatAppId: string;
  readonly initialText?: string;
  readonly initialAgentId?: string;
  readonly inputPlaceholder?: string;
  readonly maxInputLength?: number;
  readonly inputRows?: number;
  readonly showAttachments?: boolean;
  readonly showAgentToolbar?: boolean;
  readonly enableFileUpload?: boolean;
  readonly enableAgentSelection?: boolean;
  readonly allowedFileTypes?: readonly string[];
  readonly maxFileSize?: number;
  readonly maxAttachments?: number;
}

export interface UserAreaActions {
  readonly onSendMessage: (text: string, attachments?: readonly File[]) => void;
  readonly onTextChange: (text: string) => void;
  readonly onAgentChange: (agentId: string) => void;
  readonly onFileAttach: (files: readonly File[]) => void;
  readonly onFileRemove: (file: File) => void;
  readonly onInputFocus: () => void;
  readonly onInputBlur: () => void;
  readonly onInputKeyDown: (event: KeyboardEvent) => void;
}

export interface UserAreaManagerStats {
  readonly totalMessages: number;
  readonly totalAttachments: number;
  readonly totalFileSize: number;
  readonly agentSwitches: number;
  readonly averageMessageLength: number;
  readonly interactionCount: number;
  readonly lastMessageTime: Date | null;
  readonly sessionDuration: number;
  readonly errorCount: number;
  readonly validationFailures: number;
}

// Constants
export const USER_AREA_CONSTANTS = {
  DEFAULT_PLACEHOLDER: "Type your message...",
  DEFAULT_MAX_LENGTH: 4000,
  DEFAULT_INPUT_ROWS: 1,
  MAX_ATTACHMENTS: 10,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/json",
    "text/csv",
  ],
  VALIDATION_DEBOUNCE_MS: 300,
  AUTO_SAVE_INTERVAL_MS: 5000,
} as const;

export type UserAreaManagerConstants = typeof USER_AREA_CONSTANTS;
