"use client"

import { cn } from "@/lib/utils"

interface Message {
    id: string
    content: string
    sender: "user" | "assistant"
    timestamp: string
}

interface MessageItemProps {
    message: Message
}

export function MessageItem({ message }: MessageItemProps) {
    const isUser = message.sender === "user"

    return (
        <div className={cn(
            "flex w-full",
            isUser ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isUser
                        ? "bg-blue-500 text-white"
                        : "bg-muted text-foreground border border-slate-200/50"
                )}>
                    {message.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-2">
                    {isUser ? "You" : "Assistant"} • {message.timestamp}
                </span>
            </div>
        </div>
    )
} 