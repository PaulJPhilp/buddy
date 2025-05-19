import React, { useEffect, useState, useRef } from 'react';
import { Effect, pipe } from 'effect';
import { Alert, AlertDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/ui';
import { ChatService } from './ChatService';
import { ChatBubble } from '@ui/components/chat/ChatBubble';
import type { ChatState } from './ChatServiceApi';
import { BarChart2, Bot, ChevronDown, Paperclip, Send } from "lucide-react";
import type { Character } from '../character/types';


export default function ChatApp() {
  const [selectedAgent, setSelectedAgent] = useState<string>("default");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const removeFile = (index: number) => {
    setAttachedFiles(files => files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          setError(`File ${file.name} is too large. Maximum size is 10MB`);
          return false;
        }
        return true;
      });
      setAttachedFiles(current => [...current, ...validFiles]);
    }
    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  const agents: Character[] = [
    {
      id: "default",
      name: "Buddy",
      description: "Your helpful AI assistant",
      status: { mood: 100, energy: 100, health: 100 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true }
    },
    {
      id: "coder",
      name: "Code Buddy",
      description: "Specialized in programming assistance",
      status: { mood: 100, energy: 100, health: 100 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true }
    }
  ];

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
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-4">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.sender === "user" ? "user" : "assistant"}
                content={message.text}
              />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>
        </div>
        </div>

        {/* User Area */}
        <div className="bg-gray-50 dark:bg-gray-900">
          {/* Attachment Bar */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-1 flex gap-1 items-center overflow-x-auto">
              {attachedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-1 bg-white dark:bg-gray-950 rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 text-[0.47rem] shrink-0"
                >
                  <span className="truncate max-w-[80px]">{file.name}</span>
                  <span className="text-muted-foreground/50">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground/50 hover:text-destructive ml-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Input Area */}
          <div className="px-4 pt-4 pb-1">
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
              className="relative flex"
            >
              <input
                type="text"
                name="message"
                placeholder="Type a message..."
                className="w-full h-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-colors pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 items-center">
                <button type="button" className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                />
                <button 
                  type="button" 
                  className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="submit" className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>

          {/* Agent Toolbar */}
          <div className="px-4 py-0.5 grid grid-cols-3 items-center border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5">
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="h-5 text-[0.47rem] w-14 border-[0.5px] border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 focus-visible:outline-none focus-visible:ring-[0.5px] focus-visible:ring-ring focus-visible:ring-offset-[0.5px] px-1.5">
                  <div className="flex items-center gap-0.5 overflow-hidden">
                    <SelectValue placeholder="Agent" />
                    <ChevronDown className="h-2.5 w-2.5 opacity-50 flex-shrink-0" aria-hidden="true" />
                  </div>
                </SelectTrigger>
                <SelectContent 
                  sideOffset={4} 
                  className="min-w-[var(--radix-select-trigger-width)] [&_[role=option]]:py-0.5 [&_[role=listbox]]:p-0.5 bg-white dark:bg-gray-950 border shadow-md rounded-sm [&_svg]:h-2.5 [&_svg]:w-2.5"
                >
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id} className="text-[0.47rem]">
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div></div>
          </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
}
