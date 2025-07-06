"use client";

import { useWorkspaceLoadingState } from "@/hooks/useWorkspace";
import { UserButton } from "@clerk/nextjs";
import React, { useState } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { MenuIcon } from "../ui/icons";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isLoading = useWorkspaceLoadingState();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log("[AppShell] isSidebarOpen:", isSidebarOpen);

  const handleToggle = () => {
    console.log("[AppShell] Menu button clicked, toggling sidebar");
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar isOpen={isSidebarOpen} />
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <header className="flex h-6 items-center gap-3 border-b bg-muted/40 px-4">
          <button
            type="button"
            onClick={handleToggle}
            className="shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <ClientOnly>
              <MenuIcon className="h-4 w-4" />
            </ClientOnly>
            <span className="sr-only">Toggle navigation menu</span>
          </button>
          <div className="flex-1">{/* Can add title here */}</div>
          <div className="scale-75">
            <ClientOnly>
              <UserButton afterSignOutUrl="/" />
            </ClientOnly>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>Loading workspace...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
