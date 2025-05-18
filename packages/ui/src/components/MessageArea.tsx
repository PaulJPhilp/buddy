import React, { useEffect, useRef } from "react";

export interface ChatMessage {
    id: string;
    text: string;
    isUser?: boolean;
    timestamp: Date | number | string;
}

export interface MessageAreaProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    error?: string | null;
    className?: string;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
    messages = [],
    isLoading = false,
    error = null,
    className = ''
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    // biome-ignore lint/correctness/useExhaustiveDependencies: only need to scroll when message count changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    return (
        <div className={`overflow-auto p-3 space-y-3 ${className}`}>
            {isLoading ? (
                <div className="p-2 bg-gray-100 rounded-md text-sm text-gray-600">Loading messages...</div>
            ) : error && messages.length === 0 ? (
                <div className="p-2 bg-red-50 rounded-md text-sm text-red-600 border border-red-200">{error}</div>
            ) : messages.length === 0 ? (
                <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-500">No messages yet. Start a conversation.</div>
            ) : (
                messages.map((message) => (
                    <div
                        key={message.id}
                        className={`p-2 rounded-md max-w-[85%] ${message.isUser
                            ? "bg-blue-50 ml-auto border border-blue-100"
                            : "bg-gray-50 border border-gray-100"
                            }`}
                    >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {message.timestamp instanceof Date
                                ? message.timestamp.toLocaleTimeString()
                                : typeof message.timestamp === 'number'
                                    ? new Date(message.timestamp).toLocaleTimeString()
                                    : typeof message.timestamp === 'string' && !Number.isNaN(Date.parse(message.timestamp))
                                        ? new Date(message.timestamp).toLocaleTimeString()
                                        : 'Just now'}
                        </p>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageArea;
