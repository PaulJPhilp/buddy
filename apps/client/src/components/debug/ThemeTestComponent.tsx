"use client";

import { ChatApp } from "@/features/chat/ChatApp";
import type { ProtocolMessage as ChatProtocolMessage } from "@/features/chat/ChatApp";
import { useAgentSession } from "@/hooks/useAgentSession";
import { useState } from "react";

export function ThemeTestComponent() {
  const agentId = "theme-test-agent";
  const chatId = "theme-test-chat";
  const { status, messages, error, sendMessage } = useAgentSession(
    agentId,
    chatId,
  );

  const [currentTheme, setCurrentTheme] = useState<string>("default");
  const [themeColors, setThemeColors] = useState<Record<string, string>>({
    background: "#ffffff",
    foreground: "#000000",
    primary: "#0ea5e9",
    secondary: "#64748b",
    userArea: "#f8fafc",
    bubbleUser: "#0ea5e9",
    bubbleAgent: "#64748b",
    headerBg: "#f8fafc",
    headerText: "#000000",
  });

  const themes = [
    { value: "default", label: "Default" },
    { value: "spike-dark", label: "Spike Dark" },
    { value: "minimal-test", label: "Minimal Test" },
    { value: "custom", label: "Custom" },
  ];

  console.log("ThemeTestComponent render - currentTheme:", currentTheme);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="text-lg font-semibold text-green-600 mb-4">
            ✅ Theme Test Component Loaded!
          </div>
          <div className="flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => {
                  console.log("Switching to theme:", theme.value);
                  setCurrentTheme(theme.value);

                  // Reset custom colors when switching themes
                  if (theme.value !== "custom") {
                    // We would load the actual theme colors here
                    // For now, just use some defaults based on the theme name
                    if (theme.value === "spike-dark") {
                      setThemeColors({
                        background: "#1e293b",
                        foreground: "#f8fafc",
                        primary: "#38bdf8",
                        secondary: "#64748b",
                        userArea: "#0f172a",
                        bubbleUser: "#38bdf8",
                        bubbleAgent: "#475569",
                        headerBg: "#0f172a",
                        headerText: "#f8fafc",
                      });
                    } else if (theme.value === "minimal-test") {
                      setThemeColors({
                        background: "#f9fafb",
                        foreground: "#111827",
                        primary: "#4f46e5",
                        secondary: "#9ca3af",
                        userArea: "#f3f4f6",
                        bubbleUser: "#4f46e5",
                        bubbleAgent: "#9ca3af",
                        headerBg: "#f3f4f6",
                        headerText: "#111827",
                      });
                    } else {
                      // Default theme
                      setThemeColors({
                        background: "#ffffff",
                        foreground: "#000000",
                        primary: "#0ea5e9",
                        secondary: "#64748b",
                        userArea: "#f8fafc",
                        bubbleUser: "#0ea5e9",
                        bubbleAgent: "#64748b",
                        headerBg: "#f8fafc",
                        headerText: "#000000",
                      });
                    }
                  }
                }}
                className={`px-4 py-2 rounded border transition-colors ${
                  currentTheme === theme.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current theme: <strong>{currentTheme}</strong>
          </p>
        </div>

        <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 text-center">
            <div className="text-sm text-gray-600 mb-2">Chat Preview</div>
            <div className="h-[400px] border border-gray-200 rounded-lg overflow-hidden">
              {status === "initializing" || status === "connecting" ? (
                <div className="text-gray-400 flex items-center justify-center h-full">
                  Connecting...
                </div>
              ) : error ? (
                <div className="text-red-600 flex items-center justify-center h-full">
                  {error}
                </div>
              ) : (
                <ChatApp
                  chatId={chatId}
                  agentId={agentId}
                  messages={messages as ChatProtocolMessage[]}
                  sendMessageAction={sendMessage}
                  error={null}
                  className="h-full"
                  theme={{
                    colors: {
                      background: themeColors.background,
                      text: themeColors.foreground, // Using foreground as text
                      primary: themeColors.primary,
                      secondary: themeColors.secondary,
                      accent: themeColors.primary, // Using primary as accent
                      border: "#e5e7eb", // Default border color
                    },
                    header: {
                      background: themeColors.headerBg,
                      text: themeColors.headerText,
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-2">Theme Colors</h3>
            <div className="space-y-2 text-sm">
              {currentTheme === "custom" ? (
                <div className="space-y-3">
                  {Object.entries(themeColors).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                        <label className="text-xs font-medium">{key}</label>
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: value }}
                        />
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          setThemeColors((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                        }}
                        className="px-2 py-1 text-xs border rounded w-full"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-chat-background border border-gray-400 rounded" />
                    <span>Chat Background</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 bg-chat-primary rounded" />
                    <span>Chat Primary</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 bg-chat-secondary rounded" />
                    <span>Chat Secondary</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 bg-chat-user-area border border-gray-400 rounded" />
                    <span>User Area</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-2">Bubble Colors</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-bubble-user rounded" />
                <span>User Bubble</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-bubble-agent rounded" />
                <span>Agent Bubble</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div className="space-y-2">
                <div
                  className="p-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: "var(--color-chat-bubble-user)",
                    color: "#fff",
                  }}
                >
                  User message example
                </div>
                <div
                  className="p-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: "var(--color-chat-bubble-agent)",
                    color: "#fff",
                  }}
                >
                  Agent response example
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-sm text-gray-600">
              Switch between themes using the buttons above to see how the chat
              appearance changes. Select "Custom" to edit theme colors directly.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium mb-2">CSS Variables</h4>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
                <pre>{`:root {
  --color-chat-background: ${themeColors.background};
  --color-chat-foreground: ${themeColors.foreground};
  --color-chat-primary: ${themeColors.primary};
  --color-chat-secondary: ${themeColors.secondary};
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
