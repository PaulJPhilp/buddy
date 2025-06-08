"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StateValue } from "xstate";
import { useChatMachine } from "../hooks/useChatMachine";
import type { ProtocolMessage } from "../types/chat.types";

/**
 * A simple component to test the chat machine and useMachine hook
 */
export function ChatMachineTest() {
  // State for user input
  const [input, setInput] = useState("");

  // Use the chat machine hook
  const {
    messages,
    error,
    isTyping,
    status,
    sendMessage,
    receiveMessage,
    setTyping,
    clearError,
  } = useChatMachine({
    initialMessages: [
      {
        id: "system-1",
        role: "system",
        content: "This is a test of the chat machine.",
        timestamp: new Date().toISOString(),
      },
    ],
    onSendMessage: async (content) => {
      console.log("Sending message:", content);

      // Simulate a delay for network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return a mock response
      const response: ProtocolMessage = {
        id: `response-${Date.now()}`,
        role: "assistant",
        content: `You said: "${content}"`,
        timestamp: new Date().toISOString(),
      };

      return response;
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  // Simulate typing indicator
  const handleSimulateTyping = () => {
    setTyping(true);
    setTimeout(() => setTyping(false), 3000);
  };

  // Simulate receiving a message
  const handleReceiveMessage = () => {
    const message: ProtocolMessage = {
      id: `received-${Date.now()}`,
      role: "assistant",
      content: "This is a simulated received message.",
      timestamp: new Date().toISOString(),
    };
    receiveMessage(message);
  };

  // Convert status to string for display and comparison - use useMemo to prevent infinite renders
  const statusString = useMemo(() => {
    return typeof status === "string" ? status : JSON.stringify(status);
  }, [status]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("Chat machine state:", {
      messages,
      error,
      isTyping,
      status: statusString,
    });
  }, [messages, error, isTyping, statusString]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Machine Test</h1>

      {/* Status display */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p>
          <strong>Status:</strong> {statusString}
        </p>
        <p>
          <strong>Is Typing:</strong> {isTyping ? "Yes" : "No"}
        </p>
        {error && (
          <p className="text-red-500">
            <strong>Error:</strong> {error.message}
          </p>
        )}
      </div>

      {/* Messages display */}
      <div className="mb-4 border rounded p-2 max-h-80 overflow-y-auto">
        <h2 className="font-bold mb-2">Messages:</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`p-2 rounded ${
                  message.role === "user"
                    ? "bg-blue-100"
                    : message.role === "assistant"
                      ? "bg-green-100"
                      : "bg-gray-100"
                }`}
              >
                <div className="font-bold">{message.role}</div>
                <div>{message.content}</div>
                <div className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-l"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r"
            disabled={statusString === "sending"}
          >
            {statusString === "sending" ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {/* Test buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleSimulateTyping}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Simulate Typing
        </button>
        <button
          onClick={handleReceiveMessage}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Simulate Receive Message
        </button>
        {error && (
          <button onClick={clearError} className="bg-red-200 px-3 py-1 rounded">
            Clear Error
          </button>
        )}
      </div>
    </div>
  );
}
