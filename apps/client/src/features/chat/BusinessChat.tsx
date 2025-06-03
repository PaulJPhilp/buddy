"use client";

import React, { useMemo } from "react";
import { ChatApp } from "./ChatApp";
import type { ChatAppTheme } from "./themes/themeTypes";
import type { ChatAgentConfig } from "./types";
import { useTheme } from "@/contexts/ThemeContext";

interface BusinessChatProps {
  isActive?: boolean;
  onActivate?: () => void;
  theme?: Partial<ChatAppTheme> | string;
}

const agentConfig: ChatAgentConfig = {
  agentId: "business-agent",
  agentWsUrl: "ws://localhost:8080",
  initialAgentName: "Business Assistant",
  agents: [
    {
      id: "business-agent",
      name: "Business Assistant",
      description: "A professional business assistant",
      status: { mood: 80, energy: 90, health: 95 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true },
      avatar: "/avatars/business.png"
    }
  ]
};

export default function BusinessChat({
  isActive,
  onActivate,
  theme,
}: BusinessChatProps) {
  const chatId = "chat-1";
  const { getChatStyle } = useTheme();
  
  // Get theme styles from context
  const themeStyles = useMemo(() => getChatStyle(chatId), [getChatStyle, chatId]);

  return (
    <ChatApp
      chatId={chatId}
      agentConfig={agentConfig}
      className="h-full"
      theme={theme}
    />
  );
}

