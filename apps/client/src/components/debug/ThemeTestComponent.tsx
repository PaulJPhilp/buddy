"use client";

import { ChatApp } from "@/features/chat/ChatApp";
import { useState } from "react";

const mockAgentConfig = {
  agentId: "test-agent",
  agentWsUrl: "ws://localhost:0/fake-test",
  initialAgentName: "Test Agent",
};

export function ThemeTestComponent() {
  const [currentTheme, setCurrentTheme] = useState<string>("default");

  const themes = [
    { value: "default", label: "Default" },
    { value: "spike-dark", label: "Spike Dark" },
    { value: "minimal-test", label: "Minimal Test" },
  ];

  console.log("ThemeTestComponent render - currentTheme:", currentTheme);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="text-lg font-semibold text-green-600 mb-4">
            ✅ Theme Test Component Loaded!
          </div>
          <div className="flex gap-2">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => {
                  console.log("Switching to theme:", theme.value);
                  setCurrentTheme(theme.value);
                }}
                className={`px-4 py-2 rounded border transition-colors ${currentTheme === theme.value
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
            <p className="text-gray-600">ChatApp will appear here once loaded...</p>
            <div className="mt-4">
              <ChatApp
                chatId="theme-test-chat"
                agentConfig={mockAgentConfig}
                theme={currentTheme === "default" ? undefined : currentTheme}
                className="h-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-2">Theme Colors</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-background border border-gray-400 rounded" />
                <span>Chat Background</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-primary rounded" />
                <span>Chat Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-secondary rounded" />
                <span>Chat Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-chat-user-area border border-gray-400 rounded" />
                <span>User Area</span>
              </div>
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
          </div>

          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-sm text-gray-600">
              Switch between themes using the buttons above to see how the chat
              appearance changes. Each theme defines different color schemes
              using Tailwind v4's @theme directive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 