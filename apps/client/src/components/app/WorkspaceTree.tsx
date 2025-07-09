"use client";

import { useEffectContext } from "@/components/EffectProvider";
import type { WorkspaceModel } from "@/domain/workspace";
import { Effect } from "effect";
import { Folder, FolderOpen, MessageSquare, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { AppComponent } from "./service";

interface WorkspaceTreeProps {
  onWorkspaceChange?: (workspace: WorkspaceModel | null) => void;
}

export function WorkspaceTree({ onWorkspaceChange }: WorkspaceTreeProps) {
  const { runWithServices } = useEffectContext();
  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );

  // Load workspaces and current workspace
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        setIsLoading(true);
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;

            // Load config first
            yield* appComponent.loadConfig(
              "/static/configs/workspaces/index.json",
            );

            // Get workspaces and current workspace
            const allWorkspaces = yield* appComponent.getWorkspaces();
            const currentWorkspace = yield* appComponent.getCurrentWorkspace();

            setWorkspaces(allWorkspaces);
            setCurrentWorkspaceId(currentWorkspace?.id || null);
          }),
        );
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaceData();
  }, [runWithServices]);

  const handleToggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const handleSelectWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;
            yield* appComponent.setCurrentWorkspace(workspaceId);
          }),
        );
        setCurrentWorkspaceId(workspaceId);
        // Auto-expand the workspace when selected
        setExpandedWorkspaces((prev) => new Set([...prev, workspaceId]));

        // Find the selected workspace and notify parent
        const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
        onWorkspaceChange?.(selectedWorkspace || null);
      } catch (error) {
        console.error("Failed to set current workspace:", error);
      }
    },
    [runWithServices, workspaces, onWorkspaceChange],
  );

  const handleChatAppClick = (chatAppId: string) => {
    console.log("Chat app clicked:", chatAppId);
    // TODO: Integrate with ChatAppsManager to activate the chat app
  };

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="animate-pulse space-y-1">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="space-y-1">
        {workspaces.map((workspace) => {
          const isExpanded = expandedWorkspaces.has(workspace.id);
          const isActive = currentWorkspaceId === workspace.id;

          return (
            <div key={workspace.id} className="space-y-0.5">
              {/* Workspace Header */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className={`
                  flex items-center w-full px-1.5 py-1 text-sm rounded cursor-pointer group
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-900 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
                onClick={() => handleSelectWorkspace(workspace.id)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWorkspace(workspace.id);
                  }}
                  className="flex items-center"
                >
                  {isExpanded ? (
                    <FolderOpen
                      className={`h-3 w-3 mr-1.5 ${isActive ? "text-blue-600" : "text-blue-500"}`}
                    />
                  ) : (
                    <Folder
                      className={`h-3 w-3 mr-1.5 ${isActive ? "text-blue-600" : "text-blue-500"}`}
                    />
                  )}
                </button>

                <div className="flex items-center flex-1">
                  {workspace.metadata?.icon && (
                    <span className="mr-1.5 text-sm">
                      {String(workspace.metadata.icon)}
                    </span>
                  )}
                  <span className="font-medium text-sm">{workspace.name}</span>
                </div>

                <span className="ml-auto text-xs text-gray-400">
                  ({workspace.chatappIds?.length || 0})
                </span>
              </div>

              {/* Chat Apps */}
              {isExpanded && (
                <div className="ml-4 space-y-0.5">
                  {workspace.chatappIds && workspace.chatappIds.length > 0 ? (
                    workspace.chatappIds.map((chatAppId) => (
                      <div
                        key={chatAppId}
                        className="flex items-center px-1.5 py-0.5 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                        tabIndex={0}
                        // biome-ignore lint/a11y/useSemanticElements: <explanation>
                        role="button"
                        onClick={() => handleChatAppClick(chatAppId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleChatAppClick(chatAppId);
                          }
                        }}
                        aria-label={`Open chat app ${chatAppId}`}
                      >
                        <MessageSquare className="h-3 w-3 mr-1.5 text-green-500" />
                        <span className="text-sm">{chatAppId}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-1.5 py-0.5 text-xs text-gray-400 italic">
                      No chat apps
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Description */}
              {isExpanded && workspace.description && (
                <div className="ml-4 px-1.5 py-0.5 text-xs text-gray-500">
                  {workspace.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {workspaces.length === 0 && !isLoading && (
        <div className="text-center py-4 text-gray-500">
          <Folder className="h-6 w-6 mx-auto mb-1 text-gray-300" />
          <p className="text-sm">No workspaces available</p>
        </div>
      )}
    </div>
  );
}
