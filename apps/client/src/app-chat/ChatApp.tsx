"use client";

import { cn } from "@/lib/utils";
import { FileIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { InputArea } from "../components/InputArea";
import { MessageItem } from "../components/MessageItem";
import { type MockThreadId, useAppShellStore } from "../stores/appShellStore";
import type { MessageApi } from "./ChatServiceApi";
import { DashboardCard } from "./components/DashboardCard";
import { MOCK_THREADS } from "./mockData";

interface DisplayFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ChatAppProps {
  onClose?: () => void;
  threadId: MockThreadId;
  theme?: "blue" | "rose";
}

export function ChatApp({
  onClose,
  threadId,
  theme = "blue",
}: ChatAppProps) {
  const { selectedThreadId, setSelectedThreadId } = useAppShellStore();
  const isSelected = selectedThreadId === threadId;

  const [messages, setMessages] = useState<MessageApi[]>(() => MOCK_THREADS[threadId] || []);
  const [error, setError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<DisplayFile[]>([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Agent names for each thread
  const AGENT_NAMES: Record<MockThreadId, string[]> = {
    thread1: ["Alice (React Expert)", "Bob (UI Specialist)", "Carol (State Guru)"],
    thread2: ["Dave (DB Pro)", "Eve (Query Optimizer)", "Frank (Index Master)"]
  };

  // Update messages when threadId changes
  useEffect(() => {
    setMessages(MOCK_THREADS[threadId] || []);
    setSelectedAgent(AGENT_NAMES[threadId][0]);
  }, [threadId]);

  // Scroll to bottom when messages change or when chat is selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSelected]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && attachedFiles.length === 0) return;

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
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 15),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      setAttachedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileId)
    );
  };

  // Define the three row components for user area
  const AttachmentRow = ({ attachedFiles, handleRemoveFile }: {
    attachedFiles: DisplayFile[],
    handleRemoveFile: (fileId: string) => void
  }) => {
    if (attachedFiles.length === 0) return (
      <div className="w-[90%] mx-auto py-0">
        <div className="h-1" /> {/* Empty placeholder for consistent layout */}
      </div>
    );

    return (
      <div className="w-[90%] mx-auto py-0">
        <div className="mx-1">
          <div className={cn(
            "flex flex-wrap gap-0 p-0 rounded-sm",
            theme === "blue" ? 'bg-teal-50' : 'bg-orange-50'
          )}>
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center bg-white px-0.5 py-0 rounded-sm border text-[6px] gap-0",
                  theme === "blue" ? 'border-teal-100' : 'border-orange-100'
                )}
              >
                <FileIcon className={cn(
                  "h-1 w-1",
                  theme === "blue" ? 'text-teal-500' : 'text-orange-500'
                )} />
                <span className="max-w-[30px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className={cn(
                    "ml-0 rounded-full p-0",
                    theme === "blue" ? 'hover:bg-teal-50' : 'hover:bg-orange-50'
                  )}
                  aria-label={`Remove ${file.name}`}
                >
                  <XIcon className="h-1 w-1 text-gray-500 hover:text-red-500" aria-hidden={true} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // InputRow simplified as icons moved into InputArea
  const InputRow = ({
    onFileClick,
    onDashboardClick,
    onSubmitMessage,
    onClose
  }: {
    onFileClick: () => void,
    onDashboardClick: () => void,
    onSubmitMessage: (message: string) => void,
    onClose?: () => void
  }) => {
    return (
      <div className="w-[90%] mx-auto flex items-center justify-center gap-0 py-0">
        <div className="flex-1">
          <InputArea
            onSubmitMessage={onSubmitMessage}
            onPaperclipClick={onFileClick}
            onDashboardClick={onDashboardClick}
            theme={theme}
          />
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-0.5 hover:bg-gray-200 rounded-sm"
            aria-label="Close chat"
            style={{ padding: '1px' }}
          >
            <XIcon className="w-1.5 h-1.5 text-gray-600" />
          </button>
        )}
      </div>
    );
  };

  // Update UserUIRow to remove IconBar since icons have been moved to InputRow
  const UserUIRow = ({
    selectedAgent,
    setSelectedAgent,
    agentNames,
    theme
  }: {
    selectedAgent: string,
    setSelectedAgent: (agent: string) => void,
    agentNames: string[],
    theme: "blue" | "rose"
  }) => {
    return (
      <div className="w-[90%] mx-auto flex items-center py-0 mb-0">
        {/* Agent selector as leftmost item */}
        <div className="relative">
          <select
            className={cn(
              "text-[5px] pl-0.5 pr-1.5 py-0 rounded-sm border bg-white text-gray-600 focus:outline-none focus:ring-0 shadow-none h-2 appearance-none",
              theme === "blue" ? "border-teal-200" : "border-orange-200"
            )}
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            aria-label="Select agent"
            style={{ minWidth: 40, maxWidth: 60 }}
          >
            {agentNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div
            className={cn(
              "absolute top-1/2 right-0.5 -translate-y-1/2 pointer-events-none",
              "w-0.5 h-0.5"
            )}
          >
            <svg
              width="4"
              height="3"
              viewBox="0 0 4 3"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={theme === "blue" ? "text-teal-400" : "text-orange-400"}
            >
              <path d="M2 3L0 0L4 0L2 3Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const baseStylingClasses = "relative flex flex-col h-full transition-all text-left";

  // Always show full view for both chat apps

  // Chat App View (always shown)
  return (
    <div
      className={cn(
        baseStylingClasses,
        "w-full h-full opacity-100 rounded-lg shadow overflow-hidden",
        "relative",
        isSelected
          ? "bg-white"
          : cn(
            "bg-gray-50",
            theme === "blue" ? "hover:bg-teal-50" : "hover:bg-orange-50"
          )
      )}
      aria-label={`Chat thread ${threadId}`}
      onClick={() => !isSelected && setSelectedThreadId(threadId)}
      style={{ cursor: isSelected ? 'default' : 'pointer' }}
    >
      <DashboardCard
        isOpen={isDashboardOpen}
        onCloseAction={() => setIsDashboardOpen(false)}
      />

      <div className="px-1 py-0.5 shadow-sm bg-white flex justify-between items-center h-4">
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isSelected
              ? (theme === "blue" ? 'bg-teal-500' : 'bg-orange-500')
              : 'bg-gray-400'
          )} />
          <h3 className="font-medium text-[8px] leading-none">Chat {threadId}</h3>
        </div>
        {isSelected && (
          <span className={cn(
            "text-[6px] px-1 py-0 rounded-full leading-tight",
            theme === "blue"
              ? 'bg-teal-100 text-teal-800'
              : 'bg-orange-100 text-orange-800'
          )}>
            Selected
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={{
              id: message.id,
              content: message.text,
              sender: message.sender,
              timestamp: String(message.timestamp),
              attachments: message.attachments,
            }}
            theme={theme}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-50 p-0 flex flex-col" style={{ maxHeight: '40px', height: '40px' }}>
        {error && (
          <div className="p-0.5 bg-red-100 text-red-700 text-[6px] rounded-md mb-0 mx-1 flex justify-between items-center">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setError(null);
                }
              }}
              className="ml-0.5 text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <XIcon className="h-1.5 w-1.5" />
            </button>
          </div>
        )}

        {/* Row 1: Attachment bar - First distinct row */}
        <div className="bg-gray-50 flex-none" style={{ height: '10px' }}>
          <AttachmentRow
            attachedFiles={attachedFiles}
            handleRemoveFile={handleRemoveFile}
          />
        </div>

        {/* Row 2: User Input Area - Second distinct row with icons */}
        <div className="bg-gray-50 flex-auto" style={{ height: '20px' }}>
          <InputRow
            onFileClick={() => fileInputRef.current?.click()}
            onDashboardClick={() => setIsDashboardOpen(true)}
            onSubmitMessage={handleSendMessage}
            onClose={onClose}
          />
        </div>

        {/* Row 3: User UI Row - Third distinct row with agent selector */}
        <div className="bg-gray-50 flex-none" style={{ height: '10px' }}>
          <UserUIRow
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            agentNames={AGENT_NAMES[threadId]}
            theme={theme}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />
      </div>
    </div>
  );
}
