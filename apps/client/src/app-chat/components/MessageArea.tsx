"use client";

import { type MessageApi } from "@/app-chat/ChatServiceApi";
import { MessageItem } from "@/components/MessageItem";
import * as React from "react";

interface MessageAreaProps {
    messages: MessageApi[];
    theme: "blue" | "rose";
    onMessagesEndRefChange?: (ref: HTMLDivElement | null) => void;
}

export function MessageArea({ messages, theme, onMessagesEndRefChange }: MessageAreaProps) {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (onMessagesEndRefChange) {
            onMessagesEndRefChange(messagesEndRef.current);
        }
    }, [onMessagesEndRefChange]);

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
            {messages.map((message) => (
                <MessageItem
                    key={message.id}
                    message={{
                        id: message.id,
                        content: message.text,
                        sender: message.sender,
                        timestamp: String(message.timestamp),
                        attachments: message.attachments,
                    }}
                    theme={theme}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
