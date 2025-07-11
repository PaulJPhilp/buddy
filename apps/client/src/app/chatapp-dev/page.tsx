"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { ChatApp } from "@/components/chatapp/ChatApp";
import { ChatAppsManager } from "@/managers/chatapps";
import type { ChatAppInstance } from "@/managers/chatapps/types";
import { Effect } from "effect";
import React, { useEffect, useState } from "react";

export default function ChatAppDevPage() {
  const { runWithServices } = useEffectContext();
  const [chatAppInstance, setChatAppInstance] =
    useState<ChatAppInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devActions, setDevActions] = useState({
    testMessageSent: false,
    errorSimulated: false,
    chatReset: false,
  });

  // Initialize a single chat app for development
  useEffect(() => {
    const initializeChatApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await runWithServices(
          Effect.gen(function* () {
            const chatAppsManager = yield* ChatAppsManager;

            // Create a development chat app instance
            const devChatApp = yield* chatAppsManager.registerChatApp(
              "dev-workspace",
              "dev-chat-app",
              {
                name: "Development Chat Assistant",
                description: "A chat app for testing design and functionality",
                version: "1.0.0",
                agentId: "dev-agent",
                capabilities: ["text-chat", "file-upload", "code-assistance"],
                theme: "default",
                isDefault: false,
                createdAt: new Date().toISOString(),
              },
            );

            // Set it to expanded state for development
            yield* chatAppsManager.expandChatApp("dev-chat-app");

            // Get the updated instance
            const instance =
              yield* chatAppsManager.getChatAppInstance("dev-chat-app");
            setChatAppInstance(instance);
          }),
        );
      } catch (err) {
        console.error("Failed to initialize dev chat app:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    initializeChatApp();
  }, [runWithServices]);

  // Development action handlers
  const handleSendTestMessage = async () => {
    console.log("Sending test message to chat app");
    setDevActions((prev) => ({ ...prev, testMessageSent: true }));
    // Reset after 2 seconds
    setTimeout(() => {
      setDevActions((prev) => ({ ...prev, testMessageSent: false }));
    }, 2000);
  };

  const handleSimulateError = async () => {
    console.log("Simulating error state");
    setDevActions((prev) => ({ ...prev, errorSimulated: true }));
    // Reset after 3 seconds
    setTimeout(() => {
      setDevActions((prev) => ({ ...prev, errorSimulated: false }));
    }, 3000);
  };

  const handleResetChat = async () => {
    console.log("Resetting chat state");
    setDevActions((prev) => ({ ...prev, chatReset: true }));
    // Reset after 1 second
    setTimeout(() => {
      setDevActions((prev) => ({ ...prev, chatReset: false }));
    }, 1000);
  };

  const handleSimulateAgentResponse = async () => {
    console.log("Testing LLM response");
    // Trigger a test message to the chat app
    try {
      const response = await fetch("/api/agent/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant. Respond with a brief test message.",
            },
            {
              role: "user",
              content:
                "Please respond with a test message to verify the LLM integration is working.",
            },
          ],
        }),
      });

      const data = await response.json();
      console.log("LLM Test Response:", data);

      if (data.content) {
        alert(
          `LLM Test Successful!\n\nResponse: ${data.content.substring(0, 100)}...`,
        );
      } else {
        alert("LLM Test Failed: No content returned");
      }
    } catch (error) {
      console.error("LLM Test Error:", error);
      alert(
        `LLM Test Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing chat app...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600">Error: {error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chatAppInstance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No chat app instance available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Development Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chat App Development
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Standalone chat app for design and functionality iteration
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Status:{" "}
              <span className="font-medium text-green-600">
                {chatAppInstance.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              ID: <span className="font-mono">{chatAppInstance.id}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat App Instance */}
          <div className="lg:col-span-2">
            <div className="h-[600px]">
              <ChatApp
                instance={chatAppInstance}
                onSendMessage={async (message) => {
                  console.log("Sending message:", message);
                  // Here we can add real message handling logic later
                }}
                onStatusChange={(status) => {
                  console.log("Status changed:", status);
                }}
                className="h-full"
              />
            </div>
          </div>

          {/* Development Tools Panel */}
          <div className="space-y-6">
            {/* Chat App Info */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chat App Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">
                    {chatAppInstance.config?.name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-600">
                    {chatAppInstance.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Workspace:</span>
                  <span className="ml-2 text-gray-600">
                    {chatAppInstance.workspaceId}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(chatAppInstance.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Last Active:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {new Date(chatAppInstance.lastActiveAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Design Controls */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Design Controls
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Default</option>
                    <option>Dark</option>
                    <option>Blue</option>
                    <option>Green</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Compact</option>
                    <option>Normal</option>
                    <option>Large</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-timestamps"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="show-timestamps"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Show timestamps
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-typing"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="enable-typing"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Show typing indicators
                  </label>
                </div>
              </div>
            </div>

            {/* Development Actions */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dev Actions
              </h3>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> LLM integration requires
                  GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file. Get your
                  API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  className={`w-full px-4 py-2 text-white rounded-md transition-colors text-sm ${
                    devActions.testMessageSent
                      ? "bg-green-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {devActions.testMessageSent
                    ? "✓ Test Message Sent"
                    : "Send Test Message"}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateAgentResponse}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Test LLM Integration
                </button>
                <button
                  type="button"
                  onClick={handleSimulateError}
                  className={`w-full px-4 py-2 text-white rounded-md transition-colors text-sm ${
                    devActions.errorSimulated
                      ? "bg-red-800"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                >
                  {devActions.errorSimulated
                    ? "⚠️ Error Active"
                    : "Test Error State"}
                </button>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className={`w-full px-4 py-2 text-white rounded-md transition-colors text-sm ${
                    devActions.chatReset
                      ? "bg-green-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {devActions.chatReset ? "✓ Chat Reset" : "Reset Chat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
