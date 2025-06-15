"use client";

// ThemeEditorPanel removed with theme system
import { useChatAppContext } from "@/contexts/ChatAppContext";
import { appLayoutStore } from "@/stores/appLayoutStore";

import { Sidebar } from "@ui/components/ui/sidebar";
import { useSelector } from "@xstate/store/react";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  const activeSidebarEditor = useSelector(
    appLayoutStore,
    (state) => state.context.activeSidebarEditor,
  );

  // Get chat app context (may be null if no chat app is active)
  let chatAppContext = null;
  try {
    chatAppContext = useChatAppContext();
  } catch {
    // Context not available, which is fine
  }

  let editorContent: React.ReactNode = null;
  if (activeSidebarEditor === "theme") {
    editorContent = (
      <div className="p-4 text-center text-muted-foreground">
        <p className="mb-2">Theme Editor Removed</p>
        <p className="text-sm">
          The theme editor has been removed as part of the bootstrap system
          cleanup.
        </p>
      </div>
    );
  }
  // Add more editors here as needed

  // Determine sidebar width based on content
  const sidebarWidth = activeSidebarEditor === "theme" ? "400px" : "200px";

  // Only show sidebar if there's an active editor
  const shouldShowSidebar = isOpen && activeSidebarEditor;

  return (
    <Sidebar
      isCollapsed={!shouldShowSidebar}
      onToggle={onToggleAction}
      expandedWidth={sidebarWidth}
      collapsedWidth="0px"
      className={shouldShowSidebar ? "border-r h-screen" : "w-0 hidden"}
      style={{
        width: shouldShowSidebar ? sidebarWidth : "0px",
      }}
    >
      {editorContent}
    </Sidebar>
  );
}
