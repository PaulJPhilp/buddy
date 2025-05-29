"use client";

import { ChatApp } from "@/features/chat/ChatApp";
import { useState } from "react";

const mockAgentConfig = {
  agentId: "test-agent",
  agentWsUrl: "ws://localhost:0/fake-test",
  initialAgentName: "Theme Test Agent",
};

export default function ThemeTestPage() {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [clickCount, setClickCount] = useState(0);

  console.log("ThemeTestPage rendering, currentTheme:", currentTheme);

  const handleThemeClick = (themeName: string) => {
    console.log("Theme button clicked:", themeName);
    setCurrentTheme(themeName);
    setClickCount(prev => prev + 1);
  };

  // Pass theme directly - let ChatApp handle the logic
  const actualTheme = currentTheme;
  const debugTheme = currentTheme;

  return (
    <div className="min-h-screen p-8 pb-16" data-chat-theme={actualTheme}>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">ChatApp Theme Test</h1>

        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">✅ ChatApp with Theme Switching!</p>
          <p className="text-sm text-green-600 mt-1">
            Current theme: <strong>{currentTheme}</strong> | Clicks: {clickCount}
          </p>
          <p className="text-xs text-green-500 mt-1">
            Debug - actualTheme: {JSON.stringify(actualTheme)} | debugTheme: {debugTheme}
          </p>
        </div>

        {/* DEBUGGING SECTION - Should show immediate theme changes */}
        <div className="mb-4 p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
          <h3 className="text-yellow-800 font-bold text-lg">🔍 Theme Debug Information</h3>
          <div className="mt-2 text-sm">
            <p><strong>React State:</strong> currentTheme = "{currentTheme}"</p>
            <p><strong>Click Count:</strong> {clickCount} (should increment on button clicks)</p>
            <p><strong>data-chat-theme:</strong> "{actualTheme}"</p>
          </div>

          {/* This should change colors immediately based on theme */}
          <div
            className="mt-3 p-3 border-2 rounded"
            style={{
              backgroundColor: 'var(--color-chat-background)',
              color: 'var(--color-chat-foreground)',
              borderColor: 'var(--color-chat-border)'
            }}
          >
            <strong>🎨 Live CSS Variable Test:</strong>
            <br />
            If theme switching works, this box should change colors when you click theme buttons!
            <br />
            <span className="text-xs">
              Theme: {currentTheme} | BG: var(--color-chat-background) | Color: var(--color-chat-foreground)
            </span>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="text-lg font-semibold mb-2">Theme Switcher</h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className={`px-4 py-2 rounded border transition-colors ${currentTheme === "default"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                }`}
              onClick={() => handleThemeClick("default")}
            >
              Default Theme
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border transition-colors ${currentTheme === "spike-dark"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-purple-600 border-purple-600 hover:bg-purple-50"
                }`}
              onClick={() => handleThemeClick("spike-dark")}
            >
              Spike Dark
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border transition-colors ${currentTheme === "minimal-test"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-600 border-green-600 hover:bg-green-50"
                }`}
              onClick={() => handleThemeClick("minimal-test")}
            >
              Minimal Test
            </button>
          </div>
          <p className="text-sm text-blue-600">
            Switch themes and watch the ChatApp change appearance instantly!
          </p>
        </div>

        <div className="mb-4 p-4 bg-chat-secondary text-chat-foreground border border-chat-border rounded">
          <h3 className="font-semibold mb-2">What to Look For</h3>
          <div className="text-sm space-y-1">
            <p>• <strong>Chat Background</strong>: Main chat area background color</p>
            <p>• <strong>User Input Area</strong>: Bottom input section styling</p>
            <p>• <strong>Message Bubbles</strong>: User vs agent message colors</p>
            <p>• <strong>Header</strong>: Top header bar appearance</p>
            <p>• <strong>Overall Vibe</strong>: Light vs dark vs bright green!</p>
          </div>
        </div>

        {/* Main ChatApp Component */}
        <div className="h-[400px] border border-gray-300 rounded-lg overflow-hidden shadow-lg relative">
          <ChatApp
            chatId="theme-test-chat"
            agentConfig={mockAgentConfig}
            theme={actualTheme}
            className="h-full"
          />
        </div>

        {/* Simple test section to verify rendering below ChatApp */}
        <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
          <h2 className="text-red-800 font-bold text-xl">🚨 TEST SECTION - Should be visible when scrolling</h2>
          <p className="text-red-700">If you can see this red box, then content IS rendering below the ChatApp!</p>
          <p className="text-sm text-red-600">Current theme: {actualTheme}</p>
        </div>

        <div className="mt-4 p-4 bg-chat-background text-chat-foreground border border-chat-border rounded">
          <h3 className="font-semibold mb-2">Live Theme Variables</h3>
          <div className="mb-2 text-xs text-gray-500">
            Debug: data-chat-theme = "{actualTheme}"
          </div>

          {/* Direct CSS Variable Tests */}
          <div className="mb-4 p-3 border-2 border-dashed border-chat-border">
            <h4 className="text-sm font-semibold mb-2">🧪 Direct CSS Variable Tests</h4>
            <div
              className="mb-2 p-2 border rounded"
              style={{
                backgroundColor: 'var(--color-chat-background)',
                color: 'var(--color-chat-foreground)',
                borderColor: 'var(--color-chat-border)'
              }}
            >
              <strong>CSS Variables Test:</strong> Background should change with theme!
              <br />
              <span className="text-xs opacity-75">
                bg: var(--color-chat-background) | color: var(--color-chat-foreground)
              </span>
            </div>

            <div
              className="mb-2 p-2 border rounded"
              style={{
                backgroundColor: 'var(--color-chat-secondary)',
                color: 'var(--color-chat-foreground)',
                borderColor: 'var(--color-chat-primary)'
              }}
            >
              <strong>Secondary Color Test:</strong> This uses secondary color
              <br />
              <span className="text-xs opacity-75">
                bg: var(--color-chat-secondary) | border: var(--color-chat-primary)
              </span>
            </div>
          </div>

          <div className="mb-2 text-xs font-mono">
            Current bg-chat-background color:
            <span
              style={{
                backgroundColor: 'var(--color-chat-background)',
                padding: '2px 4px',
                marginLeft: '4px',
                border: '1px solid #333'
              }}
            >
              sample
            </span>
          </div>

          <div className="mb-2 p-2 border border-chat-border rounded bg-chat-background text-chat-foreground">
            <strong>CSS Classes Test:</strong> This should change with theme!
          </div>

          {/* Color Squares - Using CSS classes */}
          <div className="flex gap-2 mb-2">
            <div className="w-6 h-6 bg-chat-background border border-gray-400 rounded" title="Chat Background" />
            <div className="w-6 h-6 bg-chat-primary rounded" title="Chat Primary" />
            <div className="w-6 h-6 bg-chat-secondary rounded" title="Chat Secondary" />
            <div className="w-6 h-6 bg-chat-user-area border border-gray-400 rounded" title="User Area" />
            <div className="w-6 h-6 bg-chat-bubble-user rounded" title="User Bubble" />
            <div className="w-6 h-6 bg-chat-bubble-agent rounded" title="Agent Bubble" />
          </div>
          <p className="text-sm opacity-75">
            This box and squares use theme CSS classes - they change with the selected theme!
          </p>
        </div>
      </div>
    </div>
  );
} 