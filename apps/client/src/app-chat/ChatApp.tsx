"use client"

import { InputArea } from "@/components/InputArea"
import { MessageItem } from "@/components/MessageItem"
import { Effect } from "effect"
import { useEffect, useState } from "react"
import { ChatService } from "./ChatService"
import { MessageApi } from "./ChatServiceApi"

export function ChatApp() {
    const [messages, setMessages] = useState<MessageApi[]>([])
    const [error, setError] = useState<string | null>(null)

    // Initialize chat service
    useEffect(() => {
        const initChat = async () => {
            try {
                await Effect.runPromise(
                    Effect.gen(function* () {
                        const service = yield* ChatService
                        const state = yield* service.getState()
                        setMessages(state.messages)
                    }).pipe(Effect.provide(ChatService.Default))
                )
            } catch (err) {
                setError("Failed to initialize chat")
                console.error(err)
            }
        }
        initChat()
    }, [])

    // Handle sending messages
    const handleSendMessage = async (content: string) => {
        try {
            await Effect.runPromise(
                Effect.gen(function* () {
                    const service = yield* ChatService
                    yield* service.sendMessage(content)
                    const state = yield* service.getState()
                    setMessages(state.messages)
                }).pipe(Effect.provide(ChatService.Default))
            )
        } catch (err) {
            setError("Failed to send message")
            console.error(err)
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageItem
                        key={msg.id}
                        message={{
                            id: msg.id,
                            content: msg.text,
                            sender: msg.sender === "user" ? "user" : "assistant",
                            timestamp: new Date(msg.timestamp).toLocaleTimeString()
                        }}
                    />
                ))}
            </div>
            <div className="p-4 border-t">
                <InputArea onSubmit={handleSendMessage} />
            </div>
        </div>
    )
} 