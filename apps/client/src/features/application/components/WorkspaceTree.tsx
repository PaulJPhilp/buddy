"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { useWorkspaceManager } from "@/features/workspace/hooks/useWorkspaceManager";
import type { Workspace } from "@buddy/config/types/workspace";
import { Effect } from "effect";
import { Folder, FolderOpen, MessageSquare, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ApplicationManager } from "@/features/application/manager/service";

export function WorkspaceTree() {
  const { runWithServices } = useEffectContext();
  const { switchWorkspace } = useWorkspaceManager();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
            const appManager = yield* ApplicationManager;

            // Get app config which contains workspaces
            const appConfig = yield* appManager.getAppConfig;

            // Extract workspaces from config
            const allWorkspaces = appConfig?.workspaces || [];

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
            
            // For now, use the first workspace as current (or implement proper logic)
            const currentWorkspace = allWorkspaces[0] || null;

            // If no workspaces are loaded, it means the config loading failed
            if (allWorkspaces.length === 0) {
              console.warn(
                "No workspaces loaded - config may not be loaded yet",
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
    <div
      style={{
        padding: "var(--workspace-sidebar-padding, 4px)",
        backgroundColor: "var(--color-workspace-sidebar-bg, #ffffff)",
        fontFamily:
          "var(--workspace-font-family, 'Geist', system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {workspaces.map((workspace) => {
          const isExpanded = expandedWorkspaces.has(workspace.id);
          const isActive = currentWorkspaceId === workspace.id;

          return (
            <div
              key={workspace.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
              }}
            >
              {/* Workspace Header */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className="flex items-center w-full cursor-pointer group transition-colors duration-150"
                style={{
                  padding: "var(--workspace-sidebar-item-padding, 6px)",
                  fontSize: "var(--workspace-sidebar-item-font-size, 12px)",
                  borderRadius:
                    "var(--workspace-sidebar-item-border-radius, 4px)",
                  backgroundColor: isActive
                    ? "var(--color-workspace-sidebar-item-active, #dbeafe)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-workspace-sidebar-item-active-text, #1d4ed8)"
                    : "var(--color-workspace-sidebar-text, #374151)",
                  border: isActive
                    ? "1px solid var(--color-workspace-sidebar-item-active-border, #3b82f6)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-workspace-sidebar-item-hover, #f3f4f6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                onClick={() => handleSelectWorkspace(workspace.id)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWorkspace(workspace.id);
                  }}
                  className="flex items-center"
                  style={{
                    padding: "0",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {isExpanded ? (
                    <FolderOpen
                      style={{
                        width: "var(--workspace-sidebar-icon-size, 16px)",
                        height: "var(--workspace-sidebar-icon-size, 16px)",
                        marginRight: "3px",
                        color: workspace.color ||
                          (isActive
                            ? "var(--color-workspace-sidebar-item-active-text, #1d4ed8)"
                            : "var(--color-workspace-primary, #3b82f6)"),
                      }}
                    />
                  ) : (
                    <Folder
                      style={{
                        width: "var(--workspace-sidebar-icon-size, 16px)",
                        height: "var(--workspace-sidebar-icon-size, 16px)",
                        marginRight: "3px",
                        color: workspace.color ||
                          (isActive
                            ? "var(--color-workspace-sidebar-item-active-text, #1d4ed8)"
                            : "var(--color-workspace-primary, #3b82f6)"),
                      }}
                    />
                  )}
                </button>

                <div className="flex items-center flex-1">
                  {workspace.icon && (
                    <span
                      style={{
                        marginRight: "3px",
                        fontSize:
                          "var(--workspace-sidebar-item-font-size, 12px)",
                      }}
                    >
                      {workspace.icon}
                    </span>
                  )}
                  <span
                    style={{
                      fontWeight: "500",
                      fontSize: "var(--workspace-sidebar-item-font-size, 12px)",
                      color: workspace.color ||
                        (isActive
                          ? "var(--color-workspace-sidebar-item-active-text, #1d4ed8)"
                          : "var(--color-workspace-sidebar-text, #374151)"),
                    }}
                  >
                    {workspace.name}
                  </span>
                </div>

                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "var(--workspace-sidebar-item-font-size, 12px)",
                    color: "var(--color-workspace-form-meta-text, #9ca3af)",
                  }}
                >
                  ({workspace.chatappIds?.length || 0})
                </span>
              </div>

              {/* Chat Apps */}
              {isExpanded && (
                <div
                  style={{
                    marginLeft: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  {workspace.chatappIds && workspace.chatappIds.length > 0 ? (
                    workspace.chatappIds.map((chatAppId) => (
                      <div
                        key={chatAppId}
                        className="flex items-center cursor-pointer transition-colors duration-150"
                        style={{
                          padding: "var(--workspace-sidebar-item-padding, 6px)",
                          fontSize:
                            "var(--workspace-sidebar-item-font-size, 12px)",
                          color: "var(--color-workspace-sidebar-text, #374151)",
                          borderRadius:
                            "var(--workspace-sidebar-item-border-radius, 4px)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-workspace-sidebar-item-hover, #f3f4f6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
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
