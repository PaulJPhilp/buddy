"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps";
import type { ChatAppInstance } from "@/features/chatapps/managers/chatapps/types";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkspaceConfig } from "@/features/application/types/AppConfig";
import { ChatAppContainer } from "@/features/chatapps/container/ChatAppContainer";
import {
  ChatAppForm,
  type ChatAppFormValues,
} from "@/features/workspaces-editor/chatapps-editor/chatappeditor/components/ChatAppForm";
import { ChatApp } from "../chatapp/ChatApp";
import { WorkspaceComponent } from "./service";

// Utility function to apply Workspace-specific styling
function applyWorkspaceStyle(style: any) {
  if (!style) return;

  const root = document.documentElement;

  // Apply primary colors
  if (style.primaryColor) {
    root.style.setProperty("--color-workspace-primary", style.primaryColor);
    root.style.setProperty(
      "--color-workspace-header-icon-bg",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-stashed-app-bg",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-form-button-primary-bg",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-form-input-border-focus",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-form-picker-border-active",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-sidebar-item-active-border",
      style.primaryColor,
    );
    root.style.setProperty(
      "--color-workspace-sidebar-item-active-text",
      style.primaryColor,
    );
  }

  // Apply primary contrast color
  if (style.primaryContrastColor) {
    root.style.setProperty(
      "--color-workspace-primary-foreground",
      style.primaryContrastColor,
    );
    root.style.setProperty(
      "--color-workspace-header-icon-text",
      style.primaryContrastColor,
    );
    root.style.setProperty(
      "--color-workspace-stashed-app-text",
      style.primaryContrastColor,
    );
    root.style.setProperty(
      "--color-workspace-form-button-primary-text",
      style.primaryContrastColor,
    );
  }

  // Apply background colors
  if (style.backgroundColor) {
    root.style.setProperty(
      "--color-workspace-background",
      style.backgroundColor,
    );
    root.style.setProperty(
      "--color-workspace-header-bg",
      style.backgroundColor,
    );
    root.style.setProperty("--color-workspace-card-bg", style.backgroundColor);
    root.style.setProperty("--color-workspace-form-bg", style.backgroundColor);
    root.style.setProperty(
      "--color-workspace-sidebar-bg",
      style.backgroundColor,
    );
    root.style.setProperty(
      "--color-workspace-form-input-bg",
      style.backgroundColor,
    );
  }

  if (style.backgroundSecondaryColor) {
    root.style.setProperty(
      "--color-workspace-secondary",
      style.backgroundSecondaryColor,
    );
    root.style.setProperty(
      "--color-workspace-stashed-bg",
      style.backgroundSecondaryColor,
    );
    root.style.setProperty(
      "--color-workspace-compact-bg",
      style.backgroundSecondaryColor,
    );
    root.style.setProperty(
      "--color-workspace-expanded-bg",
      style.backgroundSecondaryColor,
    );
  }

  // Apply border styling
  if (style.borderColor) {
    root.style.setProperty("--color-workspace-border", style.borderColor);
    root.style.setProperty(
      "--color-workspace-header-border",
      style.borderColor,
    );
    root.style.setProperty("--color-workspace-card-border", style.borderColor);
    root.style.setProperty("--color-workspace-form-border", style.borderColor);
    root.style.setProperty(
      "--color-workspace-form-input-border",
      style.borderColor,
    );
    root.style.setProperty(
      "--color-workspace-sidebar-border",
      style.borderColor,
    );
    root.style.setProperty(
      "--color-workspace-stashed-border",
      style.borderColor,
    );
    root.style.setProperty(
      "--color-workspace-compact-border",
      style.borderColor,
    );
  }

  if (style.borderRadius) {
    root.style.setProperty(
      "--workspace-container-border-radius",
      style.borderRadius,
    );
    root.style.setProperty(
      "--workspace-card-border-radius",
      style.borderRadius,
    );
    root.style.setProperty(
      "--workspace-form-input-border-radius",
      style.borderRadius,
    );
    root.style.setProperty(
      "--workspace-form-button-border-radius",
      style.borderRadius,
    );
  }

  // Apply typography
  if (style.fontFamily) {
    root.style.setProperty("--workspace-font-family", style.fontFamily);
  }

  if (style.fontSize) {
    root.style.setProperty("--workspace-header-font-size", style.fontSize);
    root.style.setProperty("--workspace-form-input-font-size", style.fontSize);
  }

  // Apply shadow styling
  if (style.shadowColor) {
    root.style.setProperty("--color-workspace-shadow", style.shadowColor);
  }

  if (style.shadowIntensity) {
    const shadowMap = {
      none: "none",
      sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    };
    root.style.setProperty(
      "--workspace-container-shadow",
      shadowMap[style.shadowIntensity] || shadowMap.md,
    );
  }

  // Apply icon styling
  if (style.iconColor) {
    root.style.setProperty("--color-workspace-empty-icon", style.iconColor);
  }

  if (style.iconSize) {
    root.style.setProperty("--workspace-header-icon-size", style.iconSize);
    root.style.setProperty("--workspace-card-icon-size", style.iconSize);
  }
}

