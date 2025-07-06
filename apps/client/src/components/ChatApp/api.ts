import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { ChatAppComponentError } from "./errors";
import type {
  ChatAppComponentConfig,
  ChatAppComponentState,
  ChatAppOperationType,
  ChatAppUIState,
  WindowPosition,
  WindowSize,
  WindowState,
} from "./types";

export interface ChatAppComponentApi {
  // Core component lifecycle (similar to CoreComponentApi but with ChatApp-specific types)
  readonly initialize: (
    config: ChatAppComponentConfig
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly getState: () => Effect.Effect<
    ChatAppComponentState,
    ChatAppComponentError
  >;
  readonly setState: (
    state: Partial<ChatAppComponentState>
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly subscribe: (
    callback: (state: ChatAppComponentState) => void
  ) => Effect.Effect<() => void, ChatAppComponentError>;
  readonly cleanup: () => Effect.Effect<void, ChatAppComponentError>;

  // Chat app configuration management
  readonly loadChatApp: (
    chatAppConfig: ChatAppConfig
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly getChatAppConfig: () => Effect.Effect<
    ChatAppConfig | null,
    ChatAppComponentError
  >;
  readonly reloadChatApp: () => Effect.Effect<void, ChatAppComponentError>;

  // Agent management
  readonly loadAgents: (
    agents: AgentConfig[]
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly getAssignedAgents: () => Effect.Effect<
    AgentConfig[],
    ChatAppComponentError
  >;
  readonly hasAgent: (
    agentId: string
  ) => Effect.Effect<boolean, ChatAppComponentError>;

  // Window management
  readonly openWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly closeWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly minimizeWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly maximizeWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly restoreWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly moveWindow: (
    position: WindowPosition
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly resizeWindow: (
    size: WindowSize
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly focusWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly blurWindow: () => Effect.Effect<void, ChatAppComponentError>;
  readonly getWindowState: () => Effect.Effect<
    WindowState,
    ChatAppComponentError
  >;

  // UI state management
  readonly getUIState: () => Effect.Effect<
    ChatAppUIState,
    ChatAppComponentError
  >;
  readonly setUIState: (
    uiState: Partial<ChatAppUIState>
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly isWindowOpen: () => Effect.Effect<boolean, ChatAppComponentError>;
  readonly isWindowFocused: () => Effect.Effect<boolean, ChatAppComponentError>;

  // UI rendering
  readonly renderChatAppUI: () => Effect.Effect<void, ChatAppComponentError>;
  readonly isUIRendered: () => Effect.Effect<boolean, ChatAppComponentError>;

  // Conversation management
  readonly startConversation: () => Effect.Effect<void, ChatAppComponentError>;
  readonly endConversation: () => Effect.Effect<void, ChatAppComponentError>;
  readonly getConversationCount: () => Effect.Effect<
    number,
    ChatAppComponentError
  >;
  readonly updateActivity: () => Effect.Effect<void, ChatAppComponentError>;
  readonly getLastActivity: () => Effect.Effect<number, ChatAppComponentError>;

  // Operation tracking
  readonly executeOperation: (
    operation: ChatAppOperationType
  ) => Effect.Effect<void, ChatAppComponentError>;
  readonly getLastOperation: () => Effect.Effect<
    ChatAppOperationType | null,
    ChatAppComponentError
  >;
}
