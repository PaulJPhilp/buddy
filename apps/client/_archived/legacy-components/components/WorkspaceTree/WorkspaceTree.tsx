"use client";

import {
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  useActiveWorkspaces,
  useChatAppActions,
  useCurrentWorkspace,
  useWorkspaceActions,
  useWorkspaceState,
} from "../../hooks";

export function WorkspaceTree() {
  const { state } = useWorkspaceState();
  const workspaces = useActiveWorkspaces();
  const currentWorkspace = useCurrentWorkspace();
  const workspaceActions = useWorkspaceActions();
  const chatAppActions = useChatAppActions();

  // Local state for expanded workspaces
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );

  // Get all chat apps from state
  const allChatApps = state?.chatApps || {};

  const handleOpenWorkspace = (workspaceId: string) => {
    console.log("Opening workspace:", workspaceId);
    workspaceActions.setActiveWorkspace(workspaceId);

    // Auto-activate the first chat app if none are active
    const workspaceApps = Object.values(allChatApps).filter(
      (app: any) => app.workspaceId === workspaceId && !app.isArchived,
    );

    const hasActiveApp = workspaceApps.some(
      (app: any) => app.status === "expanded" || app.status === "compact",
    );

    if (!hasActiveApp && workspaceApps.length > 0) {
      const firstApp = workspaceApps[0];
      console.log("Auto-activating first chat app:", firstApp.id);
      chatAppActions.expandChatApp(firstApp.id);
    }
  };

  const handleCloseWorkspace = (workspaceId: string) => {
    console.log("Closing workspace:", workspaceId);
    workspaceActions.archiveWorkspace(workspaceId);
  };

  const handleChatAppClick = (chatApp: any) => {
    console.log("Activating chat app:", chatApp.id);
    chatAppActions.expandChatApp(chatApp.id);
    // Also set this as the active chat app in the workspace
    chatAppActions.setActiveChatApp(chatApp.workspaceId, chatApp.id);
  };

  const handleToggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  return (
    <div className="p-4 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Workspace Tree
      </h2>

      {/* Workspaces Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
          Workspaces
        </h3>
        <div className="space-y-1">
          {workspaces.map((workspace) => {
            const isExpanded = expandedWorkspaces.has(workspace.id);
            const isActive = currentWorkspace?.id === workspace.id;
            // New pattern: look up chat apps by ID from workspace.chatAppIds
            const workspaceChatApps = (workspace.chatAppIds || [])
              .map((id) => allChatApps[id])
              .filter((app) => app && !app.isArchived);

            // Remove duplicates for accurate count and rendering
            const uniqueWorkspaceChatApps = workspaceChatApps.filter(
              (chatApp, index, array) =>
                // Remove duplicates by ensuring unique IDs
                array.findIndex((app) => app.id === chatApp.id) === index,
            );

            return (
              <div key={workspace.id}>
                {/* Workspace Header */}
                <div
                  className={`flex items-center w-full px-2 py-1 text-sm rounded group ${
                    isActive
                      ? "bg-blue-50 text-blue-900 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleWorkspace(workspace.id)}
                    className="flex items-center flex-1 text-left"
                    title="Expand/collapse workspace"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 mr-1 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 mr-1 text-gray-400" />
                    )}

                    {isExpanded ? (
                      <FolderOpenIcon
                        className={`h-4 w-4 mr-2 ${isActive ? "text-blue-600" : "text-blue-500"}`}
                      />
                    ) : (
                      <FolderIcon
                        className={`h-4 w-4 mr-2 ${isActive ? "text-blue-600" : "text-blue-500"}`}
                      />
                    )}
                    <span className="font-medium">{workspace.name}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      ({uniqueWorkspaceChatApps.length})
                    </span>
                  </button>

                  {/* Action Icons - shown on hover */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(workspace.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Open workspace (set as active)"
                    >
                      <FolderOpenIcon className="h-3 w-3 text-green-600" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseWorkspace(workspace.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Close workspace"
                    >
                      <XMarkIcon className="h-3 w-3 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* ChatApps */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {uniqueWorkspaceChatApps.map((chatApp, index) => (
                      <div
                        key={`${workspace.id}-${chatApp.id}-${index}`}
                        className="flex items-center px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleChatAppClick(chatApp)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleChatAppClick(chatApp);
                          }
                        }}
                        title="Click to activate this chat app"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4 mr-2 text-green-500" />
                        <span>{chatApp.config?.name || chatApp.id}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {chatApp.config?.agentId}
                        </span>
                      </div>
                    ))}
                    {uniqueWorkspaceChatApps.length === 0 && (
                      <div className="px-2 py-1 text-xs text-gray-400 italic">
                        No chat apps
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-2 bg-gray-50 rounded text-xs">
        <div>Current: {currentWorkspace?.name || "None"}</div>
        <div>Workspaces: {workspaces.length}</div>
        <div>ChatApps: {Object.keys(allChatApps).length}</div>
      </div>
    </div>
  );
}
