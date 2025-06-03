"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useSelectedChat } from "@/hooks/useSelectedChat";
import React, { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppToolbar } from "./AppToolbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { getChatStyle } = useTheme();
  // Always use shell theme for AppShell
  const themeStyles = getChatStyle('shell');

  function toggleSidebar() {
    setIsSidebarOpen((open) => !open);
  }
  
  return (
    <div
      className="h-screen w-full flex"
      style={{
        ...themeStyles,
        backgroundColor: 'var(--color-chat-background)',
        color: 'var(--color-chat-foreground)'
      }}
    >
      <AppSidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
      <main 
        className="flex-1 flex flex-col" 
        id="main-content"
        style={{
          backgroundColor: 'var(--color-chat-background)',
          color: 'var(--color-chat-foreground)'
        }}
      >
        <AppToolbar onToggleSidebarAction={toggleSidebar} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
} 