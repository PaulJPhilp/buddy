"use client";

import { useChatInstance } from "@/hooks/useChatInstance";
import { Bug } from "lucide-react";
import React, { useCallback, useState } from "react";
import ChatArea from "./components/ChatArea";
import { HeaderBar } from "./components/HeaderBar";
import UserArea from "./components/UserArea";
import type { ChatAppTheme } from "./themes/themeTypes";
import type { ChatAgentConfig, ChatInstanceAction } from "./types";

interface ChatAppProps {
    chatId: string;
    agentConfig: ChatAgentConfig;
    className?: string;
    theme?: Partial<ChatAppTheme> | string;
}

export function ChatApp({ chatId, agentConfig, className = "", theme }: ChatAppProps) {
    const { chatState, runtimeError, dispatchAction } = useChatInstance(
        chatId,
        agentConfig
    );

    const mockAgentsForTesting = [
        {
            id: "agent1",
            name: "Test Agent 1",
            description: "Description for Agent 1",
            status: { mood: 80, energy: 90, health: 95 },
            capabilities: { canSpeak: true, canMove: false, canLearn: true },
            avatar: "/avatars/agent1.png"
        },
        {
            id: "agent2",
            name: "Test Agent 2",
            description: "Description for Agent 2",
            status: { mood: 70, energy: 85, health: 90 },
            capabilities: { canSpeak: true, canMove: true, canLearn: true },
            avatar: "/avatars/agent2.png"
        },
    ];

    const [inputText, setInputText] = useState("");
    const [showDebug, setShowDebug] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string>(
        mockAgentsForTesting.length > 0 ? mockAgentsForTesting[0].id : ""
    );

    const handleSendMessage = useCallback(() => {
        if (!inputText.trim()) return;

        const action: ChatInstanceAction = {
            _tag: "sendMessage",
            text: inputText.trim(),
        };

        dispatchAction(action);
        setInputText("");
    }, [inputText, dispatchAction]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    const getStatusColor = (status: typeof chatState.status) => {
        switch (status) {
            case "connected":
                return "text-green-600";
            case "connecting":
            case "reconnecting":
                return "text-yellow-600";
            case "error":
                return "text-red-600";
            case "disconnected":
                return "text-gray-600";
            default:
                return "text-gray-400";
        }
    };

    const getStatusText = (status: typeof chatState.status) => {
        switch (status) {
            case "initializing":
                return "Initializing...";
            case "connecting":
                return "Connecting...";
            case "connected":
                return "Connected";
            case "reconnecting":
                return "Reconnecting...";
            case "disconnected":
                return "Disconnected";
            case "error":
                return "Error";
            default:
                return "Unknown";
        }
    };

    // Determine data attribute for theme - always pass string themes
    const dataChatTheme = typeof theme === 'string' ? theme : undefined;

    return (
        <div
            className={`flex flex-col h-full max-w-4xl mx-auto p-4 bg-chat-background text-chat-foreground ${className}`}
            data-chat-theme={dataChatTheme}
            suppressHydrationWarning={true}
        >
            <div className="flex items-center justify-between">
                <HeaderBar title={chatState.agentName} />
            </div>

            {(runtimeError || chatState.error) && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg m-4">
                    <h3 className="text-sm font-medium text-destructive">Error</h3>
                    <p className="text-sm text-destructive/90 mt-1">
                        Error: {String(runtimeError || chatState.error)}
                    </p>
                </div>
            )}

            <ChatArea
                messages={chatState.messages}
                isTyping={chatState.isTyping}
            />

            <UserArea
                onSendMessage={handleSendMessage}
                agents={mockAgentsForTesting}
                selectedAgent={selectedAgentId}
                onSelectedAgentChange={setSelectedAgentId}
                currentAttachments={[]}
                onRemoveAttachment={() => { }}
                onAddAttachments={() => { }}
                disabled={chatState.status !== "connected"}
            />

            {showDebug && (
                <div className="mt-4 p-2 bg-muted border border-border rounded text-xs text-muted-foreground overflow-x-auto max-h-48">
                    <pre>{JSON.stringify({ chatState, runtimeError }, null, 2)}</pre>
                </div>
            )}

            <button
                type="button"
                className="fixed left-2 bottom-2 z-50 p-0.5 rounded hover:bg-accent bg-background/80 border border-border shadow-sm"
                style={{ width: 22, height: 22 }}
                onClick={() => setShowDebug((v) => !v)}
                aria-label="Show debug info"
            >
                <Bug className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            </button>

            {/* Theme Test - CSS Variables Direct Check */}
            <div
                className="absolute top-2 right-2 p-1 text-xs border rounded z-40"
                style={{
                    backgroundColor: 'var(--color-chat-background)',
                    color: 'var(--color-chat-foreground)',
                    borderColor: 'var(--color-chat-border)',
                    fontSize: '10px'
                }}
            >
                Theme: {typeof theme === 'string' ? theme : (theme ? 'object' : 'default')}
            </div>
        </div>
    );
}