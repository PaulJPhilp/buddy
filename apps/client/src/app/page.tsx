"use client";

import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { useRef, useState } from "react";

// Define a type for our chat configuration
interface ChatConfig {
  id: string;
  appName: string;
  displayName: string;
}

// Simple test container component
function SimpleTestContainer({ id, displayName }: { id: string; displayName: string }) {
  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-lg font-semibold mb-2">Test Container</div>
      <div className="space-y-2 text-sm text-gray-600">
        <div>ID: {id}</div>
        <div>Display Name: {displayName}</div>
        <div>Status: Ready for testing</div>
      </div>
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <div className="text-green-800 font-medium">✓ Container Active</div>
        <div className="text-green-600 text-sm">
          This container is ready for testing tools and infrastructure.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // State to track available chat apps
  const [chats, setChats] = useState<ChatConfig[]>([
    {
      id: "test-container-1",
      appName: "test1",
      displayName: "Test Container 1",
    },
    {
      id: "test-container-2",
      appName: "test2",
      displayName: "Test Container 2",
    },
  ]);

  // Use a ref to track if we should ignore the next onOpenChange event
  const ignoreNextOpenChange = useRef(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Handler for creating a new test container
  const handleCreateChat = (chatData: {
    appName: string;
    displayName: string;
  }) => {
    console.log("Creating new test container with data:", chatData);
    const chatId = chatData.appName || `test-${Date.now()}`;

    // Create a new test container config
    const newChat: ChatConfig = {
      id: chatId,
      appName: chatData.appName,
      displayName: chatData.displayName,
    };

    // Update local state
    setChats((prevChats) => [...prevChats, newChat]);
    setIsCreateDialogOpen(false);
    console.log("Dialog closed after container creation");
  };

  // If no containers are available, show a welcome message
  const noContainersAvailable = chats.length === 0;

  return (
    <ClerkProvider>
      <ThemeProvider>
        <div className="h-screen w-full bg-gray-100">
          {noContainersAvailable ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center max-w-md p-8 bg-white shadow-sm rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Welcome to Buddy</h1>
                <p className="text-gray-600 mb-6">
                  No test containers are currently available. Create a new
                  container to test the tools and infrastructure.
                </p>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    console.log("Create New Container button clicked");
                    ignoreNextOpenChange.current = true;
                    setIsCreateDialogOpen(true);
                  }}
                >
                  Create New Test Container
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full w-full p-4">
              {/* Header with info */}
              <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                <h1 className="text-xl font-bold mb-2">Buddy - Testing Mode</h1>
                <p className="text-gray-600 text-sm">
                  Chat functionality has been separated. Use the toolbar tools (sidebar, error manager, debug tool)
                  to test the infrastructure before implementing the full chat app.
                </p>
              </div>

              {/* Grid of test containers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100%-120px)]">
                {chats.map((chat) => (
                  <SimpleTestContainer
                    key={chat.id}
                    id={chat.id}
                    displayName={chat.displayName}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Create Container Dialog */}
          <CreateChatDialog
            isOpen={isCreateDialogOpen}
            onCloseAction={() => {
              console.log("Closing dialog from page component");
              setIsCreateDialogOpen(false);
            }}
            onCreateChatAction={handleCreateChat}
          />

          {/* Floating action button for creating new container */}
          {!noContainersAvailable && (
            // biome-ignore lint/a11y/useButtonType: <explanation>
<button
              onClick={() => {
                console.log("Floating action button clicked");
                ignoreNextOpenChange.current = true;
                setIsCreateDialogOpen(true);
              }}
              className="fixed right-6 bottom-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
              aria-label="Create new test container"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </ThemeProvider>
    </ClerkProvider>
  );
}
