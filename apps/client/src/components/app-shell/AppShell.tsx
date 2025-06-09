"use client";

import { ClerkAdminPanel } from "@/components/clerk-admin";
import { DebugTool } from "@/components/debug-tool";
import { ErrorManager } from "@/components/error-manager";
import { SidebarTool } from "@/components/sidebar-tool";
import { ThemeEditorPanel } from "@/components/theme-editor";
import { Toolbar, getToolbarConfig } from "@/components/toolbar";
import { useDynamicToolbar } from "@/hooks/useDynamicToolbar";
import { useThemeIntegration } from "@/hooks/useThemeIntegration";
import { appLayoutStore } from "@/stores/appLayoutStore";
import { clerkAdminStore } from "@/stores/clerkAdminStore";
import { debugToolStore } from "@/stores/debugToolStore";
import { errorManagerStore } from "@/stores/errorManagerStore";
import { sidebarToolStore } from "@/stores/sidebarToolStore";
import { themeStore, useThemeCSSVariables } from "@/stores/themeStore";
import { useSelector } from "@xstate/store/react";
import React from "react";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Integrate with next-themes
  useThemeIntegration();

  // Get processed theme and layout state from stores
  const cssVariables = useThemeCSSVariables();
  
  // Use useSelector consistently for all stores to ensure reactivity
  const isSidebarOpen = useSelector(appLayoutStore, (state) => state.context.isSidebarOpen);
  const isMobile = useSelector(appLayoutStore, (state) => state.context.isMobile);
  const themeEditorIsOpen = useSelector(themeStore, (state) => state.context.isEditorOpen);
  const clerkAdminPanelIsOpen = useSelector(clerkAdminStore, (state) => state.context.isPanelOpen);
  const sidebarToolIsOpen = useSelector(sidebarToolStore, (state) => state.context.isOpen);
  const errorManagerIsOpen = useSelector(errorManagerStore, (state) => state.context.isOpen);
  const debugToolIsOpen = useSelector(debugToolStore, (state) => state.context.isOpen);

  // Get dynamic toolbar configuration with active states
  const baseConfig = getToolbarConfig(isMobile);
  const toolbarConfig = useDynamicToolbar(baseConfig);

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={cssVariables}
    >
      {/* Main toolbar at the top */}
      <Toolbar config={toolbarConfig} />

      {/* Main content area with sidebar */}
      <div className="flex-1 flex relative">
        <AppSidebar
          isOpen={isSidebarOpen}
          onToggleAction={() => { }} // Toolbar handles this now
        />
        <main
          className="flex-1 flex flex-col relative"
          id="main-content"
        >
          {/* Clerk Admin Panel positioned at top, pushes content down */}
          {clerkAdminPanelIsOpen && (
            <div className="h-[450px] border-b">
              <ClerkAdminPanel
                isOpen={clerkAdminPanelIsOpen}
                onClose={() => clerkAdminStore.send({ type: 'close' })}
              />
            </div>
          )}

          {/* Error Manager positioned at top, pushes content down */}
          {errorManagerIsOpen && (
            <div className="h-[400px] border-b">
              <ErrorManager
                isOpen={errorManagerIsOpen}
                onClose={() => errorManagerStore.send({ type: 'close' })}
              />
            </div>
          )}

          {/* Debug Tool positioned at top, pushes content down */}
          {debugToolIsOpen && (
            <div className="h-[500px] border-b">
              <DebugTool
                isOpen={debugToolIsOpen}
                onClose={() => debugToolStore.send({ type: 'close' })}
              />
            </div>
          )}

          {/* Sidebar Tool positioned at top, pushes content down */}
          {sidebarToolIsOpen && (
            <div className="h-[400px] border-b">
              <SidebarTool
                isOpen={sidebarToolIsOpen}
                onClose={() => sidebarToolStore.send({ type: 'close' })}
              />
            </div>
          )}

          {/* Theme Editor Panel positioned at top, pushes content down */}
          {themeEditorIsOpen && (
            <div className="h-[400px] border-b">
              <ThemeEditorPanel
                isOpen={themeEditorIsOpen}
                onClose={() => themeStore.send({ type: 'closeEditor' })}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
