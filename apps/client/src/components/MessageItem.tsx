"use client"


interface Message {
    id: string
    content: string
    sender: 'user' | 'assistant'
    timestamp?: string
    isAppletNotification?: boolean
}

interface MessageItemProps {
    message: Message
}

export function MessageItem({ message }: MessageItemProps) {
    if (message.isAppletNotification) {
        return (
            <div className="flex justify-center py-2">
                <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} py-2`}>
            <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                    }`}
            >
                <p className="text-sm">{message.content}</p>
                {message.timestamp && (
                    <p className="mt-1 text-xs opacity-70">{message.timestamp}</p>
                )}
            </div>
        </div>
    )
} 