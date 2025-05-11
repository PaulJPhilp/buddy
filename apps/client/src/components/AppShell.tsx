"use client";

import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Effect, Fiber, Runtime } from "effect";
import React, { useEffect, useState } from "react";
import { Sidebar } from "./app-shell/Sidebar";
import { TopToolbar } from "./app-shell/TopToolbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  useEffect(() => {
    const runtime = Runtime.defaultRuntime;
    const fiber = Runtime.runFork(runtime)(Effect.never);

    return () => {
      Runtime.runPromise(runtime)(
        Effect.gen(function* () {
          yield* Effect.logDebug("Interrupting AppSupervisor");
          yield* Fiber.interrupt(fiber);
        }),
      );
    };
  }, []);

  // Remove all the React.Children manipulation since we're using Zustand for state management
  return (
    <>
      <div className="h-screen w-full flex bg-background overflow-hidden">
        <div
          className={cn(
            "border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-12" : "w-0 hidden"
          )}
        >
          <Sidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <TopToolbar onToggleSidebarAction={toggleSidebar} />

          <div className="flex-1 flex flex-col gap-1 p-1 overflow-hidden max-w-full mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}
