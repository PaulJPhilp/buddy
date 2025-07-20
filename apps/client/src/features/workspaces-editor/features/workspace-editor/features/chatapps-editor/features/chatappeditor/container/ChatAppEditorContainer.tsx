import type { ChatAppConfig } from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { ChatAppForm } from "../components/ChatAppForm";
import { useChatAppEditor } from "../hooks/useChatAppEditorHook";

export function ChatAppEditorContainer() {
  const { currentChatApp, isLoading, error, setChatApp } = useChatAppEditor();

  if (isLoading) {
    return <div>Loading singular chat app editor...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading singular chat app editor: {error}
      </div>
    );
  }

  const handleSaveChatApp = (updatedChatApp: ChatAppConfig) => {
    // This is where you would typically call a manager method to save the chat app
    console.log("Saving singular chat app:", updatedChatApp);
    setChatApp(updatedChatApp);
    // In a real scenario, you'd likely navigate away or show a success message
  };

  const handleCancelEditing = () => {
    setChatApp(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Singular Chat App Editor</h1>
      {currentChatApp ? (
        <div>
          <p className="mb-2">
            Currently editing:{" "}
            <span className="font-semibold">{currentChatApp.name}</span> (ID:{" "}
            {currentChatApp.id})
          </p>
          <ChatAppForm
            initialValues={currentChatApp}
            onSubmit={handleSaveChatApp}
            onCancel={handleCancelEditing}
          />
        </div>
      ) : (
        <div>
          <p>No chat app is currently selected for singular editing.</p>
          <button
            className="mt-4 p-2 bg-green-500 text-white rounded"
            onClick={() => {
              // Example: set a dummy chat app for editing
              setChatApp({
                id: "singular-new-chatapp-id",
                name: "New Chat App",
                description: "A brand new chat app for singular editing",
                systemPrompt: "You are a helpful assistant.",
                avatar: "",
                tags: [],
                model: {
                  provider: "openai",
                  name: "gpt-3.5-turbo",
                  temperature: 0.7,
                  maxTokens: 500,
                },
                functions: [],
                metadata: {},
                isDefault: false,
                isArchived: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }}
          >
            Start Editing New Singular Chat App (Example)
          </button>
        </div>
      )}
    </div>
  );
}
