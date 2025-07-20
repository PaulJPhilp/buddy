import type { ChatAppInstance } from "@/features/chatapps/managers/chatapps/types";
import { useState } from "react";
import { Icon } from "ui";

interface ChatAppListProps {
  chatApps: ChatAppInstance[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  loading?: boolean;
}

export function ChatAppList({
  chatApps,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  loading,
}: ChatAppListProps) {
  const [search, setSearch] = useState("");
  const filtered = chatApps.filter((app) =>
    app.config?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search chat apps..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-2 py-1 mb-2"
        disabled={loading}
      />
      <ul className="divide-y">
        {filtered.length === 0 && (
          <li className="text-gray-500 p-2">No chat apps found</li>
        )}
        {filtered.map((app) => (
          <li
            key={app.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              {app.config?.icon && typeof app.config.icon === "object" ? (
                <Icon
                  name={app.config.icon.name}
                  color={app.config.icon.color}
                  size={app.config.icon.size}
                  strokeWidth={app.config.icon.strokeWidth}
                />
              ) : (
                <Icon name="Bot" color="#007bff" size={24} strokeWidth={2} />
              )}
              <span className="font-medium">{app.config?.name || app.id}</span>
              <span className="text-xs text-gray-500">{app.status}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(app.id)}
                className="px-2 py-0.5 text-xs bg-blue-100 rounded hover:bg-blue-200"
                disabled={loading}
              >
                Edit
              </button>
              {app.status === "archived" ? (
                <button
                  type="button"
                  onClick={() => onRestore(app.id)}
                  className="px-2 py-0.5 text-xs bg-green-100 rounded hover:bg-green-200"
                  disabled={loading}
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onArchive(app.id)}
                  className="px-2 py-0.5 text-xs bg-yellow-100 rounded hover:bg-yellow-200"
                  disabled={loading}
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(app.id)}
                className="px-2 py-0.5 text-xs bg-red-100 rounded hover:bg-red-200"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
