"use client";

import { useEffectContext } from "@/components/EffectProvider";
import type { WorkspaceModel } from "@/domain/workspace";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Effect } from "effect";
import { Menu, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { AppManagementUI } from "./AppManagementUI";
import { AppSidebar } from "./AppSidebar";
import { ManagerDashboard } from "./ManagerDashboard";
import { AppComponent } from "./service";

interface AppShellProps {
  children?: React.ReactNode;
  isLoading?: boolean;
}

export function AppShell({ children, isLoading = false }: AppShellProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { runWithServices } = useEffectContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [managementView, setManagementView] = useState<"app" | "managers">(
    "managers",
  );
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceModel | null>(
    null,
  );
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);

  // Load active workspace on mount
  useEffect(() => {
    const loadActiveWorkspace = async () => {
      try {
        setIsWorkspaceLoading(true);
        await runWithServices(
          Effect.gen(function* () {
            const appComponent = yield* AppComponent;

            // Load config first
            yield* appComponent.loadConfig(
              "/static/configs/workspaces/index.json",
            );

            // Get current workspace
            const currentWorkspace = yield* appComponent.getCurrentWorkspace();
            setActiveWorkspace(currentWorkspace);
          }),
        );
      } catch (error) {
        console.error("Failed to load active workspace:", error);
        setActiveWorkspace(null);
      } finally {
        setIsWorkspaceLoading(false);
      }
    };

    loadActiveWorkspace();
  }, [runWithServices]);

  // Handle workspace change from sidebar
  const handleWorkspaceChange = useCallback(
    (workspace: WorkspaceModel | null) => {
      setActiveWorkspace(workspace);
    },
    [],
  );

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleManagement = () => {
    setShowManagement(!showManagement);
  };

  const handleChatAppClick = useCallback((chatAppId: string) => {
    console.log("Chat app clicked:", chatAppId);
    // TODO: Integrate with ChatAppsManager to activate the chat app
  }, []);

  // Render active workspace content
  const renderActiveWorkspaceContent = () => {
    if (isWorkspaceLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading workspace...</p>
          </div>
        </div>
      );
    }

    if (!activeWorkspace) {
      return <div className="flex-1" />;
    }

    return (
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Workspace Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {activeWorkspace.metadata?.icon && (
              <span className="text-2xl mr-3">
                {String(activeWorkspace.metadata.icon)}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeWorkspace.name}
              </h1>
              {activeWorkspace.description && (
                <p className="text-gray-600 mt-1">
                  {activeWorkspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Workspace Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span>{activeWorkspace.chatappIds?.length || 0} Chat Apps</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Active Workspace</span>
            </div>
          </div>
        </div>

        {/* Chat Apps Section */}
        {activeWorkspace.chatappIds &&
          activeWorkspace.chatappIds.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Chat Apps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWorkspace.chatappIds.map((chatAppId) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    key={chatAppId}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleChatAppClick(chatAppId)}
                  >
                    <div className="flex items-center mb-2">
                      <h3 className="font-medium text-gray-900">{chatAppId}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Click to open this chat application
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Empty State for Chat Apps */}
        {(!activeWorkspace.chatappIds ||
          activeWorkspace.chatappIds.length === 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Chat Apps Available
            </h3>
            <p className="text-gray-600">
              This workspace doesn't have any chat applications configured yet.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AppSidebar
        isOpen={isSidebarOpen}
        onWorkspaceChange={handleWorkspaceChange}
      />

      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          isSidebarOpen ? "ml-40" : "ml-0"
        }`}
      >
        {/* Header/Toolbar */}
        <header className="flex h-12 items-center gap-3 border-b bg-white shadow-sm px-4">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="shrink-0 p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              Buddy Chat App
            </h1>
            <button
              type="button"
              onClick={handleToggleManagement}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors text-sm ${
                showManagement
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="Toggle management panel"
            >
              <Settings className="h-4 w-4 mr-1.5 inline" />
              {showManagement ? "Hide Management" : "Management"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isLoaded &&
              (isSignedIn ? (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
              ))}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading workspace...</p>
              </div>
            </div>
          ) : (
            renderActiveWorkspaceContent()
          )}
        </main>
      </div>

      {/* Management Panel Overlay */}
      {showManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-hidden w-full">
            {/* Management Panel Header */}
            <div className="bg-gray-50 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    App Management
                  </h2>
                  <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setManagementView("managers")}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        managementView === "managers"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Manager Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setManagementView("app")}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        managementView === "app"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      App Management
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManagement(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Management Panel Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {managementView === "managers" ? (
                <ManagerDashboard onClose={() => setShowManagement(false)} />
              ) : (
                <AppManagementUI onClose={() => setShowManagement(false)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
