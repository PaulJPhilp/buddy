"use client"

import { Message } from "@/app-chat/ChatServiceApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ChatWindowProps {
    messages: Message[]
    isTyping: boolean
    onSendMessage: (text: string) => void
}

export function ChatWindow({ messages, isTyping, onSendMessage }: ChatWindowProps) {
    const [inputText, setInputText] = useState("")

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText.trim())
            setInputText("")
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-lg shadow-sm">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                            Typing...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
                <div className="flex gap-2">
                    <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={!inputText.trim()}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
} 