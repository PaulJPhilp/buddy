"use client";

import { Message } from "@/app-chat/ChatServiceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
}

export function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.sender === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "flex flex-col max-w-[80%] gap-1",
                message.sender === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">Typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputText.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
