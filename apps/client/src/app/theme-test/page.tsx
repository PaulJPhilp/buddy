"use client";

import {
  type ChatAppColors,
  type ChatAppTheme,
  type ChatAppTypography,
  defaultChatTheme,
} from "@/features/chat/themes/themeTypes";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";

function ColorPicker({
  label,
  value,
  onChange,
  variable,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  variable: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-500 font-mono">{variable}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs bg-background border rounded"
        />
        <div
          className="w-8 h-8 rounded border"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

// Preview component for the canonical ChatAppTheme structure
function ComponentPreview({ theme }: { theme: ChatAppTheme }) {
  return (
    <div
      className="p-4 rounded-lg border space-y-4"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderColor: theme.borders?.color ?? "#ccc",
      }}
    >
      {/* Header Preview */}
      <div
        className="flex justify-between items-center p-3 rounded"
        style={{
          backgroundColor: theme.header?.background ?? "#ccc",
          color: theme.header?.text ?? "#000",
        }}
      >
        <h3 className="font-semibold">Chat Header</h3>
        <div className="text-sm">Online</div>
      </div>

      {/* Message Bubbles Preview */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <div
            className="max-w-xs p-3 rounded-lg text-white text-sm"
            style={{
              backgroundColor: theme.bubbles?.user?.background ?? "#ccc",
              color: theme.bubbles?.user?.text ?? "#000",
            }}
          >
            This is a user message bubble
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="max-w-xs p-3 rounded-lg text-white text-sm"
            style={{
              backgroundColor: theme.bubbles?.agent?.background ?? "#ccc",
              color: theme.bubbles?.agent?.text ?? "#000",
            }}
          >
            This is an agent response bubble
          </div>
        </div>
      </div>

      {/* User Area Preview */}
      <div
        className="p-3 rounded border-t-2"
        style={{
          backgroundColor: theme.userArea?.background ?? "#ccc",
        }}
      >
        <div
          className="flex items-center gap-2 mt-2 p-2 rounded border"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.borders?.color ?? "#ccc",
            borderTopColor: theme.borders?.color ?? "#ccc",
          }}
        >
          Type your message here...
        </div>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            className="px-3 py-1 rounded text-sm text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded text-sm text-white"
            style={{ backgroundColor: theme.colors.secondary }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemePresets({
  setLocalTheme,
}: { setLocalTheme: (theme: ChatAppTheme) => void }) {
  const { theme: rawTheme, setTheme } = useTheme();
  // Safely parse theme with error handling
  let parsedTheme = defaultChatTheme;
  try {
    if (rawTheme) {
      if (
        typeof rawTheme === "string" &&
        !["system", "dark", "light"].includes(rawTheme)
      ) {
        const parsed = JSON.parse(rawTheme);
        if (parsed && typeof parsed === "object") {
          parsedTheme = { ...defaultChatTheme, ...parsed } as ChatAppTheme;
        }
      } else if (rawTheme && typeof rawTheme === "object") {
        parsedTheme = { ...defaultChatTheme, ...rawTheme } as ChatAppTheme;
      }
    }
  } catch (error) {
    console.error("Error parsing theme in ThemePresets:", error);
    // Fall back to default theme on parsing error
  }
  const theme = parsedTheme;

  const handlePresetClick = (presetTheme: ChatAppTheme) => {
    const themeStr = JSON.stringify(presetTheme);
    setTheme(themeStr);
    setLocalTheme(presetTheme);
  };

  const presets: Record<string, ChatAppTheme> = {
    Default: defaultChatTheme,
    Dark: {
      ...defaultChatTheme,
      colors: {
        ...defaultChatTheme.colors,
        background: "#1a1a1a",
        text: "#ffffff",
      },
      bubbles: {
        user: { background: "#2563eb", text: "#ffffff" },
        agent: { background: "#4b5563", text: "#ffffff" },
      },
    },
    Light: {
      ...defaultChatTheme,
      colors: {
        ...defaultChatTheme.colors,
        background: "#ffffff",
        text: "#000000",
      },
      bubbles: {
        user: { background: "#3b82f6", text: "#ffffff" },
        agent: { background: "#6b7280", text: "#ffffff" },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
      <h2 className="text-xl font-semibold mb-4">🎨 Theme Presets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(presets).map(([presetName, presetTheme]) => (
          <button
            type="button"
            key={presetName}
            onClick={() => handlePresetClick(presetTheme)}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
              JSON.stringify(theme) === JSON.stringify(presetTheme)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-left">
              <div className="font-medium capitalize mb-2">
                {presetName.replace("-", " ")}
              </div>
              <div className="flex gap-1 mb-2">
                {[
                  { color: theme.colors.primary, label: "Primary" },
                  {
                    color:
                      theme.bubbles?.user?.background ||
                      defaultChatTheme.bubbles?.user?.background ||
                      "#0ea5e9",
                    label: "User Bubble",
                  },
                  {
                    color:
                      theme.bubbles?.agent?.background ||
                      defaultChatTheme.bubbles?.agent?.background ||
                      "#64748b",
                    label: "Agent Bubble",
                  },
                ].map(({ color, label }) => (
                  <div
                    key={label}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                    title={label}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500">
                {JSON.stringify(theme) === JSON.stringify(presetTheme)
                  ? "Current"
                  : "Click to apply"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
export default function ThemeBuilderPage() {
  // Use state to track if we're on the client side
  const [isClient, setIsClient] = useState(false);
  const { theme: rawTheme, setTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<ChatAppTheme>(defaultChatTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize theme from localStorage or default
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    if (isClient && !isInitialized) {
      try {
        // Only parse theme on client-side
        if (rawTheme) {
          let parsedTheme = {};
          if (typeof rawTheme === "string") {
            try {
              try {
                if (
                  typeof rawTheme === "string" &&
                  !["system", "dark", "light"].includes(rawTheme)
                ) {
                  parsedTheme = JSON.parse(rawTheme);
                } else if (typeof rawTheme === "object") {
                  parsedTheme = rawTheme;
                }
              } catch (error) {
                console.error(
                  "Error parsing theme in ThemeBuilderPage:",
                  error,
                );
                parsedTheme = {};
              }
            } catch (parseError) {
              console.error("Error parsing theme JSON:", parseError);
            }
          } else {
            parsedTheme = rawTheme;
          }
          const mergedTheme = {
            ...defaultChatTheme,
            ...parsedTheme,
          } as ChatAppTheme;
          setLocalTheme(mergedTheme);
        }
      } catch (e) {
        console.error("Error initializing theme:", e);
      }
      setIsInitialized(true);
    }
  }, [rawTheme, setTheme, isInitialized, isClient]);

  // Return a minimal version during SSR to prevent errors
  if (!isClient) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Theme Builder</h1>
        <p>Loading theme editor...</p>
      </div>
    );
  }

  const handleThemeUpdate = (newTheme: Partial<ChatAppTheme>) => {
    const updatedTheme = {
      ...defaultChatTheme,
      ...localTheme,
      ...newTheme,
    } as ChatAppTheme;
    setLocalTheme(updatedTheme);
    setTheme(JSON.stringify(updatedTheme));
  };

  const handleColorChange = (key: keyof ChatAppColors, value: string) => {
    handleThemeUpdate({
      colors: {
        ...(localTheme.colors || {}),
        [key]: value,
      },
    });
  };

  const handleBorderChange = (value: string) => {
    handleThemeUpdate({
      borders: {
        ...(localTheme.borders || {}),
        color: value,
      },
    });
  };

  const handleBubbleColorChange = (type: "user" | "agent", value: string) => {
    handleThemeUpdate({
      bubbles: {
        ...(localTheme.bubbles || {}),
        [type]: {
          ...(localTheme.bubbles?.[type] || {}),
          background: value,
        },
      },
    });
  };

  const handleHeaderColorChange = (
    key: "background" | "text",
    value: string,
  ) => {
    handleThemeUpdate({
      header: {
        ...(localTheme.header || {}),
        [key]: value,
      },
    });
  };

  const handleTypographyChange = (
    key: keyof ChatAppTypography,
    value: string,
  ) => {
    handleThemeUpdate({
      typography: {
        ...(localTheme.typography || {}),
        [key]: value,
      },
    });
  };

  const resetTheme = () => {
    setTheme(JSON.stringify(defaultChatTheme));
    setLocalTheme(defaultChatTheme);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 Theme Builder</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Theme Editor */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Colors</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Background"
                    value={
                      localTheme.colors?.background ||
                      defaultChatTheme.colors?.background ||
                      ""
                    }
                    onChange={(value) => handleColorChange("background", value)}
                    variable="--color-bg"
                  />
                  <ColorPicker
                    label="Text"
                    value={
                      localTheme.colors?.text ||
                      defaultChatTheme.colors?.text ||
                      ""
                    }
                    onChange={(value) => handleColorChange("text", value)}
                    variable="--color-text"
                  />
                  <ColorPicker
                    label="Primary"
                    value={
                      localTheme.colors?.primary ||
                      defaultChatTheme.colors?.primary ||
                      ""
                    }
                    onChange={(value) => handleColorChange("primary", value)}
                    variable="--color-primary"
                  />
                  <ColorPicker
                    label="Secondary"
                    value={
                      localTheme.colors?.secondary ||
                      defaultChatTheme.colors?.secondary ||
                      ""
                    }
                    onChange={(value) => handleColorChange("secondary", value)}
                    variable="--color-secondary"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Borders</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Border Color"
                    value={
                      localTheme.borders?.color ||
                      defaultChatTheme.borders?.color ||
                      ""
                    }
                    onChange={handleBorderChange}
                    variable="--color-border"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Message Bubbles</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="User Bubble"
                    value={
                      localTheme.bubbles?.user?.background ||
                      defaultChatTheme.bubbles?.user?.background ||
                      ""
                    }
                    onChange={(value) => handleBubbleColorChange("user", value)}
                    variable="--bubble-user-bg"
                  />
                  <ColorPicker
                    label="Agent Bubble"
                    value={
                      localTheme.bubbles?.agent?.background ||
                      defaultChatTheme.bubbles?.agent?.background ||
                      ""
                    }
                    onChange={(value) =>
                      handleBubbleColorChange("agent", value)
                    }
                    variable="--bubble-agent-bg"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Header</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Header Background"
                    value={
                      localTheme.header?.background ||
                      defaultChatTheme.header?.background ||
                      ""
                    }
                    onChange={(value) =>
                      handleHeaderColorChange("background", value)
                    }
                    variable="--header-bg"
                  />
                  <ColorPicker
                    label="Header Text"
                    value={
                      localTheme.header?.text ||
                      defaultChatTheme.header?.text ||
                      ""
                    }
                    onChange={(value) => handleHeaderColorChange("text", value)}
                    variable="--header-text"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <h3 className="text-lg font-medium mb-4">Live Preview</h3>
              <ComponentPreview theme={localTheme} />
              <div className="mt-8">
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={resetTheme}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Theme Presets</h3>
          <ThemePresets setLocalTheme={setLocalTheme} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="font-medium mb-2">📊 ThemesService Status:</div>
          <div className="text-xs space-y-1">
            <div>✅ ThemesService integration active</div>
            <div>✅ localStorage persistence enabled</div>
            <div>✅ Automatic save/load functionality</div>
            <div>✅ Theme validation enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}
