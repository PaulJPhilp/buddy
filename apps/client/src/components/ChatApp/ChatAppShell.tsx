import type { Message } from "@/types/chat";
import type { ChatAppConfig } from "@/types/global";
import { ExternalLink, X } from "lucide-react";
import { ChatArea } from "../ChatArea";
import { HeaderBar } from "../HeaderBar/HeaderBar";
import UserArea from "../UserArea";

interface ChatAppShellProps {
  readonly config: ChatAppConfig;
  readonly chatState: {
    messages: Message[];
    isTyping: boolean;
    isRendering: boolean;
  };
  readonly status: "idle" | "connecting" | "connected" | "error";
  readonly isExpanded: boolean;
  readonly onExpand: () => void;
  readonly onClear: () => void;
  readonly onSend: (text: string, files?: File[]) => void;
  readonly agents: ReadonlyArray<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  readonly selectedAgentId: string;
  readonly onSelectedAgentChange: (id: string) => void;
  readonly inputDisabled?: boolean;
}

/**
 * Pure presentation component – renders the chat UI without touching Effect or
 * React hooks beyond basic event handlers.
 */
export function ChatAppShell({
  config,
  chatState,
  status,
  isExpanded,
  onExpand,
  onClear,
  onSend,
  agents,
  selectedAgentId,
  onSelectedAgentChange,
  inputDisabled = false,
}: ChatAppShellProps) {
  return (
    <section
      data-testid="chat-app-root"
      aria-label={config.name}
      aria-expanded={isExpanded ? "true" : "false"}
      className={`h-full flex flex-col overflow-hidden${isExpanded ? " expanded" : ""}`}
      style={{
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
      }}
    >
      {/* Header Bar */}
      <HeaderBar
        title={config.name}
        isSelected={false}
        onClearChat={onClear}
        statusInfo={{
          agentStatus: {
            state:
              status === "connecting"
                ? "connecting"
                : status === "error"
                  ? "error"
                  : chatState.isTyping
                    ? "thinking"
                    : chatState.isRendering
                      ? "paused"
                      : "idle",
            details:
              status === "connecting"
                ? "Connecting..."
                : status === "error"
                  ? "Connection error"
                  : `${chatState.messages.length} messages`,
          },
        }}
      >
        {/* Expand button */}
        {!isExpanded && (
          <button
            type="button"
            data-testid="expand-chat-button"
            title="Expand chat"
            aria-label="Expand chat"
            onClick={onExpand}
            className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 flex items-center"
            style={{ color: "var(--color-chat-header-text, #1e293b)" }}
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
        {/* Close button always shows */}
        <button
          type="button"
          data-testid="close-chat-button"
          title="Close chat"
          aria-label="Close chat"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("buddy:removeChatApp", { detail: config.id }),
            );
          }}
          className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-red-100 flex items-center"
          style={{ color: "var(--color-chat-header-text, #1e293b)" }}
        >
          <X className="h-3 w-3" />
        </button>
      </HeaderBar>

      {/* Chat Area */}
      <ChatArea
        messages={chatState.messages}
        isTyping={chatState.isTyping}
        isRendering={chatState.isRendering}
        className="flex-1"
      />

      {/* User Area */}
      <UserArea
        onSendMessage={onSend}
        agents={agents}
        selectedAgent={selectedAgentId}
        onSelectedAgentChange={onSelectedAgentChange}
        currentAttachments={[]}
        onRemoveAttachment={() => {}}
        onAddAttachments={() => {}}
        disabled={inputDisabled || status === "error"}
      />
    </section>
  );
}
