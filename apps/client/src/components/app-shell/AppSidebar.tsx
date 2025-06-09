"use client";

import { useThemeCSSVariables } from "@/stores/themeStore";
import { Sidebar, SidebarSection } from "@ui/components/ui/sidebar";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  const cssVariables = useThemeCSSVariables();

  return (
    <Sidebar
      isCollapsed={!isOpen}
      onToggle={onToggleAction}
      expandedWidth="200px"
      collapsedWidth="0px"
      className={
        isOpen
          ? "w-[200px] sm:w-[200px] lg:w-[200px] border-r h-screen"
          : "w-0 hidden"
      }
      style={cssVariables}
    >
      <SidebarSection title="🧭 Navigation">
        <div className="p-4 text-sm">
          <p className="mb-2 font-medium">App Navigation</p>
          <div className="space-y-2">
            <button type="button" className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent">
              Dashboard
            </button>
            <button type="button" className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent">
              Chats
            </button>
            <button type="button" className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent">
              Settings
            </button>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="ℹ️ Info">
        <div className="p-4 text-sm">
          <p className="text-xs text-muted-foreground mb-2">
            Use the toolbar to access:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Theme Editor (Palette icon)</li>
            <li>• User Management (Users icon)</li>
            <li>• Settings (Gear icon)</li>
          </ul>
        </div>
      </SidebarSection>
    </Sidebar>
  );
}
