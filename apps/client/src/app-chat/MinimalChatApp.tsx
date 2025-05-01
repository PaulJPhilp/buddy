"use client"

import { MessageItem } from "@/components/MessageItem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Effect } from "effect"
import { useEffect, useState } from "react"
import { ChatService } from "./ChatService"
import type { ChatStateApi } from "./ChatServiceApi"

export function MinimalChatApp() {
    const [chatState, setChatState] = useState<ChatStateApi>({
        id: `chat-${Date.now()}`,
        messages: [],
        isTyping: false
    })
    const [inputText, setInputText] = useState("")

    // Initialize chat
    useEffect(() => {
        const initChat = async () => {
            try {
                await Effect.runPromise(
                    Effect.gen(function* () {
                        const service = yield* Effect.Do
                        return yield* Effect.succeed(service)
                    }).pipe(Effect.provide(ChatService.Default))
                )
            } catch (error) {
                console.error("Failed to initialize chat:", error)
            }
        }
        initChat()
    }, [])

    // Send message
    const handleSend = async (text: string) => {
        if (!text.trim()) return

        try {
            await Effect.runPromise(
                Effect.gen(function* () {
                    const service = yield* Effect.Do

                    // Set typing indicator
                    yield* Effect.succeed(service.setTyping(true))

                    // Send message
                    yield* Effect.succeed(service.sendMessage(text))

                    // Clear typing indicator
                    yield* Effect.succeed(service.setTyping(false))

                    // Get updated state
                    const newState = yield* Effect.succeed(service.getState())
                    setChatState(newState)
                }).pipe(Effect.provide(ChatService.Default))
            )
        } catch (error) {
            console.error("Failed to send message:", error)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (inputText.trim()) {
                handleSend(inputText)
                setInputText("")
            }
        }
    }

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="border-b bg-muted/50">
                <CardTitle>Chat</CardTitle>
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
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                            Typing...
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t bg-muted/50 p-4">
                <div className="flex w-full gap-2">
                    <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button
                        onClick={() => {
                            if (inputText.trim()) {
                                handleSend(inputText)
                                setInputText("")
                            }
                        }}
                        disabled={!inputText.trim()}
                    >
                        Send
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
} 