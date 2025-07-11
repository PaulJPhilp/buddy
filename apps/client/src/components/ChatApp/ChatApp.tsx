"use client";

import type { ChatAppInstance } from "@/managers/chatapps/types";
import React, { useState } from "react";
import { ChatBubble } from "./ChatBubble";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
}

interface ChatAppProps {
  instance: ChatAppInstance;
  onSendMessage?: (message: string) => Promise<void>;
  onStatusChange?: (status: string) => void;
  className?: string;
}

export function ChatApp({
  instance,
  onSendMessage,
  onStatusChange,
  className = "",
}: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `# Welcome to Buddy Chat! 🤖

Hello! I'm your **AI assistant** powered by *Google's Gemini*. I'm here to help you with:

- 📝 **Questions & Research** - Ask me anything!
- 💻 **Coding & Development** - Get help with programming
- ✍️ **Creative Writing** - Stories, poems, content creation
- 📊 **Analysis & Data** - Break down complex topics
- 🎯 **Task Planning** - Organize your projects

> **Tip:** I can format my responses with rich markdown including headers, lists, code blocks, tables, and more!

What would you like to explore today?`,
      sender: "assistant",
      timestamp: new Date(Date.now() - 30 * 1000), // 30 seconds ago
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      if (onSendMessage) {
        await onSendMessage(userMessage.content);
      }

      // Call real LLM API with full conversation history
      const conversationHistory = [
        {
          role: "system",
          content: `You are a helpful AI assistant integrated into the Buddy chat app. You can help with various tasks, answer questions, and provide useful information.

**FORMATTING GUIDELINES:**
- Use **bold** and *italic* text for emphasis
- Create ## Headers and ### Sub-headers to organize information
- Use \`inline code\` for technical terms and \`\`\`code blocks\`\`\` for multi-line code
- Create bulleted lists with - or numbered lists with 1. 2. 3.
- Use > blockquotes for important notes or quotes
- Add horizontal rules (---) to separate major sections
- Use tables when displaying structured data
- Include links [like this](https://example.com) when relevant

**CONTENT STYLE:**
- Be comprehensive and detailed in your responses
- Break down complex topics into clear sections
- Use examples and analogies to illustrate points
- Include practical tips and actionable advice
- Vary your formatting to make responses visually engaging

Always respond with well-structured, visually appealing markdown that showcases various formatting elements when appropriate.`,
        },
        ...messages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: userMessage.content,
        },
      ];

      const response = await fetch("/api/agent/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      // Create assistant message with streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: "",
        sender: "assistant",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update the streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent, isStreaming: true }
                : msg,
            ),
          );
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        // Mark streaming as complete even on error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-lg shadow-lg border ${className}`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {instance.config?.name?.charAt(0) || "C"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {instance.config?.name || instance.id}
            </h3>
            <p className="text-xs text-gray-500">
              {instance.config?.description || "Chat Assistant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            showTimestamp={showTimestamps}
          />
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <ChatBubble
            message={{
              id: "typing-indicator",
              content: "",
              sender: "assistant",
              timestamp: new Date(),
              isStreaming: true,
            }}
            showTimestamp={false}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>

        {/* Chat Controls */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show timestamps
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span>{messages.length} messages</span>
            <span>•</span>
            <span>Status: {instance.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
