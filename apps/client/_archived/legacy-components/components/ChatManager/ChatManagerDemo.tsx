"use client";

import { useChatManager } from "@/hooks/useChatManager";
import { useState } from "react";

export function ChatManagerDemo() {
  const { state, isLoading, error, actions } = useChatManager();
  const [messageInput, setMessageInput] = useState("");
  const [chatIdInput, setChatIdInput] = useState("");
  const [agentIdInput, setAgentIdInput] = useState("");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading ChatManager...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          EffectTalk ChatManager Demo
        </h1>
        <p className="text-gray-600 mt-1">
          Testing the single ChatManager service that coordinates multiple chat
          instances
        </p>
      </div>

      {/* Current State */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Current State
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Active Chat:</span>
            <span className="ml-2 text-blue-600">
              {state?.activeChatId || "None"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Active Chats:</span>
            <span className="ml-2 text-green-600">
              {state?.activeChats.length || 0}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Messages:</span>
            <span className="ml-2 text-purple-600">
              {state?.totalMessages || 0}
            </span>
          </div>
        </div>

        {state?.activeChats && state.activeChats.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-gray-700">Chat IDs:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {state.activeChats.map((chatId) => (
                <span
                  key={chatId}
                  className={`px-2 py-1 text-xs rounded-full ${
                    chatId === state.activeChatId
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {chatId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Chat Management
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="chat-id-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Chat ID
            </label>
            <input
              id="chat-id-input"
              type="text"
              value={chatIdInput}
              onChange={(e) => setChatIdInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., literature-chat"
            />
          </div>
          <div>
            <label
              htmlFor="agent-id-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Agent ID (optional)
            </label>
            <input
              id="agent-id-input"
              type="text"
              value={agentIdInput}
              onChange={(e) => setAgentIdInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., literature-expert"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() =>
              actions.initializeChatInstance(
                chatIdInput,
                agentIdInput || undefined,
              )
            }
            disabled={!chatIdInput.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Initialize Chat
          </button>
          <button
            type="button"
            onClick={() => actions.setActiveChat(chatIdInput)}
            disabled={!chatIdInput.trim()}
            className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Set as Active
          </button>
          <button
            type="button"
            onClick={() => actions.closeChatInstance(chatIdInput)}
            disabled={!chatIdInput.trim()}
            className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Close Chat
          </button>
        </div>
      </div>

      {/* Message Operations */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Message Operations
        </h2>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="message-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message Content
            </label>
            <textarea
              id="message-input"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="Enter your message..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => actions.sendMessageToActiveChat(messageInput)}
              disabled={!messageInput.trim() || !state?.activeChatId}
              className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Send to Active Chat
            </button>
            <button
              type="button"
              onClick={() => actions.sendMessage(chatIdInput, messageInput)}
              disabled={!messageInput.trim() || !chatIdInput.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Send to Specific Chat
            </button>
            <button
              type="button"
              onClick={() => actions.broadcastMessage(messageInput)}
              disabled={!messageInput.trim()}
              className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              Broadcast to All
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Operations */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Advanced Operations
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => actions.clearAllChats()}
            className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Clear All Chats
          </button>
          <button
            type="button"
            onClick={() => actions.switchAgentInActiveChat(agentIdInput)}
            disabled={!agentIdInput.trim() || !state?.activeChatId}
            className="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50"
          >
            Switch Agent in Active Chat
          </button>
          <button
            type="button"
            onClick={() => actions.clearChatHistory(chatIdInput)}
            disabled={!chatIdInput.trim()}
            className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            Clear Chat History
          </button>
        </div>
      </div>

      {/* Live State Inspector */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Live State Inspector
        </h2>
        <div className="bg-white border border-gray-200 rounded p-3">
          <pre className="text-xs text-gray-600 overflow-auto max-h-40">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