// Utility function to reset workspace styling to defaults
function resetWorkspaceStyle() {
  const root = document.documentElement;

  // Reset all custom properties to their defaults
  const defaultStyles = {
    "--color-workspace-primary": "#3b82f6",
    "--color-workspace-header-icon-bg": "#3b82f6",
    "--color-workspace-stashed-app-bg": "#3b82f6",
    "--color-workspace-form-button-primary-bg": "#3b82f6",
    "--color-workspace-form-input-border-focus": "#3b82f6",
    "--color-workspace-form-picker-border-active": "#3b82f6",
    "--color-workspace-sidebar-item-active-border": "#3b82f6",
    "--color-workspace-sidebar-item-active-text": "#1d4ed8",
    "--color-workspace-primary-foreground": "#ffffff",
    "--color-workspace-header-icon-text": "#ffffff",
    "--color-workspace-stashed-app-text": "#ffffff",
    "--color-workspace-form-button-primary-text": "#ffffff",
    "--color-workspace-background": "#ffffff",
    "--color-workspace-header-bg": "#ffffff",
    "--color-workspace-card-bg": "#ffffff",
    "--color-workspace-form-bg": "#ffffff",
    "--color-workspace-sidebar-bg": "#ffffff",
    "--color-workspace-form-input-bg": "#ffffff",
    "--color-workspace-secondary": "#f1f5f9",
    "--color-workspace-stashed-bg": "#f8fafc",
    "--color-workspace-compact-bg": "#f8fafc",
    "--color-workspace-expanded-bg": "#f8fafc",
    "--color-workspace-border": "#e2e8f0",
    "--color-workspace-header-border": "#e2e8f0",
    "--color-workspace-card-border": "#e2e8f0",
    "--color-workspace-form-border": "#e2e8f0",
    "--color-workspace-form-input-border": "#d1d5db",
    "--color-workspace-sidebar-border": "#e2e8f0",
    "--color-workspace-stashed-border": "#e2e8f0",
    "--color-workspace-compact-border": "#e2e8f0",
    "--workspace-container-border-radius": "12px",
    "--workspace-card-border-radius": "8px",
    "--workspace-form-input-border-radius": "6px",
    "--workspace-form-button-border-radius": "6px",
    "--workspace-font-family": '"Geist", system-ui, sans-serif',
    "--workspace-header-font-size": "18px",
    "--workspace-form-input-font-size": "14px",
    "--color-workspace-shadow": "rgba(0, 0, 0, 0.1)",
    "--workspace-container-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "--color-workspace-empty-icon": "#9ca3af",
    "--workspace-header-icon-size": "48px",
    "--workspace-card-icon-size": "48px",
  };

  for (const [property, value] of Object.entries(defaultStyles)) {
    root.style.setProperty(property, value);
  }
}

