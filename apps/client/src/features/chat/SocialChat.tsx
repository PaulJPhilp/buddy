"use client";

import React from "react";
import { Icon } from "@ui/components/Icon";
import type { ToolBarItem } from "@ui/components/ui/toolbar";
import { useSocialChatStore } from "../../stores/chatStores";
import ChatApp from "./ChatApp";

interface SocialChatProps {
  isActive?: boolean;
  onActivate?: () => void;
}

export default function SocialChat({ isActive, onActivate }: SocialChatProps) {
  const {
    theme,
    messages,
    agents,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    isTyping,
    isSending,
    error,
    hasRatingToolbar,
    rateMessage,
  } = useSocialChatStore();

  const minimalInputToolbarConfig: ToolBarItem[] = [
    {
      id: "attach",
      icon: <Icon name="Paperclip" size={6} />,
      action: () => console.log("Attach file"),
      tooltip: "Attach File",
    },
    {
      id: "send",
      icon: <Icon name="Send" size={6} />,
      action: () => console.log("Send message"),
      tooltip: "Send Message",
      intent: "secondary",
    },
  ];

  return (
    <ChatApp
      appName="Weekend Plans"
      {...theme}
      isActive={isActive}
      onActivate={onActivate}
      messages={messages}
      agents={agents}
      selectedAgent={selectedAgent}
      onSelectedAgentChange={setSelectedAgent}
      onSendMessage={sendMessage}
      isTyping={isTyping}
      isSending={isSending}
      error={error}
      minimalInputToolbarConfig={minimalInputToolbarConfig}
    />
  );
}
