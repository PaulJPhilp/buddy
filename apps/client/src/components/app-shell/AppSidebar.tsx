"use client";

import { useActiveChat } from "@/contexts/ActiveChatContext";
import { useSelectedChat } from "@/contexts/SelectedChatContext";
import { ThemeColors, defaultTheme, useTheme } from "@/contexts/ThemeContext";
import { cssToThemeColors, themeColorsToCss } from "@/features/chat/themes/themeUtils";
import { Sidebar, SidebarSection } from "@ui/components/ui/sidebar";
import { useEffect, useState } from "react";
import { ChromePicker } from "react-color";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

interface ColorInputState {
  [key: string]: string;
}

const colorKeys = [
  ['background', 'Background'],
  ['foreground', 'Text Color'],
  ['primary', 'Primary Color'],
  ['secondary', 'Secondary Color'],
  ['border', 'Border Color'],
  ['userArea', 'User Area'],
  ['bubbleUser', 'User Bubble'],
  ['bubbleAgent', 'Agent Bubble'],
  ['headerBg', 'Header Background'],
  ['headerText', 'Header Text']
];

const isValidColor = (color: string) => {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
};

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  const { chatThemes, updateChatColor } = useTheme();
  const { selectedChatId } = useSelectedChat();
  const { activeChatId } = useActiveChat();
  const [editingColors, setEditingColors] = useState<Record<string, string>>({});
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  // Map chat IDs to their actual theme IDs used in the application
  // The chat IDs (chat1, chat2) come from page.tsx and must match the actual theme IDs used in ThemeContext
  const chatIdToThemeId: Record<string, string> = {
    'chat-1': 'chat-1', // Use the actual chat ID as the theme ID
    'chat-2': 'chat-2'  // Use the actual chat ID as the theme ID
  };

  // Get the effective theme ID based on the active chat (or selected chat as fallback)
  const effectiveThemeId = activeChatId ?
    (chatIdToThemeId[activeChatId] || 'chat-1') :
    (chatIdToThemeId[selectedChatId] || 'chat-1');

  // Show a message if no chat is active
  const noActiveChat = !activeChatId;

  const currentColors = chatThemes[effectiveThemeId] || { ...defaultTheme };

  // Initialize the theme if it doesn't exist
  useEffect(() => {
    if (!chatThemes[effectiveThemeId]) {
      // Initialize with default theme
      for (const [key, value] of Object.entries(defaultTheme)) {
        updateChatColor(effectiveThemeId, key as keyof ThemeColors, value)
      }
    }
  }, [chatThemes, updateChatColor, effectiveThemeId])

  useEffect(() => {
    if (currentColors) {
      setEditingColors(prevState => {
        const newState = { ...prevState }
        for (const [key, value] of Object.entries(currentColors)) {
          if (!(key in newState) && value !== undefined) {
            newState[key] = value
          }
        }
        return newState
      })
    }
  }, [currentColors])

  // This effect is no longer needed as we're using a fixed chat ID
  // and initializing it in the effect above

  const generateThemeCSS = () => {
    const colors = chatThemes[effectiveThemeId] || defaultTheme;
    return `/* Chat Theme CSS */
${themeColorsToCss(colors)}`;
  };

  const exportTheme = () => {
    const themeCSS = generateThemeCSS();
    const blob = new Blob([themeCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-theme.css";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Try to parse the CSS variables from the imported file
        const content = reader.result as string;

        // Use our utility function to convert CSS to ThemeColors
        const themeColors = cssToThemeColors(content);

        if (!themeColors) {
          console.error('[AppSidebar] Could not parse theme from CSS file');
          return;
        }
        // Update theme in context using the effective theme ID
        for (const [key, value] of Object.entries(themeColors)) {
          updateChatColor(effectiveThemeId, key as keyof ThemeColors, value)
        }

        // Update local state to reflect the imported theme
        setEditingColors(prevState => ({
          ...prevState,
          ...Object.entries(themeColors).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>)
        }));
      } catch (error) {
        console.error('[AppSidebar] Error importing theme:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Sidebar
      isCollapsed={!isOpen}
      onToggle={onToggleAction}
      expandedWidth="200px"
      collapsedWidth="0px"
      className={isOpen ? "w-[200px] sm:w-[200px] lg:w-[200px] border-r h-screen" : "w-0 hidden"}
      style={{
        backgroundColor: 'var(--color-chat-background)',
        color: 'var(--color-chat-foreground)',
        borderColor: 'var(--color-chat-border)'
      }}
    >
      <SidebarSection title="🎨 Theme Colors">
        {noActiveChat ? (
          <div className="p-4 text-sm text-center">
            <p className="mb-2 font-medium">No active chat selected</p>
            <p className="text-xs text-gray-500">Click on a chat header to make it active and edit its theme</p>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 mb-2 bg-gray-100 rounded text-sm">
              <p className="font-medium">Editing: <span className="text-blue-600">{activeChatId === 'chat-1' ? 'Business Chat' : (activeChatId === 'chat-2' ? 'Social Chat' : `Unknown (${activeChatId || 'None'})`)}</span></p>
            </div>
            <div className="space-y-4 p-2">
              {colorKeys.map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="flex items-center gap-2 mb-2 relative">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
                      style={{ backgroundColor: currentColors[key as keyof ThemeColors] || '#ffffff' }}
                      onClick={() => setOpenColorPicker(key)}
                    >
                      {openColorPicker === key && (
                        <div className="absolute z-50" style={{ marginTop: '10px', marginLeft: '-100px' }}>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenColorPicker(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                setOpenColorPicker(null);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          />
                          <div className="relative z-50 shadow-lg rounded-lg overflow-hidden">
                            <ChromePicker
                              color={currentColors[key as keyof ThemeColors]}
                              onChange={(color) => {
                                updateChatColor(effectiveThemeId, key as keyof ThemeColors, color.hex);
                                setEditingColors({ ...editingColors, [key]: color.hex });
                              }}
                              disableAlpha
                            />
                          </div>
                        </div>
                      )}
                    </button>
                    <input
                      type="text"
                      value={editingColors[key] !== undefined ? editingColors[key] : currentColors[key as keyof ThemeColors] || ''}
                      onChange={(e) => {
                        setEditingColors({ ...editingColors, [key]: e.target.value });
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (isValidColor(value)) {
                          updateChatColor(effectiveThemeId, key as keyof ThemeColors, value);
                        } else {
                          setEditingColors({ ...editingColors, [key]: currentColors[key as keyof ThemeColors] || '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value;
                          if (isValidColor(value)) {
                            updateChatColor(effectiveThemeId, key as keyof ThemeColors, value);
                          } else {
                            setEditingColors({ ...editingColors, [key]: currentColors[key as keyof ThemeColors] || '' });
                          }
                          e.currentTarget.blur();
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs rounded border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SidebarSection>

      <SidebarSection title="🔧️ Theme Tools">
        {noActiveChat ? (
          <div className="p-4 text-sm text-center">
            <p className="text-xs text-gray-500">Select an active chat to use theme tools</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            <button
              type="button"
              onClick={exportTheme}
              className="w-full px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Export CSS
            </button>
            <label className="block">
              <span className="sr-only">Import Theme</span>
              <input
                type="file"
                onChange={importTheme}
                accept=".css"
                className="w-full text-xs file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </label>
            <div className="mt-4 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium mb-2">Theme Preview</div>
              <div className="flex flex-col space-y-1">
                <div className="h-2 rounded" style={{ backgroundColor: currentColors.primary }} />
                <div className="h-2 rounded" style={{ backgroundColor: currentColors.secondary }} />
                <div className="h-2 rounded" style={{ backgroundColor: currentColors.bubbleUser }} />
                <div className="h-2 rounded" style={{ backgroundColor: currentColors.bubbleAgent }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeChatId ? `Editing active chat: ${activeChatId === 'chat1' ? 'Business Chat' : 'Social Chat'}` : 'No active chat'}
              </div>
            </div>
          </div>
        )}
      </SidebarSection>
    </Sidebar >
  );
}
