import type { Message } from "@/types/chat";
import type { ChatAppConfig } from "@/types/global";
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
  readonly onCompact: () => void;
  readonly onClose: () => void;
  readonly onClear: () => void;
  readonly onSend: (text: string, files?: File[]) => void;
  readonly onSettings: () => void;
  readonly agents: ReadonlyArray<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  readonly selectedAgentId: string;
  readonly onSelectedAgentChange: (id: string) => void;
  readonly attachedFiles: File[];
  readonly onAddAttachments: (files: File[]) => void;
  readonly onRemoveAttachment: (file: File) => void;
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
  onCompact,
  onClose,
  onClear,
  onSend,
  onSettings,
  agents,
  selectedAgentId,
  onSelectedAgentChange,
  attachedFiles,
  onAddAttachments,
  onRemoveAttachment,
  inputDisabled = false,
}: ChatAppShellProps) {
  return (
    <section
      data-testid="chat-app-root"
      aria-label={config.name}
      aria-expanded={isExpanded ? "true" : "false"}
      className={`chat-app-shell h-full flex flex-col overflow-hidden${isExpanded ? " expanded" : ""}`}
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
        onExpand={onExpand}
        onCompact={onCompact}
        onClose={onClose}
        onSettings={onSettings}
        isExpanded={isExpanded}
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
      />

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
        currentAttachments={attachedFiles}
        onRemoveAttachment={onRemoveAttachment}
        onAddAttachments={onAddAttachments}
        disabled={inputDisabled || status === "error"}
      />
    </section>
  );
}
