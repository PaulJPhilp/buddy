import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { ChatAppList } from "../components/ChatAppList";
import { ChatAppsPanel } from "../components/ChatAppsPanel";
import { useChatAppsEditor } from "../hooks/useChatAppsEditorHook";

export function ChatAppsEditorContainer() {
  const {
    chatApps,
    isLoading,
    error,
    addChatApp,
    updateChatApp,
    deleteChatApp,
  } = useChatAppsEditor();

  if (isLoading) {
    return <div>Loading chat apps editor...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading chat apps editor: {error}
      </div>
    );
  }

  const handleAddChatApp = (chatApp: ChatAppConfig) => {
    addChatApp(chatApp);
  };

  const handleUpdateChatApp = (chatApp: ChatAppConfig) => {
    updateChatApp(chatApp);
  };

  const handleDeleteChatApp = (id: string) => {
    deleteChatApp(id);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Apps Editor</h1>
      <p>Manage multiple chat applications.</p>

      {/* Example of integrating ChatAppsPanel and ChatAppList */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Chat Apps List</h2>
          <ChatAppList
            chatApps={chatApps}
            onEdit={(app) => console.log("Edit app:", app)}
            onDelete={handleDeleteChatApp}
          />
        </div>
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">
            Chat Apps Panel (Example)
          </h2>
          <ChatAppsPanel
            workspaceId="example-workspace-id" // Placeholder, should come from context
            onClose={() => console.log("ChatAppsPanel closed")}
          />
        </div>
      </div>
    </div>
  );
}