interface WorkspaceUIProps {
  workspaceConfig: WorkspaceConfig;
  availableChatApps: ChatAppInstance[];
  availableAgents: any[]; // Adjust type as needed
  activeChatApps: ChatAppInstance[];
  isLoading: boolean;
  error: string | null;
  className?: string;
}

export function WorkspaceUI({
  workspaceConfig,
  availableChatApps,
  availableAgents,
  activeChatApps,
  isLoading,
  error,
  className = "",
}: WorkspaceUIProps) {
  const { runWithServices } = useEffectContext();

  // State for the new chat app form
  const [isNewChatAppFormOpen, setIsNewChatAppFormOpen] = useState(false);
  const [newChatAppDefaultName, setNewChatAppDefaultName] = useState("");

  // Refs for tracking subscription lifecycle
  const isSubscribedRef = useRef(false);
  const isReadyForSubscriptionRef = useRef(false);

  // State for workspace properties
  const [workspaceName, setWorkspaceName] = useState(
    workspaceConfig.name || "Untitled Workspace",
  );
  const [workspaceDescription, setWorkspaceDescription] = useState(
    workspaceConfig.description || "",
  );

  // State for editing mode
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);

  const workspaceId = workspaceConfig.id;

  // Effect for applying workspace-specific styling
  useEffect(() => {
    if (workspaceConfig.style) {
      applyWorkspaceStyle(workspaceConfig.style);
    }
    return () => {
      resetWorkspaceStyle();
    };
  }, [workspaceConfig.style]);

  // Simplified direct subscription handling for immediate UI updates
  const setupDirectSubscription = useCallback(async () => {
    if (isSubscribedRef.current || !workspaceId) {
      return;
    }
    isSubscribedRef.current = true;

    // Directly subscribe to chat app updates (e.g., messages)
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.subscribeToChatAppMessages(
            workspaceId,
            (chatAppId, newMessages) => {
              // In WorkspaceUI, we don't manage individual chat app messages directly,
              // but we might need to trigger a re-render or status update if a message
              // changes the overall workspace state (e.g., unread count).
              // For now, this is a placeholder for direct message subscription if needed.
              console.log(
                `Received messages for ${chatAppId}:`,
                newMessages.length,
              );
            },
          );
          console.log(`Subscribed to messages for workspace ${workspaceId}`);
        }),
      );
    } catch (error) {
      console.error(
        `Failed to subscribe to chat app messages for workspace ${workspaceId}:`,
        error,
      );
    }
  }, [workspaceId, runWithServices]);

  useEffect(() => {
    // console.log("WorkspaceUI useEffect - isReadyForSubscriptionRef.current, workspaceId:", isReadyForSubscriptionRef.current, workspaceId);
    if (isReadyForSubscriptionRef.current && workspaceId) {
      setupDirectSubscription();
    } else if (workspaceId) {
      // Allow a brief delay before attempting subscription to ensure all services are ready
      const timer = setTimeout(() => {
        isReadyForSubscriptionRef.current = true;
        setupDirectSubscription();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [workspaceId, setupDirectSubscription]);

  const handleUpdateWorkspace = useCallback(
    async (values: ChatAppFormValues) => {
      await runWithServices(
        Effect.gen(function* () {
          const workspaceComponent = yield* WorkspaceComponent;
          yield* workspaceComponent.updateWorkspaceConfig({
            ...workspaceConfig,
            name: values.name,
            description: values.description,
          });
          setWorkspaceName(values.name);
          setWorkspaceDescription(values.description);
          setIsEditingWorkspace(false);
        }),
      );
    },
    [workspaceConfig, runWithServices],
  );

  const handleCancelEdit = useCallback(() => {
    setIsEditingWorkspace(false);
    setWorkspaceName(workspaceConfig.name || "Untitled Workspace");
    setWorkspaceDescription(workspaceConfig.description || "");
  }, [workspaceConfig]);

  const renderChatApps = () => {
    if (activeChatApps.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-center text-gray-500">
          No active chat applications. Click '+' to add one.
        </div>
      );
    }

    const expandedApp = activeChatApps.find((app) => app.status === "expanded");
    if (expandedApp) {
      return (
        <div className="flex h-full w-full">
          <ChatAppContainer instance={expandedApp} className="flex-1" />
        </div>
      );
    }

    const compactApps = activeChatApps.filter(
      (app) => app.status === "compact",
    );
    const stashedApps = activeChatApps.filter(
      (app) => app.status === "stashed",
    );

    return (
      <div className="flex h-full w-full flex-col p-4">
        {compactApps.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold">Active Chat Apps</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {compactApps.map((app) => (
                <ChatAppContainer
                  key={app.id}
                  instance={app}
                  className="h-64"
                />
              ))}
            </div>
          </div>
        )}

        {stashedApps.length > 0 && (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Stashed Chat Apps</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stashedApps.map((app) => (
                <ChatAppContainer
                  key={app.id}
                  instance={app}
                  className="h-64"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={
        `flex h-full max-h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`
      }
    >
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center">
          {isEditingWorkspace ? (
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setNewChatAppDefaultName(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-xl font-semibold focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          ) : (
            <h1 className="text-xl font-semibold">
              {workspaceConfig.name || "Untitled Workspace"}
            </h1>
          )}
          <p className="ml-4 text-sm text-gray-500">
            {isEditingWorkspace ? (
              <input
                type="text"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            ) : (
              workspaceConfig.description || "No description"
            )}
          </p>
        </div>
        <div>
          {isEditingWorkspace ? (
            <>
              <button
                onClick={() =>
                  handleUpdateWorkspace({
                    name: workspaceName,
                    description: workspaceDescription,
                  })
                }
                className="mr-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditingWorkspace(true)}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Edit Workspace
            </button>
          )}
          <button
            onClick={() => {
              setNewChatAppDefaultName(
                `New Chat App ${availableChatApps.length + 1}`,
              );
              setIsNewChatAppFormOpen(true);
            }}
            className="ml-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            + Add Chat App
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4">{renderChatApps()}</div>

      {/* New Chat App Form Modal */}
      {isNewChatAppFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold">Create New Chat App</h2>
            <ChatAppForm
              initialValues={{
                name: newChatAppDefaultName,
                description: "",
                type: "basic",
                agentId:
                  availableAgents.length > 0 ? availableAgents[0].id : "",
                // Add other default values as necessary
              }}
              availableAgents={availableAgents}
              onCancel={() => setIsNewChatAppFormOpen(false)}
              onSubmit={async (values) => {
                await runWithServices(
                  Effect.gen(function* () {
                    const chatAppsManager = yield* ChatAppsManager;
                    yield* chatAppsManager.createChatApp({
                      name: values.name,
                      description: values.description,
                      type: values.type,
                      agentId: values.agentId,
                      workspaceId: workspaceId, // Associate with current workspace
                      config: {
                        style: {
                          primaryColor: "#3b82f6",
                          primaryContrastColor: "#ffffff",
                          backgroundColor: "#ffffff",
                          backgroundSecondaryColor: "#f1f5f9",
                          borderColor: "#e2e8f0",
                          borderRadius: "8px",
                          fontFamily: '"Geist", system-ui, sans-serif',
                          fontSize: "14px",
                          userMessageColor: "#1e40af",
                          assistantMessageColor: "#f1f5f9",
                          inputBackgroundColor: "#f8fafc",
                          inputBorderColor: "#d1d5db",
                          iconColor: "#6b7280",
                          iconSize: "16px",
                        },
                      },
                    });
                    setIsNewChatAppFormOpen(false);
                  }),
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
