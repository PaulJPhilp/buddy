import { useChatAppsManager } from "@/features/chatapps/hooks/useChatAppsManager";
import { useState } from "react";
import {
  ChatAppForm,
  ChatAppFormValues,
} from "../chatappeditor/components/ChatAppForm";
import { ChatAppList } from "./ChatAppList";

interface ChatAppsPanelProps {
  workspaceId: string;
  onClose: () => void;
}

export function ChatAppsPanel({ workspaceId, onClose }: ChatAppsPanelProps) {
  const {
    chatApps,
    isLoading,
    error,
    createChatApp,
    updateChatApp,
    deleteChatApp,
    archiveChatApp,
    restoreChatApp,
    refresh,
  } = useChatAppsManager(workspaceId);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleCreate = async (values: ChatAppFormValues) => {
    setFormLoading(true);
    await createChatApp(workspaceId, values);
    setFormLoading(false);
    setShowForm(false);
    refresh();
  };

  const handleEdit = (id: string) => setEditId(id);
  const handleEditSubmit = async (values: ChatAppFormValues) => {
    if (!editId) return;
    setFormLoading(true);
    await updateChatApp(editId, values);
    setFormLoading(false);
    setEditId(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    setFormLoading(true);
    await deleteChatApp(id);
    setFormLoading(false);
    refresh();
  };
  const handleArchive = async (id: string) => {
    setFormLoading(true);
    await archiveChatApp(id);
    setFormLoading(false);
    refresh();
  };
  const handleRestore = async (id: string) => {
    setFormLoading(true);
    await restoreChatApp(id);
    setFormLoading(false);
    refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
  };

  const editInitial = editId
    ? chatApps.find((a) => a.id === editId)?.config
    : undefined;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Manage Chat Apps</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 px-3 py-1 rounded bg-blue-600 text-white"
          disabled={isLoading || formLoading}
        >
          + New Chat App
        </button>
        <ChatAppList
          chatApps={chatApps}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onRestore={handleRestore}
          loading={isLoading || formLoading}
        />
        {(showForm || editId) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <ChatAppForm
                initialValues={editInitial}
                onSubmit={editId ? handleEditSubmit : handleCreate}
                onCancel={handleCancel}
                loading={formLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
