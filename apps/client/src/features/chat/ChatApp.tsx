"use client";

import { ChatService } from "@/services/chat/ChatService";
import type { ChatState } from "@/services/chat/ChatServiceApi";
import { useAppShellStore } from "@/stores/appShellStore";
import { Effect, pipe } from "effect";
import React, { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import ChatArea from "./components/ChatArea";
import { HeaderBar, type StatusInfo } from "./components/HeaderBar";
import UserArea, { type UserAreaProps } from "./components/UserArea";
import type { Agent } from "./components/UserArea/AgentToolBar";
import type { AttachmentFile } from "./components/UserArea/AttachmentBar";

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
  messages: ChatState["messages"];
  isTyping?: boolean;
  isSending?: boolean;
  error?: string | null;

  // Agents
  agents: Agent[];
  selectedAgent: string;
  onSelectedAgentChange: (agentId: string) => void;

  // Actions
  onSendMessage: (text: string, files?: File[]) => Promise<void>;

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
    messages,
    isTyping,
    isSending,
    error,
    agents,
    selectedAgent,
    onSelectedAgentChange: setSelectedAgent,
    onSendMessage: sendMessage,
  } = props;
  const handleAgentChange: Dispatch<SetStateAction<string>> = (value) => {
    const newValue = typeof value === 'function' ? value(selectedAgent) : value;
    setSelectedAgent(newValue);
  };

  const handleSendMessage = useCallback(
    async (text: string, files?: File[]) => {
      if (!text.trim() && (!files || files.length === 0)) {
        return;
      }
      await sendMessage(text, files);
    },
    [sendMessage],
  );

  const headerProps = {
    title: appNameProp || "Buddy Chat",
    errorInfo: error
      ? { message: error, severity: "error" as const }
      : undefined,
    isSelected: isActive,
    statusInfo: undefined,
    onToggleStatusPanel: () => {},
    primaryColor: isActive ? activePrimaryColor : primaryColor,
    secondaryColor: isActive ? activeSecondaryColor : secondaryColor,
  };

  return (
    <div 
      className={STYLE_CONSTANTS.container}
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onActivate?.()}
    >
      <div className={STYLE_CONSTANTS.innerContainer}>
        <HeaderBar {...headerProps} />
        <div className={STYLE_CONSTANTS.chatAreaWrapper}>
          <ChatArea
            messages={messages}
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
          onSendMessage={handleSendMessage}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectedAgentChange={handleAgentChange}
          currentAttachments={[]}
          onRemoveAttachment={() => {}}
          disabled={isSending}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activePrimaryColor={activePrimaryColor}
          activeSecondaryColor={activeSecondaryColor}
          agentToolbarConfig={agentToolbarConfig}
          minimalInputToolbarConfig={minimalInputToolbarConfig}
        />
      </div>
    </div>
  );
}