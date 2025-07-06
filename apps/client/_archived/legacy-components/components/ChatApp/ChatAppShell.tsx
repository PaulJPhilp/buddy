import type { Message } from "@/types/chat";
import type { ChatAppConfig } from "@/types/global";
import { ChatArea } from "../ChatArea";
import { HeaderBar } from "../HeaderBar/HeaderBar";
import UserArea from "../UserArea";

interface ChatAppShellProps {
  readonly chatId: string;
  readonly title: string;
  readonly avatarUrl?: string;
  readonly messages: readonly Message[];
  readonly isTyping: boolean;
  readonly isConnected: boolean;
  readonly isExpanded: boolean;
  readonly onExpand: () => void;
  readonly onCompact: () => void;
  readonly onClose: () => void;
  readonly onClearChat: () => void;
  readonly onSendMessage: (text: string, files?: File[]) => void;
  readonly onSettings: () => void;
  readonly availableAgents: ReadonlyArray<{ id: string; name: string }>;
  readonly currentAgentId: string;
  readonly onAgentChange: (id: string) => void;
  readonly attachments: readonly File[];
  readonly onAddAttachments: (files: File[]) => void;
  readonly onRemoveAttachment: (file: File) => void;
  readonly inputPlaceholder: string;
}

/**
 * Pure presentation component – renders the chat UI without touching Effect or
 * React hooks beyond basic event handlers.
 */
export function ChatAppShell({
  chatId,
  title,
  messages,
  isTyping,
  isConnected,
  isExpanded,
  onExpand,
  onCompact,
  onClose,
  onClearChat,
  onSendMessage,
  onSettings,
  availableAgents,
  currentAgentId,
  onAgentChange,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  inputPlaceholder,
}: ChatAppShellProps) {
  const agentStatus = isConnected
    ? isTyping
      ? "thinking"
      : "idle"
    : "connecting";

  return (
    <section
      data-testid="chat-app-root"
      aria-label={title}
      aria-expanded={isExpanded ? "true" : "false"}
      className={`chat-app-shell h-full flex flex-col overflow-hidden${isExpanded ? " expanded" : ""}`}
      style={{
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
      }}
    >
      {/* Header Bar */}
      <HeaderBar
        title={title}
        isSelected={false}
        onClearChat={onClearChat}
        onExpand={onExpand}
        onCompact={onCompact}
        onClose={onClose}
        onSettings={onSettings}
        isExpanded={isExpanded}
        statusInfo={{
          agentStatus: {
            state: agentStatus,
            details:
              agentStatus === "connecting"
                ? "Connecting..."
                : `${messages.length} messages`,
          },
        }}
      />

      {/* Chat Area */}
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        isRendering={false}
        className="flex-1"
      />

      {/* User Area */}
      <UserArea
        onSendMessage={onSendMessage}
        agents={availableAgents.map((agent) => ({
          ...agent,
          isActive: agent.id === currentAgentId,
        }))}
        selectedAgent={currentAgentId}
        onSelectedAgentChange={onAgentChange}
        currentAttachments={attachments}
        onRemoveAttachment={onRemoveAttachment}
        onAddAttachments={onAddAttachments}
        disabled={!isConnected}
        placeholder={inputPlaceholder}
      />
    </section>
  );
}
