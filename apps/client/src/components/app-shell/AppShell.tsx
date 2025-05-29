"use client";

import React, { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppToolbar } from "./AppToolbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  function toggleSidebar() {
    setIsSidebarOpen((open) => !open);
  }

  return (
    <div className="h-screen w-full flex bg-background">
      <AppSidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
      <main className="flex-1 flex flex-col" id="main-content">
        <AppToolbar onToggleSidebarAction={toggleSidebar} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
} 