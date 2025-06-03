"use client";

import React, { useState, useEffect } from "react";
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
    <div className="space-y-4">
      {/* Message Bubbles Preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Message Bubbles</h4>
        <div className="space-y-2">
          <div className="max-w-[90rem] mx-auto py-8 px-4 space-y-8">
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
  const [previewChatId] = useState('preview');
  const [jsonError, setJsonError] = useState('');
  
  // Get theme context values
  const { chatThemes, updateChatColor, getChatStyle } = useTheme();
  
  const chatStyle = getChatStyle(previewChatId);

  return (
    <div
      className="min-h-screen bg-gray-50 py-12"
      style={chatStyle}
    >
      <div className="max-w-4xl mx-auto p-8">
        {/* Color Editor */}
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <h2 className="text-xl font-semibold mb-4">🎨 Theme Color Editor</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <ColorPicker
                label="Background"
                value={chatThemes[previewChatId]?.background}
                onChange={(value) => updateChatColor(previewChatId, "background", value)}
                variable="--color-chat-background"
              />
              <ColorPicker
                label="Text Color"
                value={chatThemes[previewChatId]?.foreground}
                onChange={(value) => updateChatColor(previewChatId, "foreground", value)}
                variable="--color-chat-foreground"
              />
              <ColorPicker
                label="Primary Color"
                value={chatThemes[previewChatId]?.primary}
                onChange={(value) => updateChatColor(previewChatId, "primary", value)}
                variable="--color-chat-primary"
              />
              <ColorPicker
                label="Secondary Color"
                value={chatThemes[previewChatId]?.secondary}
                onChange={(value) => updateChatColor(previewChatId, "secondary", value)}
                variable="--color-chat-secondary"
              />
              <ColorPicker
                label="Border Color"
                value={chatThemes[previewChatId]?.border}
                onChange={(value) => updateChatColor(previewChatId, "border", value)}
                variable="--color-chat-border"
              />
              <ColorPicker
                label="User Area"
                value={chatThemes[previewChatId]?.userArea}
                onChange={(value) => updateChatColor(previewChatId, "userArea", value)}
                variable="--color-chat-user-area"
              />
              <ColorPicker
                label="User Message Bubble"
                value={chatThemes[previewChatId]?.bubbleUser}
                onChange={(value) => updateChatColor(previewChatId, "bubbleUser", value)}
                variable="--color-chat-bubble-user"
              />
              <ColorPicker
                label="Agent Message Bubble"
                value={chatThemes[previewChatId]?.bubbleAgent}
                onChange={(value) => updateChatColor(previewChatId, "bubbleAgent", value)}
                variable="--color-chat-bubble-agent"
              />
              <ColorPicker
                label="Header Background"
                value={chatThemes[previewChatId]?.headerBg}
                onChange={(value) => updateChatColor(previewChatId, "headerBg", value)}
                variable="--color-chat-header-bg"
              />
              <ColorPicker
                label="Header Text"
                value={chatThemes[previewChatId]?.headerText}
                onChange={(value) => updateChatColor(previewChatId, "headerText", value)}
                variable="--color-chat-header-text"
              />
            </div>
          </div>
        </div>

        {/* Component Preview */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">🔍 Component Preview</h2>
          <ComponentPreview colors={chatThemes[previewChatId] || {}} />
        </div>
      </div>

      {/* Live ChatApp Preview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border w-full max-w-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">💬 Live ChatApp Preview</h2>
        </div>

        <div className="w-full">
          <div className="h-[500px] border border-gray-300 rounded-lg overflow-hidden shadow-lg">
            <ChatApp
              chatId="theme-builder-preview"
              agentConfig={{
                ...mockAgentConfig,
                agentId: "test-agent",
                initialAgentName: "Theme Builder Agent"
              }}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">🐛 Debug Information</h3>
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <strong>Applied Colors:</strong>
            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(chatThemes[previewChatId] || {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
