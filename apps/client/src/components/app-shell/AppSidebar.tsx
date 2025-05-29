"use client";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { Sidebar, SidebarSection } from "@ui/components/ui/sidebar";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  const { customColors } = useTheme();

  const exportTheme = () => {
    const themeCSS = `/* Custom Chat Theme */
[data-chat-theme="custom"] {
  --color-chat-background: ${customColors.background};
  --color-chat-foreground: ${customColors.foreground};
  --color-chat-primary: ${customColors.primary};
  --color-chat-secondary: ${customColors.secondary};
  --color-chat-border: ${customColors.border};
  --color-chat-user-area: ${customColors.userArea};
  --color-chat-bubble-user: ${customColors.bubbleUser};
  --color-chat-bubble-agent: ${customColors.bubbleAgent};
  --color-chat-header-bg: ${customColors.headerBg};
  --color-chat-header-text: ${customColors.headerText};
}`;

    navigator.clipboard.writeText(themeCSS);
    alert("Theme CSS copied to clipboard!");
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          // We would need to add setCustomColors to the context, or handle this differently
          // For now, let's alert that this feature needs the context to be updated
          alert("Import functionality needs to be connected to context");
        } catch (error) {
          alert("Invalid theme file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Sidebar
      isCollapsed={!isOpen}
      onToggle={onToggleAction}
      expandedWidth={"200px"}
      collapsedWidth={"0px"}
      className={isOpen ? "w-[200px] sm:w-[200px] lg:w-[200px] border-r bg-muted/40" : "w-0 hidden"}
    >
      <ThemeSelector />

      <SidebarSection title="🛠️ Theme Tools">
        <div className="space-y-2 p-2">
          <button
            type="button"
            onClick={exportTheme}
            className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            📋 Export CSS
          </button>
          <label className="block w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer text-center">
            📁 Import Theme
            <input
              type="file"
              accept=".json"
              onChange={importTheme}
              className="hidden"
            />
          </label>
        </div>
      </SidebarSection>
    </Sidebar>
  );
}
