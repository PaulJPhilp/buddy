"use client";

import { WorkspaceManagementDialog } from "@/components/Workspaces/WorkspaceManagementDialog";
import { useAppLayoutStore } from "@/stores/appLayoutStore";
import {
  useActiveWorkspaceIds,
  useCurrentWorkspace,
  useWorkspaceActions,
  useWorkspaceStore,
} from "@/workspace/useWorkspace";
import { cn } from "@ui/lib/utils";
import { MoreHorizontal, Plus, Settings } from "lucide-react";
import React, { useState, useEffect } from "react";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { isSidebarOpen } = useAppLayoutStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  // Get workspace data and actions
  const currentWorkspace = useCurrentWorkspace();
  const allWorkspaces = useWorkspaceStore((state) =>
    Object.values(state.workspaces).filter((w) => !w.isArchived),
  );
  const activeWorkspaceIds = useActiveWorkspaceIds();
  const { activateWorkspace, createWorkspace } = useWorkspaceActions();

  // Dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "archive";
    workspace?: any;
  }>({
    isOpen: false,
    mode: "create",
    workspace: undefined,
  });

  console.log(
    "[AppSidebar] Current dialog state:",
    JSON.stringify(dialogState),
  );

  // Debug effect to track state changes
  useEffect(() => {
    console.log(
      "[AppSidebar] Dialog state changed:",
      JSON.stringify(dialogState),
    );
  }, [dialogState]);

  const handleWorkspaceClick = (workspaceId: string) => {
    if (workspaceId !== currentWorkspace?.id) {
      activateWorkspace(workspaceId);
    }
  };

  const handleCreateWorkspace = () => {
    setDialogState({
      isOpen: true,
      mode: "create",
      workspace: undefined,
    });
  };

  const handleEditWorkspace = (workspace: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent workspace activation
    e.preventDefault(); // Prevent any default behavior
    console.log(
      "[AppSidebar] Settings button clicked for workspace:",
      workspace.name,
    );
    console.log(
      "[AppSidebar] Current dialog state before update:",
      JSON.stringify(dialogState),
    );

    const newState = {
      isOpen: true,
      mode: "edit" as const,
      workspace,
    };

    console.log(
      "[AppSidebar] Setting new dialog state:",
      JSON.stringify(newState),
    );
    setDialogState(newState);
  };

  const handleCloseDialog = () => {
    console.log("[AppSidebar] Closing dialog");
    setDialogState({
      isOpen: false,
      mode: "create",
      workspace: undefined,
    });
  };

  const renderWorkspaceSection = () => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">Workspaces</p>
          <button
            type="button"
            onClick={handleCreateWorkspace}
            className="p-0.5 hover:bg-muted/30 rounded transition-colors"
            title="Create new workspace"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Always show all workspaces */}
        <div className="space-y-0.5">
          {allWorkspaces.map((workspace) => {
            const isActive = activeWorkspaceIds.includes(workspace.id);

            return (
              <div
                key={workspace.id}
                className={cn(
                  "p-1 rounded hover:bg-muted/30 transition-colors group",
                  workspace.id === currentWorkspace?.id && "bg-muted/50",
                )}
                title={
                  workspace.id === currentWorkspace?.id
                    ? `Current: ${workspace.name}${isActive ? " (Active)" : ""}`
                    : `Switch to ${workspace.name}${isActive ? " (Active)" : ""}`
                }
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex items-center gap-1 flex-1 min-w-0 text-left"
                    onClick={() => handleWorkspaceClick(workspace.id)}
                  >
                    <div className="relative">
                      <span className="text-xs leading-none">
                        {workspace.icon}
                      </span>
                      {/* Active workspace indicator - small dot on the icon */}
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium leading-tight">
                        {workspace.name}
                      </div>
                      {workspace.description && (
                        <div className="truncate text-xs text-muted-foreground leading-tight">
                          {workspace.description}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5">
                    {workspace.id === currentWorkspace?.id && (
                      <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleEditWorkspace(workspace, e)}
                      className="p-0.5 opacity-30 hover:opacity-100 hover:bg-muted/50 rounded transition-all"
                      title="Edit workspace"
                    >
                      <Settings className="h-2 w-2" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allWorkspaces.length === 0 && (
          <div className="p-1 text-xs text-muted-foreground text-center">
            No workspaces found
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    return <div className="p-2 space-y-4">{renderWorkspaceSection()}</div>;
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r z-40 transition-transform duration-200",
          "w-[100px]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        {renderContent()}
      </div>

      <WorkspaceManagementDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        workspace={dialogState.workspace}
      />
    </>
  );
}
