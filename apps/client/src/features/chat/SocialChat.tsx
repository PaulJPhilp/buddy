"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { ChatApp } from "./ChatApp";
import type { ChatAppTheme } from "./themes/themeTypes";
import type { ChatAgentConfig } from "./types";

interface SocialChatProps {
  isActive?: boolean;
  onActivate?: () => void;
  theme?: Partial<ChatAppTheme> | string;
}

const agentConfig: ChatAgentConfig = {
  agentId: "social-agent",
  initialAgentName: "Social Assistant",
  agents: [
    {
      id: "social-agent",
      name: "Social Assistant",
      description: "A friendly social assistant",
      status: { mood: 95, energy: 85, health: 100 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true },
      avatar: "/avatars/social.png"
    }
  ]
};

export default function SocialChat({
  isActive,
  onActivate,
  theme,
}: SocialChatProps) {
  const chatId = "chat-2";
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
