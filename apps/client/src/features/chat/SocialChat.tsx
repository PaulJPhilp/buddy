"use client";

import { useEffect, useState } from "react";
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
  agentWsUrl: "ws://localhost:0/fake-social",
  initialAgentName: "Social Assistant",
};

export default function SocialChat({
  isActive,
  onActivate,
  theme,
}: SocialChatProps) {
  const [chatId, setChatId] = useState("");

  // Generate chat ID on client side to prevent hydration mismatch
  useEffect(() => {
    const timestamp = Date.now();
    setChatId(`social-chat-${timestamp}`);
  }, []);

  // Don't render until we have client-side ID
  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-48" />
          <div className="h-4 bg-gray-200 rounded mb-4 w-32" />
          <div className="h-96 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <ChatApp
      chatId={chatId}
      agentConfig={agentConfig}
      className="h-full"
      theme={theme}
    />
  );
}
