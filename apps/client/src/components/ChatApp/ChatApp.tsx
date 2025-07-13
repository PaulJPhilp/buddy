"use client";

import { ChatAppsManager } from "@/managers/chatapps";
import type { ChatAppInstance, ChatMessage } from "@/managers/chatapps/types";
import { Effect } from "effect";
import React, { useState, useEffect } from "react";
import { useEffectContext } from "../EffectProvider";
import { ChatBubble } from "./ChatBubble";
import { HeaderBar } from "./HeaderBar";
import { UserArea } from "./UserArea";

// Use the ChatMessage type from the managers
type Message = ChatMessage;

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
  const { runWithServices } = useEffectContext();

  // Local UI state only
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load messages from ChatAppsManager on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const chatAppsManager = yield* ChatAppsManager;

            // Get existing messages from the chat app instance
            const existingMessages = yield* chatAppsManager.getChatAppMessages(
              instance.id,
            );

            // Get the chat app instance to check if it has been cleared
            const chatAppInstance = yield* chatAppsManager.getChatAppInstance(
              instance.id,
            );

            // Only add welcome message if no messages exist AND it hasn't been explicitly cleared
            if (
              existingMessages.length === 0 &&
              !chatAppInstance.hasBeenCleared
            ) {
              const welcomeMessage: Message = {
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
              };
              yield* chatAppsManager.addChatAppMessage(
                instance.id,
                welcomeMessage,
              );
              setMessages([welcomeMessage]);
            } else {
              setMessages(existingMessages);
            }
          }),
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
        // Fallback to default welcome message
        setMessages([
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
            timestamp: new Date(Date.now() - 30 * 1000),
          },
        ]);
      }
    };

    loadMessages();
  }, [instance.id, runWithServices]);

  // Header event handlers
  const handleExpand = async () => {
    console.log("Expand clicked");
    setIsExpanded(true);
    onStatusChange?.("expanded");

    // UI state is managed locally in the component
  };

  const handleCompact = async () => {
    console.log("Compact clicked");
    setIsExpanded(false);
    onStatusChange?.("compacted");

    // UI state is managed locally in the component
  };

  const handleStash = async () => {
    console.log("Stash clicked");
    onStatusChange?.("stashed");

    // Stash the chat app via ChatAppsManager
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.stashChatApp(instance.id);
        }),
      );
    } catch (error) {
      console.error("Failed to stash chat app:", error);
    }
  };

  const handleClose = async () => {
    console.log("Close clicked");
    onStatusChange?.("closed");

    // Close the chat app via ChatAppsManager
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.closeChatApp(instance.id);
        }),
      );
    } catch (error) {
      console.error("Failed to close chat app:", error);
    }
  };

  const handleSettings = async () => {
    console.log("Settings clicked");
    onStatusChange?.("settings_opened");

    // TODO: Implement settings functionality
    // This could open a settings modal or panel
  };

  const handleClear = async () => {
    console.log("Clear clicked");
    onStatusChange?.("cleared");

    // Clear messages in ChatAppsManager and update local state
    try {
      await runWithServices(
        Effect.gen(function* () {
          const chatAppsManager = yield* ChatAppsManager;
          yield* chatAppsManager.clearChatAppMessages(instance.id);
        }),
      );
      // Update local state to reflect cleared messages
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col bg-chat-background rounded-lg shadow-lg border transition-all duration-300 ${
        isExpanded ? "h-full w-full" : "h-full w-1/2"
      } ${className}`}
    >
      {/* Chat Header - Using HeaderManager */}
      <HeaderBar
        chatAppId={instance.id}
        title={instance.config?.name || instance.id}
        onExpandClick={handleExpand}
        onCompactClick={handleCompact}
        onStashClick={handleStash}
        onCloseClick={handleClose}
        onSettingsClick={handleSettings}
        onClearClick={handleClear}
        isExpanded={isExpanded}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 overflow-hidden bg-chat-background">
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

      {/* User Input Area - Using UserAreaManager */}
      <UserArea
        chatAppId={instance.id}
        onSendMessage={async (text, attachments) => {
          if (!text.trim() && attachments.length === 0) return;

          // Create user message with text and attachments
          const userMessage: Message = {
            id: Date.now().toString(),
            content: text.trim() || `[${attachments.length} file(s) attached]`,
            sender: "user",
            timestamp: new Date(),
          };

          // Persist user message to ChatAppsManager first
          try {
            await runWithServices(
              Effect.gen(function* () {
                const chatAppsManager = yield* ChatAppsManager;
                yield* chatAppsManager.addChatAppMessage(
                  instance.id,
                  userMessage,
                );
              }),
            );
          } catch (error) {
            console.error("Failed to persist user message:", error);
          }

          setMessages((prev) => [...prev, userMessage]);
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
              const finalAssistantMessage = {
                id: assistantMessageId,
                content: fullContent,
                sender: "assistant" as const,
                timestamp: new Date(),
                isStreaming: false,
              };

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? finalAssistantMessage : msg,
                ),
              );

              // Persist final assistant message to ChatAppsManager
              try {
                await runWithServices(
                  Effect.gen(function* () {
                    const chatAppsManager = yield* ChatAppsManager;
                    yield* chatAppsManager.addChatAppMessage(
                      instance.id,
                      finalAssistantMessage,
                    );
                  }),
                );
              } catch (error) {
                console.error("Failed to persist assistant message:", error);
              }
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
        }}
        onAgentChange={(agentId) => {
          console.log("Agent changed:", agentId);
          // TODO: Implement agent switching logic
        }}
        onFileAttach={(files) => {
          console.log("Files attached:", files);
          // Files are handled by UserAreaManager
        }}
        onFileRemove={(file) => {
          console.log("File removed:", file);
          // File removal is handled by UserAreaManager
        }}
      />
    </div>
  );
}
