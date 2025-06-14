"use client";

import { ClerkAdminPanel } from "@/components/clerk-admin";
import { DebugTool } from "@/components/debug-tool";
import { ErrorManager } from "@/components/error-manager";
import { SidebarTool } from "@/components/sidebar-tool";

import { Toolbar, getToolbarConfig } from "@/components/toolbar";
import { useDynamicToolbar } from "@/hooks/dynamic-toolbar";
import { appLayoutStore } from "@/stores/appLayoutStore";
import { clerkAdminStore } from "@/stores/clerkAdminStore";
import { debugToolStore } from "@/stores/debugToolStore";
import { errorManagerStore } from "@/stores/errorManagerStore";
import { sidebarToolStore } from "@/stores/sidebarToolStore";

import { useSelector } from "@xstate/store/react";
import React from "react";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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

  const clerkAdminPanelIsOpen = useSelector(
    clerkAdminStore,
    (state) => state.context.isPanelOpen,
  );
  const sidebarToolIsOpen = useSelector(
    sidebarToolStore,
    (state) => state.context.isOpen,
  );
  const errorManagerIsOpen = useSelector(
    errorManagerStore,
    (state) => state.context.isOpen,
  );
  const debugToolIsOpen = useSelector(
    debugToolStore,
    (state) => state.context.isOpen,
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
          {/* Clerk Admin Panel positioned at top, pushes content down */}
          {clerkAdminPanelIsOpen && (
            <div className="h-[450px] border-b">
              <ClerkAdminPanel
                isOpen={clerkAdminPanelIsOpen}
                onClose={() => clerkAdminStore.send({ type: "close" })}
              />
            </div>
          )}

          {/* Error Manager positioned at top, pushes content down */}
          {errorManagerIsOpen && (
            <div className="h-[400px] border-b">
              <ErrorManager
                isOpen={errorManagerIsOpen}
                onClose={() => errorManagerStore.send({ type: "close" })}
              />
            </div>
          )}

          {/* Debug Tool positioned at top, pushes content down */}
          {debugToolIsOpen && (
            <div className="h-[500px] border-b">
              <DebugTool
                isOpen={debugToolIsOpen}
                onClose={() => debugToolStore.send({ type: "close" })}
              />
            </div>
          )}

          {/* Sidebar Tool positioned at top, pushes content down */}
          {sidebarToolIsOpen && (
            <div className="h-[400px] border-b">
              <SidebarTool
                isOpen={sidebarToolIsOpen}
                onClose={() => sidebarToolStore.send({ type: "close" })}
              />
            </div>
          )}

          <div className="flex-1 h-full flex flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
