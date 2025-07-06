"use client";

import {
  useChatAppActions,
  useCurrentWorkspace,
  useWorkspaceState,
} from "@/hooks/useWorkspace";
import { StashedChatAppButton } from "./StashedChatAppButton";

export function StashedChatAppsBar() {
  const currentWorkspace = useCurrentWorkspace();
  const { state } = useWorkspaceState();
  const { expandChatApp } = useChatAppActions();

  // Get stashed apps for current workspace
  const stashedApps = currentWorkspace 
    ? Object.values(state?.chatApps || {}).filter(
        app => app.workspaceId === currentWorkspace.id && app.status === "stashed" && !app.isArchived
      )
    : [];

  if (!stashedApps || stashedApps.length === 0) {
    return null;
  }

  const handleUnstash = async (appId: string) => {
    try {
      await expandChatApp(appId);
    } catch (error) {
      console.error("Failed to unstash chat app:", error);
    }
  };

  return (
    <div className="flex h-12 items-center justify-center bg-background/95 px-4 text-white backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">Stashed:</p>
        <div className="flex items-center gap-2">
          {stashedApps.map((chatApp) => (
            <StashedChatAppButton
              key={chatApp.id}
              chatApp={chatApp}
              onUnstash={handleUnstash}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
