"use client";

import { WorkspaceEntry } from "@/workspace/types";
import { useWorkspaceActions } from "@/workspace/useWorkspace";
import { useEffect, useState } from "react";

interface WorkspaceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "archive";
  workspace?: WorkspaceEntry;
}

export function WorkspaceManagementDialog({
  isOpen,
  onClose,
  mode,
  workspace,
}: WorkspaceManagementDialogProps) {
  console.log("[WorkspaceManagementDialog] Props:", {
    isOpen,
    mode,
    workspaceName: workspace?.name,
  });

  const { createWorkspace, updateWorkspace, archiveWorkspace } =
    useWorkspaceActions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "📁",
    color: "#3b82f6",
    availableAgents: ["default-agent"],
  });

  // Initialize form data when workspace or mode changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && workspace) {
      setFormData({
        name: workspace.name,
        description: workspace.description || "",
        icon: workspace.icon || "📁",
        color: workspace.color || "#3b82f6",
        availableAgents: [...workspace.availableAgents],
      });
    } else if (mode === "create") {
      setFormData({
        name: "My New Workspace",
        description: "",
        icon: "📁",
        color: "#3b82f6",
        availableAgents: ["default-agent"],
      });
    }
  }, [mode, workspace, isOpen]);

  const handleClose = () => {
    console.log("[WorkspaceManagementDialog] handleClose called");
    onClose();
  };

  const handleSave = () => {
    console.log(
      "[WorkspaceManagementDialog] handleSave called with:",
      formData,
    );

    if (mode === "create") {
      createWorkspace(formData);
    } else if (mode === "edit" && workspace) {
      updateWorkspace(workspace.id, formData);
    }

    handleClose();
  };

  const handleArchive = () => {
    if (workspace) {
      console.log(
        "[WorkspaceManagementDialog] archiving workspace:",
        workspace.id,
      );
      archiveWorkspace(workspace.id);
      handleClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) {
    console.log("[WorkspaceManagementDialog] Not rendering - isOpen is false");
    return null;
  }

  console.log("[WorkspaceManagementDialog] Rendering modal");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        onKeyDown={(e) => e.key === "Enter" && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">
          {mode === "create" ? "Create Workspace" : "Edit Workspace"}
        </h2>

        <div className="mb-4">
          <label
            htmlFor="workspace-name"
            className="block text-sm font-medium mb-2"
          >
            Workspace Name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter workspace name..."
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="workspace-description"
            className="block text-sm font-medium mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="workspace-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Describe this workspace..."
            rows={2}
          />
        </div>

        <div className="flex justify-between">
          {/* Left side - Delete button (only in edit mode) */}
          <div>
            {mode === "edit" && (
              <button
                type="button"
                onClick={handleArchive}
                className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded"
              >
                Delete Workspace
              </button>
            )}
          </div>

          {/* Right side - Cancel and Save buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
