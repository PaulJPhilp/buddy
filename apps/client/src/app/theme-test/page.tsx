"use client";

import { type ThemeColors, useTheme } from "@/contexts/ThemeContext";
import { ChatApp } from "@/features/chat/ChatApp";
import { useRef } from "react";

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
    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div
        className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer shadow-sm"
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        title={`Click to change ${label}`}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-500 font-mono">{variable}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 invisible"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs font-mono border border-gray-300 rounded"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function ComponentPreview({ colors }: { colors: ThemeColors }) {
  return (
    <div className="space-y-4">
      {/* Message Bubbles Preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Message Bubbles</h4>
        <div className="space-y-2">
          <div
            className="max-w-xs ml-auto p-3 rounded-lg text-sm"
            style={{
              backgroundColor: colors.bubbleUser,
              color: colors.background,
            }}
          >
            User message bubble - how does this look?
          </div>
          <div
            className="max-w-xs p-3 rounded-lg text-sm"
            style={{
              backgroundColor: colors.bubbleAgent,
              color: colors.foreground,
              border: `1px solid ${colors.border}`,
            }}
          >
            Agent response bubble with longer text to see how it wraps
          </div>
        </div>
      </div>

      {/* Header Preview */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Header Bar</h4>
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: colors.headerBg,
            color: colors.headerText,
          }}
        >
          Chat Header - Theme Builder Agent
        </div>
      </div>

      {/* Input Area Preview */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Input Area</h4>
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: colors.userArea,
            borderColor: colors.border,
          }}
        >
          <div
            className="p-2 rounded border text-sm"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            }}
          >
            Type your message here...
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeBuilderPage() {
  const {
    currentTheme,
    isCustomMode,
    customColors,
    defaultThemes,
    updateCustomColor,
    getActualTheme,
    getCustomStyle,
  } = useTheme();

  const actualTheme = getActualTheme();
  const customStyle = getCustomStyle();

  return (
    <div
      className="min-h-screen max-w-7xl mx-auto p-6 space-y-6"
      style={customStyle as React.CSSProperties}
      data-chat-theme={actualTheme}
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">🎨 ChatApp Theme Builder</h1>
        <p className="text-gray-600 mt-2">Design and test custom themes for your chat interface</p>
        <p className="text-sm text-gray-500 mt-1">Use the sidebar to switch between themes and manage theme tools</p>
      </div>

      {/* Layout: Color Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Editor */}
        {isCustomMode && (
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-semibold mb-4">🎨 Color Editor</h2>
            <div className="space-y-3">
              <ColorPicker
                label="Background"
                value={customColors.background}
                onChange={(value) => updateCustomColor("background", value)}
                variable="--color-chat-background"
              />
              <ColorPicker
                label="Text Color"
                value={customColors.foreground}
                onChange={(value) => updateCustomColor("foreground", value)}
                variable="--color-chat-foreground"
              />
              <ColorPicker
                label="Primary Color"
                value={customColors.primary}
                onChange={(value) => updateCustomColor("primary", value)}
                variable="--color-chat-primary"
              />
              <ColorPicker
                label="Secondary Background"
                value={customColors.secondary}
                onChange={(value) => updateCustomColor("secondary", value)}
                variable="--color-chat-secondary"
              />
              <ColorPicker
                label="Border Color"
                value={customColors.border}
                onChange={(value) => updateCustomColor("border", value)}
                variable="--color-chat-border"
              />
              <ColorPicker
                label="User Area Background"
                value={customColors.userArea}
                onChange={(value) => updateCustomColor("userArea", value)}
                variable="--color-chat-user-area"
              />
              <ColorPicker
                label="User Message Bubble"
                value={customColors.bubbleUser}
                onChange={(value) => updateCustomColor("bubbleUser", value)}
                variable="--color-chat-bubble-user"
              />
              <ColorPicker
                label="Agent Message Bubble"
                value={customColors.bubbleAgent}
                onChange={(value) => updateCustomColor("bubbleAgent", value)}
                variable="--color-chat-bubble-agent"
              />
              <ColorPicker
                label="Header Background"
                value={customColors.headerBg}
                onChange={(value) => updateCustomColor("headerBg", value)}
                variable="--color-chat-header-bg"
              />
              <ColorPicker
                label="Header Text"
                value={customColors.headerText}
                onChange={(value) => updateCustomColor("headerText", value)}
                variable="--color-chat-header-text"
              />
            </div>
          </div>
        )}

        {/* Component Preview */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">🔍 Component Preview</h2>
          <ComponentPreview colors={isCustomMode ? customColors : defaultThemes[currentTheme]} />
        </div>
      </div>

      {/* Live ChatApp Preview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">💬 Live ChatApp Preview</h2>
          <div className="text-sm text-gray-600">
            Current Theme: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{actualTheme}</span>
          </div>
        </div>

        <div className="h-[500px] border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          <ChatApp
            chatId="theme-builder-preview"
            agentConfig={mockAgentConfig}
            theme={actualTheme}
            className="h-full"
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">🐛 Debug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current Theme:</strong> {actualTheme}
          </div>
          <div>
            <strong>Custom Mode:</strong> {isCustomMode ? "Yes" : "No"}
          </div>
          <div className="md:col-span-2">
            <strong>Applied Colors:</strong>
            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(isCustomMode ? customColors : defaultThemes[currentTheme], null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
