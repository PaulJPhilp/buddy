"use client";

import { ChatContainer } from "@/components/chat";
import { useChatAppContext } from "@/contexts/ChatAppContext";

export default function Home() {
  const { activeChatAppConfig } = useChatAppContext();

  console.log("[Home] Mounted with config:", activeChatAppConfig);

  if (!activeChatAppConfig) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Error: No chat app config available.
      </div>
    );
  }

  return <ChatContainer config={activeChatAppConfig} />;
}
