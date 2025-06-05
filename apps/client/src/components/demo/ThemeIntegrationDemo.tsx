"use client";

import { useTheme } from "@/contexts/ThemeContext";
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
    const { chatThemes, updateChatColor, getChatStyle } = useTheme();
    const [demoKey, setDemoKey] = useState(0); // Force re-render to see changes

    const demoChatId = "integration-demo";
    const theme = chatThemes[demoChatId] || {
        background: "#ffffff",
        foreground: "#000000",
        primary: "#0ea5e9",
        secondary: "#64748b",
        border: "#e2e8f0",
        userArea: "#f8fafc",
        bubbleUser: "#0ea5e9",
        bubbleAgent: "#64748b",
        headerBg: "#f8fafc",
        headerText: "#000000"
    };

    const demoStyle = getChatStyle(demoChatId);

    // Check localStorage directly to show persistence
    const [localStorageContent, setLocalStorageContent] = useState<string>("");

    useEffect(() => {
        const checkLocalStorage = () => {
            try {
                const stored = localStorage.getItem('buddy:themes');
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
        setDemoKey(prev => prev + 1);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">🎨 Theme Integration Demo</h1>
                <p className="text-gray-600">
                    This demonstrates the integrated ThemeProvider with ThemesService persistence.
                    Changes are automatically saved to localStorage.
                </p>
            </div>

            {/* Theme Controls */}
            <div className="bg-white p-6 rounded-lg shadow-lg border">
                <h2 className="text-lg font-semibold mb-4">Theme Controls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                        label="Background"
                        value={theme.background}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "background", color);
                            triggerUpdate();
                        }}
                    />
                    <ColorPicker
                        label="Text Color"
                        value={theme.foreground}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "foreground", color);
                            triggerUpdate();
                        }}
                    />
                    <ColorPicker
                        label="Primary Color"
                        value={theme.primary}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "primary", color);
                            triggerUpdate();
                        }}
                    />
                    <ColorPicker
                        label="Secondary Color"
                        value={theme.secondary}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "secondary", color);
                            triggerUpdate();
                        }}
                    />
                    <ColorPicker
                        label="User Bubble"
                        value={theme.bubbleUser}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "bubbleUser", color);
                            triggerUpdate();
                        }}
                    />
                    <ColorPicker
                        label="Agent Bubble"
                        value={theme.bubbleAgent}
                        onChange={(color) => {
                            updateChatColor(demoChatId, "bubbleAgent", color);
                            triggerUpdate();
                        }}
                    />
                </div>
            </div>

            {/* Theme Preview */}
            <div
                className="bg-white rounded-lg shadow-lg border p-6"
                style={demoStyle}
            >
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-chat-foreground)' }}>
                    Live Theme Preview
                </h2>
                <div className="space-y-4">
                    {/* Header simulation */}
                    <div
                        className="p-3 rounded"
                        style={{
                            backgroundColor: 'var(--color-chat-header-bg)',
                            color: 'var(--color-chat-header-text)'
                        }}
                    >
                        Chat Header
                    </div>

                    {/* Message bubbles simulation */}
                    <div className="space-y-2">
                        <div
                            className="p-3 rounded-lg max-w-xs ml-auto"
                            style={{
                                backgroundColor: 'var(--color-chat-bubble-user)',
                                color: '#ffffff'
                            }}
                        >
                            User message bubble
                        </div>
                        <div
                            className="p-3 rounded-lg max-w-xs"
                            style={{
                                backgroundColor: 'var(--color-chat-bubble-agent)',
                                color: '#ffffff'
                            }}
                        >
                            Agent message bubble
                        </div>
                    </div>

                    {/* User area simulation */}
                    <div
                        className="p-3 rounded border"
                        style={{
                            backgroundColor: 'var(--color-chat-user-area)',
                            borderColor: 'var(--color-chat-border)'
                        }}
                    >
                        User input area
                    </div>
                </div>
            </div>

            {/* Persistence Demo */}
            <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold mb-4">📱 localStorage Persistence</h2>
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                        Current themes stored in localStorage:
                    </p>
                    <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                        {localStorageContent}
                    </pre>
                    <p className="text-xs text-gray-500">
                        💡 Try changing colors above, then refresh the page to see persistence in action!
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