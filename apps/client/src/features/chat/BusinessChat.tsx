"use client";

import React from "react";
import { Icon } from "@ui/components/Icon";
import type { ToolBarItem } from "@ui/components/ui/toolbar";
import { useBusinessChatStore } from "../../stores/chatStores";
import ChatApp from "./ChatApp";

interface BusinessChatProps {
  isActive?: boolean;
  onActivate?: () => void;
}

export default function BusinessChat({ isActive, onActivate }: BusinessChatProps) {
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
  } = useBusinessChatStore();

  const minimalInputToolbarConfig: ToolBarItem[] = [
    {
      id: "dashboard",
      icon: <Icon name="LayoutDashboard" size={6} />,
      action: () => console.log("Open dashboard"),
      tooltip: "Open Dashboard",
      intent: "primary",
    },
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
      appName="Business Analytics"
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
