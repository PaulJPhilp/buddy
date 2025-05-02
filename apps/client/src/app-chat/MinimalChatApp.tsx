"use client"

import { MessageItem } from "@/components/MessageItem"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import type { ChatState, MessageApi } from "./ChatServiceApi"

const minChat = {
    id: "minimal-chat",
    messages: [] as MessageApi[],
    isTyping: false
} as const as ChatState

export function MinimalChatApp() {
    const [chatState, setChatState] = useState(minChat)
    const [inputText, setInputText] = useState("")

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="border-b border-slate-200/50 bg-muted/50 py-0.25 px-1.5 h-4 min-h-[16px] flex items-center">
                <CardTitle className="text-[10px] font-medium leading-none">Chat</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatState.messages.map(msg => (
                    <MessageItem
                        key={msg.id}
                        message={{
                            id: msg.id,
                            content: msg.text,
                            sender: msg.sender,
                            timestamp: new Date(msg.timestamp).toLocaleTimeString()
                        }}
                    />
                ))}
                {chatState.isTyping && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="animate-pulse">●</span>
                        <span>Assistant is typing...</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t border-slate-200/50 bg-muted/50 p-2">
                <div className="flex w-full gap-2 items-center">
                    <input
                        className="flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1 border-[0.5px] border-slate-200/50 focus-visible:ring-1"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                setInputText("")
                            }
                        }}
                    />
                    <button
                        type="button"
                        disabled={!inputText.trim()}
                        onClick={() => setInputText("")}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors duration-200 ${!inputText.trim() && "opacity-50 cursor-not-allowed"}`}
                        aria-label="Send message"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 ${inputText.trim() ? "text-blue-500" : "text-slate-300"}`}
                        >
                            <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                            <path d="m21.854 2.147-10.94 10.939" />
                        </svg>
                    </button>
                </div>
            </CardFooter>
        </Card>
    )
}
