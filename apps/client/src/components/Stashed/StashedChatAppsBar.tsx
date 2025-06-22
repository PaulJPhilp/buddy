"use client";

import {
  useChatAppActions,
  useStashedChatApps,
} from "@/workspace/useWorkspace";
import { StashedChatAppButton } from "./StashedChatAppButton";

export function StashedChatAppsBar() {
  const stashedApps = useStashedChatApps();
  const { expandChatApp } = useChatAppActions();

  if (!stashedApps || stashedApps.length === 0) {
    return null;
  }

  const handleUnstash = (appId: string) => {
    const app = stashedApps.find((a) => a.id === appId);
    if (app) {
      expandChatApp(app.workspaceId, appId);
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
