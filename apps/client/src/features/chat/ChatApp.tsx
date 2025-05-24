"use client";

import type { ChatState } from "@/services/chat/ChatServiceApi";
import type { ChatMessage as AppChatMessage } from "@ui/components/MessageArea";
import { type ToolBarItem } from "@ui/components/ui/toolbar";
import { Effect, Ref, Runtime } from "effect";
import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";

import type { MessageApi } from "@/services/chat/ChatServiceApi";
import ChatArea from "./components/ChatArea";
import { HeaderBar } from "./components/HeaderBar";
import UserArea from "./components/UserArea";
import type { Agent } from "./components/UserArea/AgentToolBar";

// Style constants for reusable classes
const STYLE_CONSTANTS = {
  container:
    "h-full p-0.5 flex flex-col relative bg-background text-foreground min-h-0 max-w-6xl mx-auto w-full",
  innerContainer:
    "flex-1 border rounded-lg border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200",
  chatAreaWrapper:
    "flex-grow overflow-hidden transition-all duration-200 ease-in-out",
};

export interface ChatAppProps {
  // App name
  appName: string;

  // Active state
  isActive?: boolean;
  onActivate?: () => void;

  // Theme colors
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;

  // Messages
  isTyping?: boolean;
  isSending?: boolean;
  error?: string | null;

  // Agents
  agents: Agent[];
  selectedAgent: string;
  onSelectedAgentChange: (agentId: string) => void | Promise<void>;

  // Actions
  onSendMessage: (text: string, files?: File[]) => void | Promise<void>;

  // Toolbar configurations
  messageToolbarConfig?: (message: ChatState["messages"][0]) => ToolBarItem[];
  agentToolbarConfig?: (agent: Agent) => ToolBarItem[];
  minimalInputToolbarConfig?: ToolBarItem[];
}

export default function ChatApp(props: ChatAppProps) {
  const {
    appName: appNameProp,
    isActive = false,
    onActivate,
    primaryColor,
    secondaryColor,
    activePrimaryColor,
    activeSecondaryColor,
    messageToolbarConfig,
    agentToolbarConfig,
    minimalInputToolbarConfig,
    isTyping,
    isSending,
    error,
    agents,
    selectedAgent,
    onSelectedAgentChange,
    onSendMessage: onSendMessageProp,
  } = props;

  // Effect Runtime and messages Ref
  const [runtime] = useState(() => Runtime.defaultRuntime);
  const [messagesRef] = useState(() => Effect.runSync(Ref.make<AppChatMessage[]>([])));
  const [displayMessages, setDisplayMessages] = useState<AppChatMessage[]>([]);

  const simulateAgentResponse = useCallback(
    (userText: string) =>
      Effect.gen(function* () {
        yield* Effect.sleep("1 seconds");
        const agentMessage: AppChatMessage = {
          id: nanoid(),
          text: `Agent received: "${userText}"`, // Simple echo simulation
          isUser: false,
          timestamp: new Date(),
        };
        const currentMessages = yield* Ref.get(messagesRef);
        const newMessages = [...currentMessages, agentMessage];
        yield* Ref.set(messagesRef, newMessages);
        yield* Effect.sync(() => setDisplayMessages(newMessages));
      }),
    [messagesRef],
  );

  const handleUserSubmit = useCallback(
    async (text: string, files?: File[]) => {
      if (!text.trim() && (!files || files.length === 0)) {
        return;
      }
      const userMessage: AppChatMessage = {
        id: nanoid(),
        text,
        isUser: true,
        timestamp: new Date(),
      };
      // Update local Ref
      const updateEffect = Effect.gen(function* () {
        const currentMessages = yield* Ref.get(messagesRef);
        const newMessages = [...currentMessages, userMessage];
        yield* Ref.set(messagesRef, newMessages);
        return newMessages;
      });
      const newMessages = await Runtime.runPromise(runtime)(updateEffect);
      setDisplayMessages(newMessages);

      // Call the original prop for external handling
      if (onSendMessageProp) {
        await onSendMessageProp(text, files);
      }
      // Fork the simulation effect so it doesn't block
      Runtime.runFork(runtime)(simulateAgentResponse(text));
    },
    [runtime, messagesRef, onSendMessageProp, simulateAgentResponse],
  );

  const headerProps = {
    title: appNameProp || "Buddy Chat",
    errorInfo: error
      ? { message: error, severity: "error" as const }
      : undefined,
    isSelected: isActive,
    statusInfo: undefined,
    onToggleStatusPanel: () => { },
    primaryColor: isActive ? activePrimaryColor : primaryColor,
    secondaryColor: isActive ? activeSecondaryColor : secondaryColor,
  };

  const { theme } = useTheme();

  const mapAppMessagesToApiMessages = (
    appMessages: AppChatMessage[],
  ): MessageApi[] => {
    return appMessages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.isUser ? ("user" as const) : ("assistant" as const),
      timestamp: typeof msg.timestamp === 'number'
        ? msg.timestamp
        : msg.timestamp instanceof Date
          ? msg.timestamp.getTime()
          : Date.parse(msg.timestamp), // Fallback for string, ensure it's a valid date string
      // status, attachments, metadata can be added if needed
    }));
  };

  return (
    <button
      type="button"
      className={STYLE_CONSTANTS.container}
      onClick={onActivate}
      onKeyDown={(e) => e.key === "Enter" && onActivate?.()}
    >
      <div className={STYLE_CONSTANTS.innerContainer}>
        <HeaderBar {...headerProps} />
        <div className={STYLE_CONSTANTS.chatAreaWrapper}>
          <ChatArea
            messages={mapAppMessagesToApiMessages(displayMessages)}
            isTyping={isTyping}
            className="flex-1"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            activePrimaryColor={activePrimaryColor}
            activeSecondaryColor={activeSecondaryColor}
            assistantMessageToolbarConfig={messageToolbarConfig}
          />
        </div>
        <UserArea
          onSendMessage={handleUserSubmit}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectedAgentChange={onSelectedAgentChange}
          currentAttachments={[]}
          onRemoveAttachment={() => { }}
          disabled={isSending}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activePrimaryColor={activePrimaryColor}
          activeSecondaryColor={activeSecondaryColor}
          agentToolbarConfig={agentToolbarConfig}
          minimalInputToolbarConfig={minimalInputToolbarConfig}
        />
      </div>
    </button>
  );
}
