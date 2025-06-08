"use client";


import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { useRef, useState } from "react";
import ChatContainer from "./ChatContainer";

// Define a type for our chat configuration
interface ChatConfig {
  id: string;
  appName: string;
  displayName: string;
}

export default function Home() {
  // State to track available chat apps
  const [chats, setChats] = useState<ChatConfig[]>([
    {
      id: "test-chat",
      appName: "test",
      displayName: "Test Chat",
    },
  ]);

  // Use a ref to track if we should ignore the next onOpenChange event
  const ignoreNextOpenChange = useRef(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Removed monitoring effect to prevent potential update loops

  // Handler for creating a new chat
  const handleCreateChat = (chatData: {
    appName: string;
    displayName: string;
  }) => {
    console.log("Creating new chat with data:", chatData);
    const chatId = chatData.appName || `chat-${Date.now()}`;

    // Create a new chat config
    const newChat: ChatConfig = {
      id: chatId,
      appName: chatData.appName,
      displayName: chatData.displayName,
    };

    // Register the chat with AppService
    console.log("Registering chat with AppService:", chatId);

    // Create a default app config for this chat
    const defaultAppConfig = {
      id: chatId,
      name: chatData.displayName,
      agentId: `agent-${chatId}`,
      toolbarId: "default-toolbar",
      themeId: "default-theme",
    };

    // In a production app, we would use Effect to register with AppService
    // But for now, we'll just create the chat in local state

    // Update local state
    setChats((prevChats) => [...prevChats, newChat]);
    setIsCreateDialogOpen(false);
    console.log("Dialog closed after chat creation");
  };

  // If no chat apps are available, show a welcome message
  const noChatsAvailable = chats.length === 0;

  return (
    <ClerkProvider>
      <ThemeProvider>
        <div className="h-screen w-full bg-gray-100">
          {noChatsAvailable ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center max-w-md p-8 bg-white shadow-sm rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Welcome to Buddy</h1>
                <p className="text-gray-600 mb-6">
                  No chat applications are currently available. Create a new
                  chat to get started.
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    console.log("Create New Chat button clicked");
                    // Set flag to ignore the next onOpenChange event
                    ignoreNextOpenChange.current = true;
                    setIsCreateDialogOpen(true);
                    console.log("isCreateDialogOpen set to:", true);
                  }}
                >
                  Create New Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full w-full grid grid-cols-2 gap-4 p-4">
              {/* Render chat containers based on available chats */}
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="h-full bg-white shadow-sm rounded-lg overflow-hidden"
                >
                  <ChatContainer
                    id={chat.id}
                    displayName={chat.displayName}
                    theme={{
                      colors: {
                        primary: "blue-500",
                        secondary: "gray-100",
                        background: "white",
                        text: "gray-900",
                      },
                      header: {
                        background: "blue-600",
                        text: "white",
                      },
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Create Chat Dialog */}
          <CreateChatDialog
            isOpen={isCreateDialogOpen}
            onCloseAction={() => {
              console.log("Closing dialog from page component");
              setIsCreateDialogOpen(false);
            }}
            onCreateChatAction={handleCreateChat}
          />

          {/* Floating action button for creating new chat */}
          {!noChatsAvailable && (
            <button
              onClick={() => {
                console.log("Floating action button clicked");
                // Set flag to ignore the next onOpenChange event
                ignoreNextOpenChange.current = true;
                setIsCreateDialogOpen(true);
                console.log("isCreateDialogOpen set to:", true);
              }}
              className="fixed right-6 bottom-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
              aria-label="Create new chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      </ThemeProvider>
    </ClerkProvider>
  );
}
