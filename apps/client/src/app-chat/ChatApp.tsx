"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useEffect, useState } from "react";
import { type MockThreadId, useAppShellStore } from "../stores/appShellStore";
import type { MessageApi } from "./ChatServiceApi";
import { DashboardCard } from "./components/DashboardCard";
import { HeaderBar } from "./components/HeaderBar";
import { MessageArea } from "./components/MessageArea";
import { UserArea } from "./components/UserArea";
import { MOCK_THREADS } from "./mockData";
import type { DisplayFile } from "./types";

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

  const baseStylingClasses = "relative transition-all text-left"; // Removed flex flex-col, h-full

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={cn(
        baseStylingClasses,
        "grid grid-rows-[auto_1fr_auto] w-full h-full opacity-100 rounded-lg shadow overflow-hidden", // Added grid layout
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

      <HeaderBar
        threadId={threadId}
        isSelected={isSelected}
        theme={theme}
        error={error} // Pass the error state
      />

      <MessageArea
        messages={messages}
        theme={theme}
      // MessageArea should have overflow-y-auto and h-full if it's not already set internally
      // to ensure it scrolls and fills the 1fr space.
      />

      <UserArea
        theme={theme}
        attachedFiles={attachedFiles}
        selectedAgent={selectedAgent}
        agentNames={AGENT_NAMES[threadId]}
        onRemoveFileAction={handleRemoveFile}
        onFileClickAction={() => fileInputRef.current?.click()}
        onDashboardClickAction={() => setIsDashboardOpen(true)}
        onSubmitMessageAction={handleSendMessage}
        onAgentChangeAction={setSelectedAgent}
        onCloseAction={onClose}
        error={error}
        onDismissErrorAction={() => setError(null)}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
    </div>
  );
}
