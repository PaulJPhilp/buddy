"use client";

import { useChatInstance } from "@/hooks/useChatInstance";
import { Bug } from "lucide-react";
import { useCallback, useState } from "react";
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
    console.log('[ChatApp] Rendering with:', { chatId, agentConfig: agentConfig.agentId, className, theme });

    const { chatState, runtimeError, dispatchAction } = useChatInstance(
        chatId,
        agentConfig
    );

    console.log('[ChatApp] Chat state:', {
        status: chatState.status,
        messagesCount: chatState.messages.length,
        agentName: chatState.agentName,
        isTyping: chatState.isTyping
    });

    // Use the agents from the agentConfig instead of mocks
    const agents = agentConfig.agents || [];

    const [showDebug, setShowDebug] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string>(
        agents.length > 0 ? agents[0].id : ""
    );

    const handleSendMessage = useCallback((text: string, files?: File[]) => {
        console.log('[ChatApp] handleSendMessage called:', {
            text,
            textLength: text.length,
            trimmedLength: text.trim().length,
            filesCount: files?.length || 0,
            hasFiles: !!files && files.length > 0,
            chatId,
            agentId: agentConfig.agentId
        });

        if (!text.trim()) {
            console.log('[ChatApp] Send blocked: empty text after trim');
            return;
        }

        const action: ChatInstanceAction = {
            _tag: "sendMessage",
            text: text.trim(),
            attachments: files?.map(file => ({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type
            }))
        };

        console.log('[ChatApp] Created action:', action);
        console.log('[ChatApp] Dispatching sendMessage action to useChatInstance');
        dispatchAction(action);
        console.log('[ChatApp] Action dispatched successfully');
    }, [dispatchAction, chatId, agentConfig.agentId]);

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

    console.log('[ChatApp] About to render with theme:', dataChatTheme);

    return (
        <div
            className={`flex flex-col h-full bg-chat-background text-chat-foreground ${className}`}
            data-chat-theme={dataChatTheme}
            suppressHydrationWarning={true}
        >
            {/* Header - Fixed at top */}
            <HeaderBar title={chatState.agentName} />

            {/* Main content area - Takes remaining space with flex-1 and min-h-0 */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Chat content - Takes remaining space with overflow */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 w-full">
                        {(runtimeError || chatState.error) && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 flex-shrink-0">
                                <h3 className="text-sm font-medium text-destructive">Error</h3>
                                <p className="text-sm text-destructive/90 mt-1">
                                    Error: {String(runtimeError || chatState.error)}
                                </p>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ChatArea
                                messages={chatState.messages}
                                isTyping={chatState.isTyping}
                            />
                        </div>
                    </div>
                </div>

                {/* User Area - Fixed at bottom */}
                <div className="flex-shrink-0">
                    <UserArea
                        onSendMessage={handleSendMessage}
                        agents={agents}
                        selectedAgent={selectedAgentId}
                        onSelectedAgentChange={setSelectedAgentId}
                        currentAttachments={[]}
                        onRemoveAttachment={() => { }}
                        onAddAttachments={() => { }}
                        disabled={false} // Temporarily enable for debugging
                    />
                </div>

                {/* Debug panel - Fixed position if shown */}
                {showDebug && (
                    <div className="flex-shrink-0 max-w-4xl mx-auto p-4 w-full">
                        <div className="p-2 bg-muted border border-border rounded text-xs text-muted-foreground overflow-x-auto max-h-48">
                            <pre>{JSON.stringify({ chatState, runtimeError }, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>

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