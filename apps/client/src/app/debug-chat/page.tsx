"use client";

import { useSimpleChat } from "@/hooks/useSimpleChat";
import { useState } from "react";

export default function DebugChatPage() {
  const [inputText, setInputText] = useState("");

  const { chatState, dispatchAction } = useSimpleChat("debug-chat-123", {
    agentId: "debug-agent",
    initialAgentName: "Debug Agent",
  });

  const handleSend = () => {
    if (inputText.trim()) {
      console.log("Debug: Sending message:", inputText);
      dispatchAction({
        _tag: "sendMessage",
        text: inputText.trim(),
      });
      setInputText("");
    }
  };

  return (
    <div className="h-screen flex flex-col max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Chat</h1>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <p>
          <strong>Status:</strong> {chatState.status}
        </p>
        <p>
          <strong>Agent:</strong> {chatState.agentName}
        </p>
        <p>
          <strong>Messages Count:</strong> {chatState.messages.length}
        </p>
        <p>
          <strong>Is Typing:</strong> {chatState.isTyping ? "Yes" : "No"}
        </p>
        {chatState.error && (
          <p className="text-red-600">
            <strong>Error:</strong> {chatState.error}
          </p>
        )}
      </div>

      {/* Test Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            console.log("Test button 1 clicked");
            dispatchAction({
              _tag: "sendMessage",
              text: "Hello from test button 1",
            });
          }}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Test Message 1
        </button>
        <button
          onClick={() => {
            console.log("Test button 2 clicked");
            dispatchAction({
              _tag: "sendMessage",
              text: "Another test message",
            });
          }}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Send Test Message 2
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 border rounded p-4 mb-4 overflow-y-auto bg-white">
        <h3 className="font-semibold mb-2">
          Messages ({chatState.messages.length})
        </h3>
        {chatState.messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet...</p>
        ) : (
          <div className="space-y-2">
            {chatState.messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`p-2 rounded ${
                  message.role === "user"
                    ? "bg-blue-100 ml-8"
                    : "bg-gray-100 mr-8"
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {message.role} • {message.id} •{" "}
                  {message.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString()
                    : "No timestamp"}
                </div>
                <div>{message.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
