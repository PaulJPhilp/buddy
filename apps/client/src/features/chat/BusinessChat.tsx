"use client";

import React from "react";
import { ChatApp } from "./ChatApp";
import type { ChatAppTheme } from "./themes/themeTypes";
import type { ChatAgentConfig } from "./types";

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
  console.log('[BusinessChat] Rendering with props:', { isActive, theme, onActivate: !!onActivate });

  // Generate chatId only once per component instance
  const chatId = React.useMemo(() => {
    const id = `business-chat-${Date.now()}`;
    console.log('[BusinessChat] Generated chatId:', id);
    return id;
  }, []);

  console.log('[BusinessChat] Using agentConfig:', agentConfig);

  return (
    <ChatApp
      chatId={chatId}
      agentConfig={agentConfig}
      className="h-full"
      theme={theme}
    />
  );
}

