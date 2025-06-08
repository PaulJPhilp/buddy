import { Layer } from "effect";
import { ChatAppTheme } from "../themes/themeTypes";

export interface ProtocolMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  type?: string;
  isComplete?: boolean;
}

export interface ChatAgentConfig {
  id: string;
  initialAgentName: string;
  description?: string;
  status?: {
    mood: number;
    energy: number;
    health: number;
  };
  capabilities?: {
    canSpeak: boolean;
    canMove: boolean;
    canLearn: boolean;
  };
}

export interface ChatAppProps {
  /** Unique identifier for the chat session */
  chatId: string;
  /** Optional agent ID, will be generated if not provided */
  agentId?: string;
  /** Initial messages to display */
  messages?: ProtocolMessage[];
  /** Callback for sending messages (external control) */
  sendMessageAction?: (message: ProtocolMessage) => void;
  /** Error state */
  error?: Error | null;
  /** Additional CSS classes */
  className?: string;
  /** Theme configuration */
  theme?: Partial<ChatAppTheme> | string;
  /** Injected layer for dependency injection */
  injectedLayer?: Layer.Layer<any, any, any>;
  /** Display name for the chat */
  displayName?: string;
  /** Whether the chat is disabled */
  disabled?: boolean;
  /** Callback when the chat is focused */
  onFocus?: () => void;
  /** Callback when the chat is blurred */
  onBlur?: () => void;
}

export interface ChatState {
  messages: ProtocolMessage[];
  status:
    | "idle"
    | "loading"
    | "sending"
    | "error"
    | "initializing"
    | "connecting";
  error: Error | null;
  isTyping: boolean;
  lastMessageId?: string;
}

export type ChatInstanceAction =
  | { type: "SEND_MESSAGE"; payload: ProtocolMessage }
  | { type: "MESSAGE_SENT"; payload: { message: ProtocolMessage } }
  | { type: "MESSAGE_RECEIVED"; payload: ProtocolMessage }
  | { type: "SET_STATUS"; payload: ChatState["status"] }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "CLEAR_MESSAGES" };
