"use client";

import {
  ChatAppTheme,
  defaultChatTheme,
} from "@/themes/themeTypes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3 p-2 border rounded">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-500 font-mono">{value}</div>
      </div>
    </div>
  );
}

export function ThemeIntegrationDemo() {
  const { theme: rawTheme, setTheme } = useTheme();
  const [demoKey, setDemoKey] = useState(0); // Force re-render to see changes

  const currentTheme = rawTheme
    ? (() => {
        try {
          if (
            typeof rawTheme === "string" &&
            !["system", "dark", "light"].includes(rawTheme)
          ) {
            return JSON.parse(rawTheme) as ChatAppTheme;
          } else if (typeof rawTheme === "object") {
            return rawTheme as ChatAppTheme;
          }
        } catch (error) {
          console.error("Error parsing theme in ThemeIntegrationDemo:", error);
        }
        return defaultChatTheme;
      })()
    : defaultChatTheme;

  // Compute theme styles
  const themeStyles = {
    "--color-chat-background":
      currentTheme.colors?.background || defaultChatTheme.colors.background,
    "--color-chat-foreground":
      currentTheme.colors?.text || defaultChatTheme.colors.text,
    "--color-chat-primary":
      currentTheme.colors?.primary || defaultChatTheme.colors.primary,
    "--color-chat-secondary":
      currentTheme.colors?.secondary || defaultChatTheme.colors.secondary,
    "--color-chat-border":
      currentTheme.borders?.color || defaultChatTheme.borders?.color,
    "--color-chat-user-area":
      currentTheme.userArea?.background ||
      defaultChatTheme.userArea?.background,
    "--color-chat-bubble-user":
      currentTheme.bubbles?.user?.background ||
      defaultChatTheme.bubbles?.user?.background,
    "--color-chat-bubble-agent":
      currentTheme.bubbles?.agent?.background ||
      defaultChatTheme.bubbles?.agent?.background,
    "--color-chat-header-bg":
      currentTheme.header?.background || defaultChatTheme.header?.background,
    "--color-chat-header-text":
      currentTheme.header?.text || defaultChatTheme.header?.text,
  } as React.CSSProperties;

  // Check localStorage directly to show persistence
  const [localStorageContent, setLocalStorageContent] = useState<string>("");

  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        const stored = localStorage.getItem("buddy:themes");
        setLocalStorageContent(stored || "No themes saved yet");
      } catch (e) {
        setLocalStorageContent("localStorage not available");
      }
    };

    checkLocalStorage();
    const interval = setInterval(checkLocalStorage, 1000);
    return () => clearInterval(interval);
  }, [demoKey]);

  const triggerUpdate = () => {
    setDemoKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">🎨 Theme Integration Demo</h1>
        <p className="text-gray-600">
          This demonstrates the integrated ThemeProvider with ThemesService
          persistence. Changes are automatically saved to localStorage.
        </p>
      </div>

      {/* Theme Controls */}
      <div className="bg-white p-6 rounded-lg shadow-lg border">
        <h2 className="text-lg font-semibold mb-4">Theme Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Background"
            value={
              currentTheme.colors?.background ||
              defaultChatTheme.colors.background ||
              "#ffffff"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  colors: {
                    ...currentTheme.colors,
                    background: color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="Text Color"
            value={
              currentTheme.colors?.text ||
              defaultChatTheme.colors.text ||
              "#000000"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  colors: {
                    ...currentTheme.colors,
                    text: color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="Primary Color"
            value={
              currentTheme.colors?.primary ||
              defaultChatTheme.colors.primary ||
              "#0ea5e9"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  colors: {
                    ...currentTheme.colors,
                    primary: color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="Secondary Color"
            value={
              currentTheme.colors?.secondary ||
              defaultChatTheme.colors.secondary ||
              "#64748b"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  colors: {
                    ...currentTheme.colors,
                    secondary: color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="Border Color"
            value={
              currentTheme.borders?.color ||
              defaultChatTheme.borders?.color ||
              "#000000"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  borders: {
                    ...currentTheme.borders,
                    color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="User Area"
            value={
              currentTheme.userArea?.background ||
              defaultChatTheme.userArea?.background ||
              "#ffffff"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  userArea: {
                    ...currentTheme.userArea,
                    background: color,
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="User Bubble"
            value={
              currentTheme.bubbles?.user?.background ||
              defaultChatTheme.bubbles?.user?.background ||
              "#0ea5e9"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  bubbles: {
                    ...currentTheme.bubbles,
                    user: {
                      ...currentTheme.bubbles?.user,
                      background: color,
                    },
                  },
                }),
              );
              triggerUpdate();
            }}
          />
          <ColorPicker
            label="Agent Bubble"
            value={
              currentTheme.bubbles?.agent?.background ||
              defaultChatTheme.bubbles?.agent?.background ||
              "#64748b"
            }
            onChange={(color) => {
              setTheme(
                JSON.stringify({
                  ...currentTheme,
                  bubbles: {
                    ...currentTheme.bubbles,
                    agent: {
                      ...currentTheme.bubbles?.agent,
                      background: color,
                    },
                  },
                }),
              );
              triggerUpdate();
            }}
          />
        </div>
      </div>

      {/* Theme Preview */}
      <div
        className="bg-white rounded-lg shadow-lg border p-6"
        style={themeStyles}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-chat-foreground)" }}
        >
          Live Theme Preview
        </h2>
        <div className="space-y-4">
          {/* Header simulation */}
          <div
            className="p-3 rounded"
            style={{
              backgroundColor: "var(--color-chat-header-bg)",
              color: "var(--color-chat-header-text)",
            }}
          >
            Chat Header
          </div>

          {/* Message bubbles simulation */}
          <div className="space-y-2">
            <div
              className="p-3 rounded-lg max-w-xs ml-auto"
              style={{
                backgroundColor: "var(--color-chat-bubble-user)",
                color: "#ffffff",
              }}
            >
              User message bubble
            </div>
            <div
              className="p-3 rounded-lg max-w-xs"
              style={{
                backgroundColor: "var(--color-chat-bubble-agent)",
                color: "#ffffff",
              }}
            >
              Agent message bubble
            </div>
          </div>

          {/* User area simulation */}
          <div
            className="p-3 rounded border"
            style={{
              backgroundColor: "var(--color-chat-user-area)",
              borderColor: "var(--color-chat-border)",
            }}
          >
            User input area
          </div>
        </div>
      </div>

      {/* Persistence Demo */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">
          📱 localStorage Persistence
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Current themes stored in localStorage:
          </p>
          <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
            {localStorageContent}
          </pre>
          <p className="text-xs text-gray-500">
            💡 Try changing colors above, then refresh the page to see
            persistence in action!
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">
          🎯 Integration Features Demonstrated
        </h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ React Context API maintained for easy component access</li>
          <li>✅ ThemesService integration for robust data management</li>
          <li>✅ Automatic localStorage persistence</li>
          <li>✅ Real-time CSS variable injection</li>
          <li>✅ Theme validation and error handling</li>
          <li>✅ Per-chat theme isolation</li>
        </ul>
      </div>
    </div>
  );
}
