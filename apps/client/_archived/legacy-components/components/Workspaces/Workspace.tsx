"use client";

import { StashedChatAppsBar } from "@/components/Stashed";
import {
  useCurrentWorkspace,
  useWorkspaceLoadingState,
  useWorkspaceState,
} from "@/hooks/useWorkspace";
import { ActiveChatAppsContainer } from "./ActiveChatAppsContainer";

export function Workspace() {
  const currentWorkspace = useCurrentWorkspace();
  const isLoading = useWorkspaceLoadingState();
  const { state } = useWorkspaceState();
  
  // Get chat apps for current workspace
  const chatAppsInWorkspace = currentWorkspace 
    ? Object.values(state?.chatApps || {}).filter(
        app => app.workspaceId === currentWorkspace.id && !app.isArchived
      )
    : [];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
          <p className="text-muted-foreground">Loading workspace data...</p>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🏠</div>
          <h2 className="text-2xl font-bold mb-4">No Active Workspace</h2>
          <p className="text-muted-foreground">
            Please select a workspace to get started.
          </p>
        </div>
      </div>
    );
  }

  if (chatAppsInWorkspace.length === 0) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 flex flex-row">
          <div className="h-full flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-6">💬</div>
              <h2 className="text-2xl font-bold mb-4">No Chat Apps</h2>
              <p className="text-muted-foreground mb-6">
                No chat applications in the current workspace "
                {currentWorkspace.name}".
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-row">
        <ActiveChatAppsContainer />
      </div>
      <StashedChatAppsBar />
    </div>
  );
}
