"use client";

import type { Workspace } from "@/managers/workspace-manager/types";
import { useCallback, useState } from "react";
import { ChatAppsPanel } from "../chatapps-editor/components/ChatAppsPanel";

interface WorkspaceListProps {
  workspaces: readonly Workspace[];
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onArchive: (workspaceId: string) => void;
  onRestore: (workspaceId: string) => void;
  onDuplicate: (workspaceId: string) => void;
  onExport: (workspaceId: string) => void;
  isLoading?: boolean;
}

export function WorkspaceList({
  workspaces,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onExport,
  isLoading = false,
}: WorkspaceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [chatAppsWorkspaceId, setChatAppsWorkspaceId] = useState<string | null>(
    null,
  );

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesSearch =
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArchiveFilter = showArchived
      ? workspace.isArchived
      : !workspace.isArchived;

    return matchesSearch && matchesArchiveFilter;
  });

  const handleAction = useCallback(
    (action: () => void, workspaceId: string) => {
      if (window.confirm(`Are you sure you want to perform this action?`)) {
        action();
      }
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show archived</span>
          </label>
        </div>

        <div className="text-sm text-gray-500">
          {filteredWorkspaces.length} workspace
          {filteredWorkspaces.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Workspace Grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery
              ? "No workspaces found"
              : showArchived
                ? "No archived workspaces"
                : "No workspaces yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Try adjusting your search terms"
              : showArchived
                ? "Archived workspaces will appear here"
                : "Create your first workspace to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              onRestore={onRestore}
              onDuplicate={onDuplicate}
              onExport={onExport}
              onAction={handleAction}
              onManageChatApps={() => setChatAppsWorkspaceId(workspace.id)}
            />
          ))}
        </div>
      )}
      {chatAppsWorkspaceId && (
        <ChatAppsPanel
          workspaceId={chatAppsWorkspaceId}
          onClose={() => setChatAppsWorkspaceId(null)}
        />
      )}
    </div>
  );
}

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onArchive: (workspaceId: string) => void;
  onRestore: (workspaceId: string) => void;
  onDuplicate: (workspaceId: string) => void;
  onExport: (workspaceId: string) => void;
  onAction: (action: () => void, workspaceId: string) => void;
  onManageChatApps: () => void;
}

function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onExport,
  onAction,
  onManageChatApps,
}: WorkspaceCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`
        relative bg-white rounded-lg border-2 p-6 transition-all hover:shadow-lg
        ${workspace.isArchived ? "border-gray-200 opacity-75" : "border-gray-200 hover:border-gray-300"}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Workspace Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: workspace.primaryColor }}
          >
            {workspace.icon}
          </div>
          <div>
            <h3
              className="font-semibold text-gray-900 truncate"
              title={workspace.name}
            >
              {workspace.name}
            </h3>
            {workspace.isArchived && (
              <span className="text-xs text-gray-400 ml-1">(Archived)</span>
            )}
          </div>
        </div>
        {/* Actions Dropdown or Buttons */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onEdit(workspace)}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => onDuplicate(workspace.id)}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Duplicate
          </button>
          <button
            onClick={() => onExport(workspace.id)}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Export
          </button>
          <div className="border-t border-gray-100 my-1" />
          {workspace.isArchived ? (
            <button
              onClick={() =>
                onAction(() => onRestore(workspace.id), workspace.id)
              }
              className="block w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50"
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() =>
                onAction(() => onArchive(workspace.id), workspace.id)
              }
              className="block w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50"
            >
              Archive
            </button>
          )}
          <button
            onClick={() => onAction(() => onDelete(workspace.id), workspace.id)}
            className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
          {!workspace.isArchived && (
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              onClick={onManageChatApps}
            >
              Manage Chat Apps
            </button>
          )}
        </div>
      </div>

      {/* Workspace Description */}
      {workspace.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {workspace.description}
        </p>
      )}

      {/* Workspace Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Agents</span>
          <span>{workspace.agentIds.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Chat Apps</span>
          <span>{workspace.chatappIds.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Max Expanded</span>
          <span>{workspace.maxExpandedApps}</span>
        </div>
      </div>

      {/* Workspace Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created</span>
          <span>{formatDate(workspace.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last Active</span>
          <span>{formatDate(workspace.lastActiveAt)}</span>
        </div>
      </div>
    </div>
  );
}
