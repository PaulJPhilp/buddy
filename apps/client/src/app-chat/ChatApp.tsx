"use client";

import { FileIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { InputArea } from "../components/InputArea";
import { MessageItem } from "../components/MessageItem";
import { cn } from "../utils/cn";
import type { MessageApi } from "./ChatServiceApi";
import { DashboardCard } from "./components/DashboardCard";

interface DisplayFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const MOCK_THREADS = {
  thread1: [
    {
      id: "1",
      text: "Hi, I need help with my React application",
      sender: "user" as const,
      timestamp: Date.now() - 50000,
      attachments: [],
    },
    {
      id: "2",
      text: "I'd be happy to help! What specific issues are you encountering with your React application?",
      sender: "assistant" as const,
      timestamp: Date.now() - 40000,
      attachments: [],
    },
    {
      id: "3",
      text: "I'm having trouble with state management. My components aren't updating when I expect them to.",
      sender: "user" as const,
      timestamp: Date.now() - 35000,
      attachments: [],
    },
    {
      id: "4",
      text: "That's a common issue. Could you share a specific example of where the state updates aren't working as expected?",
      sender: "assistant" as const,
      timestamp: Date.now() - 30000,
      attachments: [],
    },
    {
      id: "5",
      text: "Sure, I have a counter component that's not updating when I click the increment button.",
      sender: "user" as const,
      timestamp: Date.now() - 25000,
      attachments: [],
    },
    {
      id: "6",
      text: "Let's take a look at that. Are you using useState for the counter? Make sure you're using the setter function and not modifying state directly.",
      sender: "assistant" as const,
      timestamp: Date.now() - 20000,
      attachments: [],
    },
    {
      id: "7",
      text: "Yes, I'm using useState. Here's my code: const [count, setCount] = useState(0); const increment = () => count++;",
      sender: "user" as const,
      timestamp: Date.now() - 15000,
      attachments: [],
    },
    {
      id: "8",
      text: "Ah, I see the issue. You're modifying the count variable directly. Instead, use setCount: const increment = () => setCount(prev => prev + 1);",
      sender: "assistant" as const,
      timestamp: Date.now() - 10000,
      attachments: [],
    },
  ] as MessageApi[],
  thread2: [
    {
      id: "1",
      text: "Can you help me optimize my database queries?",
      sender: "user" as const,
      timestamp: Date.now() - 45000,
      attachments: [],
    },
    {
      id: "2",
      text: "Of course! Are you using any specific database system?",
      sender: "assistant" as const,
      timestamp: Date.now() - 35000,
      attachments: [],
    },
    {
      id: "3",
      text: "Yes, I'm using PostgreSQL with multiple joins that are running slowly",
      sender: "user" as const,
      timestamp: Date.now() - 30000,
      attachments: [],
    },
    {
      id: "4",
      text: "I see. Could you share one of the slow queries? We can look at the execution plan and suggest optimizations.",
      sender: "assistant" as const,
      timestamp: Date.now() - 25000,
      attachments: [],
    },
    {
      id: "5",
      text: "Here's my query: SELECT * FROM users JOIN orders ON users.id = orders.user_id JOIN products ON orders.product_id = products.id",
      sender: "user" as const,
      timestamp: Date.now() - 20000,
      attachments: [],
    },
    {
      id: "6",
      text: "I notice a few potential optimizations: 1) Avoid SELECT *, only select needed columns 2) Consider adding indexes on join columns 3) Check if you really need all those joins",
      sender: "assistant" as const,
      timestamp: Date.now() - 15000,
      attachments: [],
    },
    {
      id: "7",
      text: "Thanks! I'll try adding indexes. Should I create them on both sides of the join?",
      sender: "user" as const,
      timestamp: Date.now() - 10000,
      attachments: [],
    },
    {
      id: "8",
      text: "Generally, you want indexes on the foreign key columns (orders.user_id and orders.product_id). The primary key columns (users.id and products.id) are automatically indexed.",
      sender: "assistant" as const,
      timestamp: Date.now() - 5000,
      attachments: [],
    },
  ] as MessageApi[],
};

interface ChatAppProps {
  isSelected?: boolean;
  onSelect?: () => void;
  onClose?: () => void;
  threadId: keyof typeof MOCK_THREADS;
}

export function ChatApp({
  isSelected = false,
  onSelect,
  onClose,
  threadId,
}: ChatAppProps) {
  const [messages, setMessages] = useState<MessageApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<DisplayFile[]>([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(MOCK_THREADS[threadId] || []);
  }, [threadId]);

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    try {
      const newMessage: MessageApi = {
        id: Date.now().toString(),
        text: content,
        sender: "user",
        timestamp: Date.now(),
        attachments: attachedFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      };
      setMessages((prev) => [...prev, newMessage]);
      setAttachedFiles([]);
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: DisplayFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <fieldset
      className={cn(
        "flex-1 flex flex-col h-full rounded-lg bg-background min-w-[400px] max-w-[800px] border-2 transition-colors cursor-pointer relative",
        isSelected ? "border-green-500" : "border-gray-200",
        threadId === "thread1" ? "bg-teal-50" : "bg-orange-50",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors z-10"
          aria-label="Close chat"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 overflow-y-auto p-4 relative">
        <DashboardCard
          isOpen={isDashboardOpen}
          onCloseAction={() => setIsDashboardOpen(false)}
        />
        {messages?.map((msg) => (
          <MessageItem
            key={msg.id}
            message={{
              id: msg.id,
              content: msg.text,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp).toLocaleTimeString(),
              attachments: msg.attachments,
            }}
            theme={threadId === "thread1" ? "blue" : "rose"}
          />
        ))}
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
      <div className="border-t bg-background/50">
        <div className="px-4 py-3">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-background px-2 py-1 rounded border"
                >
                  <div
                    className="group relative cursor-help"
                    aria-label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`}
                  >
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <InputArea
              onSubmitAction={handleSendMessage}
              onAttach={() => fileInputRef.current?.click()}
              onShowDashboard={() => setIsDashboardOpen((prev) => !prev)}
              threadId={threadId}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
