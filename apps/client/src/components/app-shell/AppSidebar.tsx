"use client";

import { useActiveChat } from "@/contexts/ActiveChatContext";
import { useSelectedChat } from "@/contexts/SelectedChatContext";
import { ChatAppColors, ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { darkChatThemeExample as defaultTheme } from "@/features/chat/themes/themeTypes";
import {
  cssToThemeObject,
  themeToCss,
} from "@/features/chat/themes/themeUtils";
import { Sidebar, SidebarSection } from "@ui/components/ui/sidebar";
import { useTheme } from "next-themes";
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
  ["background", "Background"],
  ["foreground", "Text Color"],
  ["primary", "Primary Color"],
  ["secondary", "Secondary Color"],
  ["border", "Border Color"],
  ["userArea", "User Area"],
  ["bubbleUser", "User Bubble"],
  ["bubbleAgent", "Agent Bubble"],
  ["headerBg", "Header Background"],
  ["headerText", "Header Text"],
];

const isValidColor = (color: string) => {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
};

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  const { theme: rawTheme, setTheme } = useTheme();
  const [chatThemes, setChatThemes] = useState<Record<string, any>>({});

  // Parse theme in an effect to avoid infinite loops
  useEffect(() => {
    // Safely parse theme with error handling
    let parsedThemes = {};
    try {
      if (rawTheme) {
        // Handle special theme names like 'system', 'dark', 'light'
        if (
          typeof rawTheme === "string" &&
          !["system", "dark", "light"].includes(rawTheme)
        ) {
          const parsed = JSON.parse(rawTheme);
          // Only update if the theme actually changed
          if (JSON.stringify(parsed) !== JSON.stringify(chatThemes)) {
            parsedThemes = parsed;
            setChatThemes(parsedThemes);
          }
        } else if (
          typeof rawTheme === "object" &&
          JSON.stringify(rawTheme) !== JSON.stringify(chatThemes)
        ) {
          parsedThemes = rawTheme;
          setChatThemes(parsedThemes);
        }
      }
    } catch (error) {
      console.error("Error parsing theme in AppSidebar:", error);
      // Fall back to empty object on parsing error
    }
  }, [rawTheme, chatThemes]); // Compare with previous chatThemes
  const updateChatColor = (themeId: string, key: string, value: string) => {
    // Validate that key is a valid color key
    const validColorKeys = colorKeys.map(([k]) => k);
    if (!validColorKeys.includes(key)) return;
    const updatedTheme = {
      ...chatThemes,
      [themeId]: { ...chatThemes[themeId], [key]: value },
    };
    setTheme(JSON.stringify(updatedTheme));
  };
  const { selectedChatId } = useSelectedChat();
  const { activeChatId } = useActiveChat();
  const [editingColors, setEditingColors] = useState<Record<string, string>>(
    {},
  );
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  // Map chat IDs to their actual theme IDs used in the application
  // The chat IDs (chat1, chat2) come from page.tsx and must match the actual theme IDs used in ThemeContext
  const chatIdToThemeId: Record<string, string> = {
    "chat-1": "chat-1", // Use the actual chat ID as the theme ID
    "chat-2": "chat-2", // Use the actual chat ID as the theme ID
  };

  // Get the effective theme ID based on the active chat (or selected chat as fallback)
  const effectiveThemeId = activeChatId
    ? chatIdToThemeId[activeChatId] || "chat-1"
    : chatIdToThemeId[selectedChatId] || "chat-1";

  // Show a message if no chat is active
  const noActiveChat = !activeChatId;

  const currentColors = chatThemes[effectiveThemeId] || { ...defaultTheme };

  // Initialize the theme if it doesn't exist
  useEffect(() => {
    // Only initialize if chatThemes is not empty (has been parsed)
    // and the effective theme ID doesn't exist yet
    if (Object.keys(chatThemes).length > 0 && !chatThemes[effectiveThemeId]) {
      // Create a complete theme object first
      const newTheme = { ...chatThemes };
      newTheme[effectiveThemeId] = {};

      // Add all default colors
      for (const [key] of colorKeys) {
        newTheme[effectiveThemeId][key] =
          defaultTheme[key as keyof ChatAppColors] || "";
      }

      // Set the theme once with all values
      setTheme(JSON.stringify(newTheme));
    }
  }, [chatThemes, effectiveThemeId, setTheme]);

  // Initialize editing colors once when the component mounts
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (currentColors && Object.keys(editingColors).length === 0) {
      const initialColors: Record<string, string> = {};
      for (const [key, value] of Object.entries(currentColors)) {
        if (value !== undefined && typeof value === "string") {
          initialColors[key] = value;
        }
      }
      setEditingColors(initialColors);
    }
  }, []);

  // This effect is no longer needed as we're using a fixed chat ID
  // and initializing it in the effect above

  const generateThemeCSS = () => {
    const theme = chatThemes[effectiveThemeId] || defaultTheme;
    return `/* Chat Theme CSS */
${themeToCss(theme)}`;
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

        // Parse the CSS file to extract theme colors
        const themeObject = cssToThemeObject(content);
        if (themeObject) {
          // Update theme in context using the effective theme ID
          // First update colors
          if (themeObject.colors) {
            for (const [key, value] of Object.entries(themeObject.colors)) {
              if (typeof value === "string") {
                updateChatColor(effectiveThemeId, key, value);
              }
            }
          }

          // Update other theme properties if needed
          // For borders, bubbles, etc. we would need to map these to the appropriate keys

          // Update local state to reflect the imported theme
          setEditingColors((prevState) => {
            const newState = { ...prevState };
            // Only copy color properties from the theme object
            if (themeObject.colors) {
              for (const [key, value] of Object.entries(themeObject.colors)) {
                if (typeof value === "string") {
                  newState[key] = value;
                }
              }
            }
            return newState;
          });
        }
      } catch (error) {
        console.error("[AppSidebar] Error importing theme:", error);
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
      className={
        isOpen
          ? "w-[200px] sm:w-[200px] lg:w-[200px] border-r h-screen"
          : "w-0 hidden"
      }
      style={{
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
        borderColor: "var(--color-chat-border)",
      }}
    >
      <SidebarSection title="🎨 Theme Colors">
        {noActiveChat ? (
          <div className="p-4 text-sm text-center">
            <p className="mb-2 font-medium">No active chat selected</p>
            <p className="text-xs text-gray-500">
              Click on a chat header to make it active and edit its theme
            </p>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 mb-2 bg-gray-100 rounded text-sm">
              <p className="font-medium">
                Editing:{" "}
                <span className="text-blue-600">
                  {activeChatId === "chat-1"
                    ? "Business Chat"
                    : activeChatId === "chat-2"
                      ? "Social Chat"
                      : `Unknown (${activeChatId || "None"})`}
                </span>
              </p>
            </div>
            <div className="space-y-4 p-2">
              {colorKeys.map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="flex items-center gap-2 mb-2 relative">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
                      style={{
                        backgroundColor:
                          currentColors[key as keyof ChatAppColors] ||
                          "#ffffff",
                      }}
                      onClick={() => setOpenColorPicker(key)}
                    >
                      {openColorPicker === key && (
                        <div
                          className="absolute z-50"
                          style={{ marginTop: "10px", marginLeft: "-100px" }}
                        >
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenColorPicker(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                setOpenColorPicker(null);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          />
                          <div className="relative z-50 shadow-lg rounded-lg overflow-hidden">
                            <ChromePicker
                              color={currentColors[key as keyof ChatAppColors]}
                              onChange={(color) => {
                                updateChatColor(
                                  effectiveThemeId,
                                  key as keyof ChatAppColors,
                                  color.hex,
                                );
                                setEditingColors({
                                  ...editingColors,
                                  [key]: color.hex,
                                });
                              }}
                              disableAlpha
                            />
                          </div>
                        </div>
                      )}
                    </button>
                    <input
                      type="text"
                      value={
                        editingColors[key] !== undefined
                          ? editingColors[key]
                          : currentColors[key as keyof ChatAppColors] || ""
                      }
                      onChange={(e) => {
                        setEditingColors({
                          ...editingColors,
                          [key]: e.target.value,
                        });
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (isValidColor(value)) {
                          updateChatColor(
                            effectiveThemeId,
                            key as keyof ChatAppColors,
                            value,
                          );
                        } else {
                          setEditingColors({
                            ...editingColors,
                            [key]:
                              currentColors[key as keyof ChatAppColors] || "",
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value;
                          if (isValidColor(value)) {
                            updateChatColor(
                              effectiveThemeId,
                              key as keyof ChatAppColors,
                              value,
                            );
                          } else {
                            setEditingColors({
                              ...editingColors,
                              [key]:
                                currentColors[key as keyof ChatAppColors] || "",
                            });
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
            <p className="text-xs text-gray-500">
              Select an active chat to use theme tools
            </p>
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
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: currentColors.primary }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: currentColors.secondary }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: currentColors.bubbleUser }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: currentColors.bubbleAgent }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeChatId
                  ? `Editing active chat: ${activeChatId === "chat1" ? "Business Chat" : "Social Chat"}`
                  : "No active chat"}
              </div>
            </div>
          </div>
        )}
      </SidebarSection>
    </Sidebar>
  );
}
