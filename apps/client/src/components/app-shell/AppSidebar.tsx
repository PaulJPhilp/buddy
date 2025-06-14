"use client";

import { ThemeEditorPanel } from "@/components/theme-editor";
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
    if (chatAppContext?.activeChatAppConfig) {
      editorContent = (
        <ThemeEditorPanel
          theme={chatAppContext.activeChatAppConfig.theme}
          onThemeChange={chatAppContext.onThemeChange}
          isOpen={true}
          onClose={() =>
            appLayoutStore.send({
              type: "setActiveSidebarEditor",
              editor: null,
            })
          }
        />
      );
    } else {
      editorContent = (
        <div className="p-4 text-center text-muted-foreground">
          <p className="mb-2">No chat app active</p>
          <p className="text-sm">
            The theme editor requires an active chat app to edit themes.
          </p>
        </div>
      );
    }
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
