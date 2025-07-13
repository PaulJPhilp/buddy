import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect } from "effect";
import type { Message } from "./ChatBubble";
import type { ChatBubbleAction } from "./chatbubble-manager/api";
import { ChatBubbleError } from "./chatbubble-manager/errors";
import type { ChatBubbleState } from "./chatbubble-manager/types";
import type { ChatAppComponentState, ChatAppUIState } from "./types";
// Define a domain-specific error type for ChatAppManager
export class ChatAppManagerError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ChatAppManagerError";
  }
}

export interface ChatAppManagerApi {
  // Lifecycle
  readonly initialize: (
    config: ChatAppConfig
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly cleanup: () => Effect.Effect<void, ChatAppManagerError>;

  // Message Handling
  readonly sendMessage: (
    content: string
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly receiveMessage: (
    message: Message
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly getMessages: () => Effect.Effect<Message[], ChatAppManagerError>;
  readonly clearMessages: () => Effect.Effect<void, ChatAppManagerError>;

  // State
  readonly getState: () => Effect.Effect<
    ChatAppComponentState,
    ChatAppManagerError
  >;
  readonly setUIState: (
    uiState: Partial<ChatAppUIState>
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly getUIState: () => Effect.Effect<ChatAppUIState, ChatAppManagerError>;

  // Agent
  readonly assignAgent: (
    agent: AgentConfig
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly switchAgent: (
    agentId: string
  ) => Effect.Effect<void, ChatAppManagerError>;
  readonly getCurrentAgent: () => Effect.Effect<
    AgentConfig | null,
    ChatAppManagerError
  >;

  // Subscription
  readonly subscribe: (
    callback: (state: ChatAppComponentState) => void
  ) => Effect.Effect<() => void, ChatAppManagerError>;

  // Bubble-level methods
  readonly getBubbleState: (
    messageId: string
  ) => Effect.Effect<ChatBubbleState, never, never>;
  readonly setBubbleState: (
    messageId: string,
    state: Partial<ChatBubbleState>
  ) => Effect.Effect<void, never, never>;
  readonly performBubbleAction: (
    messageId: string,
    action: ChatBubbleAction
  ) => Effect.Effect<void, ChatBubbleError, never>;
  readonly formatBubbleMessage: (
    message: Message
  ) => Effect.Effect<string, never, never>;
}
