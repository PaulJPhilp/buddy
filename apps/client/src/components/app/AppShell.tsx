"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import React, { useState } from "react";
import { WorkspaceUI } from "../workspace";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children?: React.ReactNode;
  isLoading?: boolean;
}

export function AppShell({ children, isLoading = false }: AppShellProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AppSidebar isOpen={isSidebarOpen} />
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          isSidebarOpen ? "ml-40" : "ml-0"
        }`}
      >
        {/* Header/Toolbar */}
        <header className="flex h-6 items-center gap-1 border-b bg-white shadow-sm px-1">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="shrink-0 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-1.5 w-1.5 text-gray-600" />
          </button>
          <div className="flex-1 flex items-center gap-1">
            <h4 className="text-xs font-semibold text-gray-900">
              Buddy Chat App
            </h4>
          </div>
          <div className="flex items-center gap-1">
            {isLoaded &&
              (isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="text-xs bg-blue-600 text-white px-1 py-0.25 rounded hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
              ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            <WorkspaceUI />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
