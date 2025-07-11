"use client";

import { useEffectContext } from "@/components/EffectProvider";
import type { WorkspaceModel } from "@/domain/workspace";
import { Effect } from "effect";
import { Folder, FolderOpen, MessageSquare, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useWorkspaceManager } from "../workspace/useWorkspaceManager";
import { AppComponent } from "./service";

export function WorkspaceTree() {
  const { runWithServices } = useEffectContext();
  const { switchWorkspace } = useWorkspaceManager();
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

            // Validate workspaces array
            if (!Array.isArray(allWorkspaces)) {
              console.error(
                "Invalid workspaces data - expected array:",
                allWorkspaces,
              );
              setWorkspaces([]);
              setCurrentWorkspaceId(null);
              return;
            }

            // Validate each workspace has required fields
            const validWorkspaces = allWorkspaces.filter((workspace) => {
              if (!workspace || typeof workspace !== "object") {
                console.warn("Invalid workspace object, skipping:", workspace);
                return false;
              }

              if (!workspace.id || typeof workspace.id !== "string") {
                console.warn(
                  "Workspace missing valid ID, skipping:",
                  workspace,
                );
                return false;
              }

              if (!workspace.name || typeof workspace.name !== "string") {
                console.warn(
                  "Workspace missing valid name, skipping:",
                  workspace,
                );
                return false;
              }

              return true;
            });

            // Validate current workspace
            const validCurrentWorkspace =
              currentWorkspace &&
              typeof currentWorkspace === "object" &&
              typeof currentWorkspace.id === "string"
                ? currentWorkspace
                : null;

            setWorkspaces(validWorkspaces);
            setCurrentWorkspaceId(validCurrentWorkspace?.id || null);

            if (validWorkspaces.length !== allWorkspaces.length) {
              console.warn(
                `Filtered out ${allWorkspaces.length - validWorkspaces.length} invalid workspaces`,
              );
            }
          }),
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to load workspace data:", errorMessage);
        setWorkspaces([]); // Set empty array on error
        setCurrentWorkspaceId(null);
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
      // Validate input
      if (typeof workspaceId !== "string" || workspaceId.trim() === "") {
        console.error("Invalid workspace ID provided:", workspaceId);
        return;
      }

      try {
        await switchWorkspace(workspaceId);
        setCurrentWorkspaceId(workspaceId);
        // Auto-expand the workspace when selected
        setExpandedWorkspaces((prev) => new Set([...prev, workspaceId]));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to switch workspace ${workspaceId}:`,
          errorMessage,
        );

        // Optionally show user-friendly error
        // You could add a toast notification here
      }
    },
    [switchWorkspace],
  );

  const handleChatAppClick = (chatAppId: string) => {
    console.log("Chat app clicked:", chatAppId);
    // TODO: Integrate with ChatAppsManager to activate the chat app
  };

  if (isLoading) {
    return (
      <div className="p-1">
        <div className="animate-pulse space-y-0.5">
          <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          <div className="h-1.5 bg-gray-200 rounded w-1/2" />
          <div className="h-1.5 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="space-y-0.5">
        {workspaces.map((workspace) => {
          const isExpanded = expandedWorkspaces.has(workspace.id);
          const isActive = currentWorkspaceId === workspace.id;

          return (
            <div key={workspace.id} className="space-y-0.25">
              {/* Workspace Header */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className={`
                  flex items-center w-full px-0.75 py-0.5 text-xs rounded cursor-pointer group
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
                      className="h-1.5 w-1.5 mr-0.75"
                      style={{
                        color:
                          (workspace.metadata?.style as any)?.primaryColor ||
                          (workspace.metadata?.primaryColor as string) ||
                          (isActive ? "#2563eb" : "#3b82f6"),
                      }}
                    />
                  ) : (
                    <Folder
                      className="h-1.5 w-1.5 mr-0.75"
                      style={{
                        color:
                          (workspace.metadata?.style as any)?.primaryColor ||
                          (workspace.metadata?.primaryColor as string) ||
                          (isActive ? "#2563eb" : "#3b82f6"),
                      }}
                    />
                  )}
                </button>

                <div className="flex items-center flex-1">
                  {workspace.metadata?.icon && (
                    <span className="mr-0.75 text-xs">
                      {String(workspace.metadata.icon)}
                    </span>
                  )}
                  <span
                    className="font-medium text-xs"
                    style={{
                      color:
                        (workspace.metadata?.style as any)?.primaryColor ||
                        (workspace.metadata?.primaryColor as string) ||
                        "#374151",
                    }}
                  >
                    {workspace.name}
                  </span>
                </div>

                <span className="ml-auto text-xs text-gray-400">
                  ({workspace.chatappIds?.length || 0})
                </span>
              </div>

              {/* Chat Apps */}
              {isExpanded && (
                <div className="ml-2 space-y-0.25">
                  {workspace.chatappIds && workspace.chatappIds.length > 0 ? (
                    workspace.chatappIds.map((chatAppId) => (
                      <div
                        key={chatAppId}
                        className="flex items-center px-0.75 py-0.25 text-xs text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
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
                        <MessageSquare className="h-1.5 w-1.5 mr-0.75 text-green-500" />
                        <span className="text-xs">{chatAppId}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-0.75 py-0.25 text-xs text-gray-400 italic">
                      No chat apps
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Description */}
              {isExpanded && workspace.description && (
                <div className="ml-2 px-0.75 py-0.25 text-xs text-gray-500">
                  {workspace.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {workspaces.length === 0 && !isLoading && (
        <div className="text-center py-2 text-gray-500">
          <Folder className="h-3 w-3 mx-auto mb-0.5 text-gray-300" />
          <p className="text-xs">No workspaces available</p>
        </div>
      )}
    </div>
  );
}
