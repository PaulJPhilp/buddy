"use client";

import { ChatApp } from "@/components/ChatApp/ChatApp";
import { useWorkspaceState } from "@/hooks/useWorkspace";
import type { ChatAppEntry } from "@/managers/workspace-component/types";

function useActiveChatApp(): ChatAppEntry | null {
  const { state } = useWorkspaceState();
  
  if (!state?.currentWorkspaceId) return null;
  
  const currentWorkspace = state.workspaces[state.currentWorkspaceId];
  if (!currentWorkspace?.activeAppId) return null;
  
  return state.chatApps[currentWorkspace.activeAppId] || null;
}

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
      <ChatApp key={activeChatApp.id} config={activeChatApp.config} />
    </div>
  );
}
