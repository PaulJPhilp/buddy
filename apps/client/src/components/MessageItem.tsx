"use client"

import { FileIcon } from "lucide-react"
import { cn } from "../utils/cn"

interface FileAttachment {
    id: string
    name: string
    size: number
    type: string
    url?: string
}

interface Message {
    id: string
    content: string
    sender: "user" | "assistant"
    timestamp: string
    attachments?: FileAttachment[]
}

interface MessageItemProps {
    message: Message
}

export function MessageItem({ message }: MessageItemProps) {
    const isUser = message.sender === "user"

    return (
        <div
            className={cn(
                "flex gap-2",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div
                className={cn(
                    "flex flex-col max-w-[80%] gap-1",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "rounded-lg px-4 py-2",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-col gap-1">
                        {message.attachments.map(file => (
                            <div
                                key={file.id}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1 rounded bg-background border text-sm",
                                    isUser && "flex-row-reverse"
                                )}
                            >
                                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[200px]">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {(file.size / 1024 / 1024).toFixed(2)}MB
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <span
                    className={cn(
                        "text-xs text-muted-foreground",
                        isUser ? "text-right" : "text-left"
                    )}
                >
                    {message.timestamp}
                </span>
            </div>
        </div>
    )
} 