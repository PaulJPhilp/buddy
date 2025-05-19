import React, { useEffect, useState, useRef } from 'react';
import { Effect, pipe } from 'effect';
import { Alert, AlertDescription, Button } from '@ui/components/ui';
import { ChatService } from './ChatService';
import { ChatBubble } from '@ui/components/chat/ChatBubble';
import type { ChatState } from './ChatServiceApi';


const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<ChatState['messages']>(() => [
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "assistant",
      timestamp: Date.now(),
      metadata: { length: 29 }
    },
    {
      id: "2",
      text: "I need help with my React code",
      sender: "user",
      timestamp: Date.now(),
      metadata: { length: 28 }
    },
    {
      id: "3",
      text: "I'd be happy to help with your React code. What specific issue are you encountering?",
      sender: "assistant",
      timestamp: Date.now(),
      metadata: { length: 76 }
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);




  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      const newMessage: ChatState['messages'][0] = {
        id: `msg-${Date.now()}`,
        text,
        sender: "user",
        timestamp: Date.now(),
        metadata: { length: text.length }
      };
      setMessages([...messages, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className="h-full p-2 flex flex-col relative bg-background text-foreground" style={{ minHeight: 0 }}>
      <div className="flex-1 border rounded-lg border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-3.5 border-b px-4 flex items-center bg-card">
          <h1 className="text-[0.6rem] font-semibold text-muted-foreground">Buddy Chat</h1>
        </div>

        {/* Chat Window */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 flex flex-col gap-1">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.sender === "user" ? "user" : "assistant"}
              content={message.text}
            />
          ))}
          {isTyping && (
            <ChatBubble
              role="assistant"
              content={<div className="animate-pulse">...</div>}
            />
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
              const text = input.value.trim();
              if (text) {
                handleSendMessage(text);
                input.value = '';
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              name="message"
              placeholder="Type a message..."
              className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button type="submit" size="sm">
              Send
            </Button>
          </form>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
