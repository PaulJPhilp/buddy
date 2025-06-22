"use client";

import {
  useAppLayoutActions,
  useAppLayoutStore,
} from "@/stores/appLayoutStore";
import { useWorkspaceLoader } from "@/workspace/useWorkspace";
import { UserButton } from "@clerk/nextjs";
import React from "react";
import { MenuIcon } from "../ui/icons";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Initialize workspace loading
  useWorkspaceLoader();

  const { send } = useAppLayoutActions();
  const { isSidebarOpen } = useAppLayoutStore((s) => ({
    isSidebarOpen: s.isSidebarOpen,
  }));

  const handleToggleSidebar = () => {
    send({ type: "toggleSidebar" });
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          isSidebarOpen ? "ml-[100px]" : "ml-0"
        }`}
      >
        <header className="flex h-6 items-center gap-3 border-b bg-muted/40 px-4">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <MenuIcon className="h-4 w-4" />
            <span className="sr-only">Toggle navigation menu</span>
          </button>
          <div className="flex-1">{/* Can add title here */}</div>
          <div className="scale-75">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
