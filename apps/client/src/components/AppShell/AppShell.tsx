"use client";

import { Toolbar, getToolbarConfig } from "@/components/Toolbar";
import { useDynamicToolbar } from "@/hooks/dynamic-toolbar";
import { appLayoutStore } from "@/stores/appLayoutStore";

import { useLlmWorkspaceBridge } from "@/workspace-llm/client/useLlmWorkspaceBridge";
import { useSelector } from "@xstate/store/react";
import React from "react";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Mount the LLM → Workspace WebSocket bridge once for the entire app.
  useLlmWorkspaceBridge();

  // Get layout state from stores

  // Use useSelector consistently for all stores to ensure reactivity
  const isSidebarOpen = useSelector(
    appLayoutStore,
    (state) => state.context.isSidebarOpen,
  );
  const isMobile = useSelector(
    appLayoutStore,
    (state) => state.context.isMobile,
  );

  // Get dynamic toolbar configuration with active states
  const baseConfig = getToolbarConfig(isMobile);
  const toolbarConfig = useDynamicToolbar(baseConfig);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Main toolbar at the top */}
      <Toolbar config={toolbarConfig} />

      {/* Main content area with sidebar */}
      <div className="flex-1 flex relative">
        <AppSidebar
          isOpen={isSidebarOpen}
          onToggleAction={() => {}} // Toolbar handles this now
        />
        <main
          className="flex-1 flex flex-col h-full relative"
          id="main-content"
        >
          {/* Sidebar Tool positioned at top, pushes content down */}

          <div className="flex-1 h-full flex flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
