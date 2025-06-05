"use client";

import { type ThemeColors, useTheme } from "@/contexts/ThemeContext";
import { ChatApp } from "@/features/chat/ChatApp";
import { AgentRuntimeService } from "@/services/agent-runtime/AgentRuntimeService";
import { MdxService } from "@/services/mdx";
import { Effect, Layer } from "effect";
import React, { useEffect, useRef, useState } from "react";

const mockAgentConfig = {
  agentId: "test-agent",
  agentWsUrl: "ws://localhost:8080",
  initialAgentName: "Theme Builder Agent",
  agents: [
    {
      id: "test-agent",
      name: "Theme Builder",
      description: "A helpful agent for testing themes",
      status: { mood: 80, energy: 90, health: 100 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true },
      type: "assistant"
    },
    {
      id: "creative-agent",
      name: "Creative Assistant",
      description: "Helps with creative tasks",
      status: { mood: 95, energy: 85, health: 100 },
      capabilities: { canSpeak: true, canMove: false, canLearn: true },
      type: "creative"
    }
  ]
};

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

function ComponentPreview({ colors }: { colors: ThemeColors }) {
  return (
    <div
      className="p-4 rounded-lg border space-y-4"
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        borderColor: colors.border
      }}
    >
      {/* Header Preview */}
      <div
        className="flex justify-between items-center p-3 rounded"
        style={{
          backgroundColor: colors.headerBg,
          color: colors.headerText
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
            style={{ backgroundColor: colors.bubbleUser }}
          >
            This is a user message bubble
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="max-w-xs p-3 rounded-lg text-white text-sm"
            style={{ backgroundColor: colors.bubbleAgent }}
          >
            This is an agent response bubble
          </div>
        </div>
      </div>

      {/* User Area Preview */}
      <div
        className="p-3 rounded border-t-2"
        style={{
          backgroundColor: colors.userArea,
          borderTopColor: colors.userAreaBorder || colors.border
        }}
      >
        <div
          className="w-full p-2 rounded text-sm border"
          style={{
            backgroundColor: colors.background,
            color: colors.foreground,
            borderColor: colors.inputBorder || colors.border
          }}
        >
          Type your message here...
        </div>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            className="px-3 py-1 rounded text-sm text-white"
            style={{ backgroundColor: colors.secondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded text-sm text-white"
            style={{ backgroundColor: colors.primary }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemePresets() {
  const { defaultThemes, setGlobalTheme, currentTheme, updateChatColor } = useTheme();
  const previewChatId = 'preview';

  const applyPreset = (themeName: string) => {
    setGlobalTheme(themeName);
    const themeColors = defaultThemes[themeName];
    if (themeColors) {
      // Apply to preview chat
      for (const [key, value] of Object.entries(themeColors)) {
        updateChatColor(previewChatId, key as keyof ThemeColors, value)
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
      <h2 className="text-xl font-semibold mb-4">🎨 Theme Presets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(defaultThemes).map(([themeName, themeColors]) => (
          <button
            type="button"
            key={themeName}
            onClick={() => applyPreset(themeName)}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${currentTheme === themeName
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="text-left">
              <div className="font-medium capitalize mb-2">{themeName.replace('-', ' ')}</div>
              <div className="flex gap-1 mb-2">
                {[
                  { color: themeColors.primary, label: 'Primary' },
                  { color: themeColors.secondary, label: 'Secondary' },
                  { color: themeColors.bubbleUser, label: 'User Bubble' },
                  { color: themeColors.bubbleAgent, label: 'Agent Bubble' }
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
                {currentTheme === themeName ? 'Current' : 'Click to apply'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemeActions() {
  const { chatThemes } = useTheme();
  const previewChatId = 'preview';
  const currentTheme = chatThemes[previewChatId];

  const exportTheme = () => {
    if (!currentTheme) return;

    const themeData = {
      name: `custom-theme-${Date.now()}`,
      colors: currentTheme,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeData.name}.json`;
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
        const data = JSON.parse(reader.result as string);
        if (data.colors && typeof data.colors === 'object') {
          const { updateChatColor } = useTheme();
          for (const [key, value] of Object.entries(data.colors)) {
            if (typeof value === 'string') {
              updateChatColor(previewChatId, key as keyof ThemeColors, value);
            }
          }
        }
      } catch (error) {
        console.error('Failed to import theme:', error);
        alert('Failed to import theme. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const resetTheme = () => {
    const { defaultThemes, updateChatColor } = useTheme();
    const defaultTheme = defaultThemes['spike-light']
    if (defaultTheme) {
      for (const [key, value] of Object.entries(defaultTheme)) {
        updateChatColor(previewChatId, key as keyof ThemeColors, value)
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
      <h2 className="text-xl font-semibold mb-4">🔧 Theme Actions</h2>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={exportTheme}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          📤 Export Theme
        </button>

        <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
          📥 Import Theme
          <input
            type="file"
            accept=".json"
            onChange={importTheme}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={resetTheme}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          🔄 Reset to Default
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium mb-2">💾 Auto-Save Status</div>
        <div className="text-xs text-gray-600">
          ✅ All theme changes are automatically saved to localStorage via ThemesService integration.
          Your themes will persist across browser sessions.
        </div>
      </div>
    </div>
  );
}

// Mock layer for silent theme testing (no WebSocket connections)
const MockAgentRuntimeLayer = Layer.succeed(AgentRuntimeService, {
  establishSession: () => Effect.succeed({
    id: "mock-session-theme-test",
    url: "mock://theme-test",
    status$: {
      pipe: () => ({
        pipe: () => Effect.never
      })
    },
    incomingMessages$: {
      pipe: () => ({
        pipe: () => Effect.never
      })
    },
    send: () => Effect.succeed(undefined),
    close: () => Effect.succeed(undefined)
  }),
  closeSession: () => Effect.succeed(undefined),
  sendMessage: () => Effect.succeed(undefined),
  getSession: () => Effect.succeed(undefined)
} as any);

const ThemeTestLayer = Layer.merge(MockAgentRuntimeLayer, MdxService.Default);

export default function ThemeBuilderPage() {
  const [previewChatId] = useState('preview');
  const [jsonError, setJsonError] = useState('');

  // Get theme context values
  const { chatThemes, updateChatColor, getChatStyle } = useTheme();

  const chatStyle = getChatStyle(previewChatId);

  // Ensure preview theme exists
  useEffect(() => {
    if (!chatThemes[previewChatId]) {
      // Initialize with spike-light default
      const { defaultThemes } = useTheme();
      const defaultTheme = defaultThemes['spike-light'];
      if (defaultTheme) {
        for (const [key, value] of Object.entries(defaultTheme)) {
          updateChatColor(previewChatId, key as keyof ThemeColors, value);
        }
      }
    }
  }, [chatThemes, previewChatId, updateChatColor]);

  const currentTheme = chatThemes[previewChatId];

  return (
    <div
      className="min-h-screen bg-gray-50 py-12"
      style={chatStyle}
    >
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🎨 Advanced Theme Builder</h1>
          <p className="text-gray-600">
            Design and customize chat themes with real-time preview and automatic persistence.
            All changes are saved automatically via the integrated ThemesService.
          </p>
        </div>

        {/* Theme Presets */}
        <ThemePresets />

        {/* Theme Actions */}
        <ThemeActions />

        {/* Color Editor */}
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <h2 className="text-xl font-semibold mb-6">🎨 Theme Color Editor</h2>
          {currentTheme ? (
            <div className="space-y-8">
              {/* Container Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded bg-gray-500" />
                  <h3 className="text-lg font-medium">📦 Container</h3>
                  <span className="text-sm text-gray-500">Overall app appearance</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-5">
                  <ColorPicker
                    label="Background"
                    value={currentTheme.background}
                    onChange={(value) => updateChatColor(previewChatId, "background", value)}
                    variable="--color-chat-background"
                  />
                  <ColorPicker
                    label="Text Color"
                    value={currentTheme.foreground}
                    onChange={(value) => updateChatColor(previewChatId, "foreground", value)}
                    variable="--color-chat-foreground"
                  />
                  <ColorPicker
                    label="Border Color"
                    value={currentTheme.border}
                    onChange={(value) => updateChatColor(previewChatId, "border", value)}
                    variable="--color-chat-border"
                  />
                  <ColorPicker
                    label="Primary Accent"
                    value={currentTheme.primary}
                    onChange={(value) => updateChatColor(previewChatId, "primary", value)}
                    variable="--color-chat-primary"
                  />
                </div>
              </div>

              {/* Header Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <h3 className="text-lg font-medium">📄 Header</h3>
                  <span className="text-sm text-gray-500">Top navigation bar</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-5">
                  <ColorPicker
                    label="Header Background"
                    value={currentTheme.headerBg}
                    onChange={(value) => updateChatColor(previewChatId, "headerBg", value)}
                    variable="--color-chat-header-bg"
                  />
                  <ColorPicker
                    label="Header Text"
                    value={currentTheme.headerText}
                    onChange={(value) => updateChatColor(previewChatId, "headerText", value)}
                    variable="--color-chat-header-text"
                  />
                </div>
              </div>

              {/* Chat Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <h3 className="text-lg font-medium">💬 Chat</h3>
                  <span className="text-sm text-gray-500">Message bubbles and conversation</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-5">
                  <ColorPicker
                    label="User Message Bubble"
                    value={currentTheme.bubbleUser}
                    onChange={(value) => updateChatColor(previewChatId, "bubbleUser", value)}
                    variable="--color-chat-bubble-user"
                  />
                  <ColorPicker
                    label="Agent Message Bubble"
                    value={currentTheme.bubbleAgent}
                    onChange={(value) => updateChatColor(previewChatId, "bubbleAgent", value)}
                    variable="--color-chat-bubble-agent"
                  />
                  <ColorPicker
                    label="Secondary Accent"
                    value={currentTheme.secondary}
                    onChange={(value) => updateChatColor(previewChatId, "secondary", value)}
                    variable="--color-chat-secondary"
                  />
                </div>
              </div>

              {/* User Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded bg-purple-500" />
                  <h3 className="text-lg font-medium">👤 User</h3>
                  <span className="text-sm text-gray-500">Input area and user controls</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-5">
                  <ColorPicker
                    label="User Area Background"
                    value={currentTheme.userArea}
                    onChange={(value) => updateChatColor(previewChatId, "userArea", value)}
                    variable="--color-chat-user-area"
                  />
                  <ColorPicker
                    label="User Area Top Border"
                    value={currentTheme.userAreaBorder || currentTheme.border}
                    onChange={(value) => updateChatColor(previewChatId, "userAreaBorder", value)}
                    variable="--color-chat-user-area-border"
                  />
                  <ColorPicker
                    label="Input Field Border"
                    value={currentTheme.inputBorder || currentTheme.border}
                    onChange={(value) => updateChatColor(previewChatId, "inputBorder", value)}
                    variable="--color-chat-input-border"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading theme editor...</p>
            </div>
          )}
        </div>

        {/* Component Preview */}
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Component Preview</h2>
          {currentTheme && <ComponentPreview colors={currentTheme} />}
        </div>

        {/* Live ChatApp Preview */}
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">💬 Live ChatApp Preview</h2>
            <div className="text-sm text-gray-500">
              Theme ID: <code className="bg-gray-100 px-2 py-1 rounded">{previewChatId}</code>
            </div>
          </div>

          <div className="w-full">
            <div className="h-[500px] border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <ChatApp
                chatId={previewChatId}
                agentConfig={{
                  ...mockAgentConfig,
                  agentId: "test-agent",
                  initialAgentName: "Theme Builder Agent"
                }}
                className="h-full"
                injectedLayer={ThemeTestLayer}
              />
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-50 p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">🐛 Debug Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium mb-2">Applied Theme Colors:</div>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(currentTheme || {}, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-medium mb-2">Generated CSS Variables:</div>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                {Object.entries(chatStyle || {}).map(([key, value]) =>
                  `${key}: ${value};`
                ).join('\n')}
              </pre>
            </div>
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
    </div>
  );
}
