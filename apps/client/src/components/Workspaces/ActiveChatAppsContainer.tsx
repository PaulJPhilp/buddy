"use client";

import { ChatApp } from "@/components/ChatApp/ChatApp";
import { useActiveChatApp } from "@/workspace/useWorkspace";

export function ActiveChatAppsContainer() {
  const activeChatApp = useActiveChatApp();

  if (!activeChatApp) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No active chat application.</p>
          <p className="text-sm">Select an app to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <ChatApp key={activeChatApp.id} initialConfig={activeChatApp.config} />
    </div>
  );
}
