"use client"

import { Effect } from "effect"
import { FileIcon, PaperclipIcon, XIcon } from "lucide-react"
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { InputArea } from "../components/InputArea"
import { MessageItem } from "../components/MessageItem"
import { ChatService } from "./ChatService"
import type { MessageApi } from "./ChatServiceApi"
import { FileUploadUIBarService } from "./components/FileUploadUIBar"
import { UIBarServiceApi } from "./services/UIBarService"
import { Button } from "/Users/paul/Projects/buddy/src/components/components/ui/button"

interface DisplayFile {
    id: string
    name: string
    size: number
    type: string
    file: File
}

interface ChatAppProps {
    uiBarService?: Effect.Effect<never, never, UIBarServiceApi>
}

export function ChatApp({ uiBarService }: ChatAppProps) {
    const [messages, setMessages] = useState<MessageApi[]>([])
    const [error, setError] = useState<string | null>(null)
    const [attachedFiles, setAttachedFiles] = useState<DisplayFile[]>([])
    const [uiBar, setUiBar] = useState<React.ReactNode>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Handle file selection from UIBar
    const handleUIBarFileSelect = useCallback((files: File[]) => {
        const newFiles: DisplayFile[] = files.map(file => ({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            file
        }))
        setAttachedFiles(prev => [...prev, ...newFiles])
    }, [])

    // Initialize chat service and UI bar
    useEffect(() => {
        const init = async () => {
            await Effect.runPromise(
                Effect.try({
                    try: () => Effect.gen(function* (_) {
                        const service = yield* ChatService
                        const state = yield* service.getState()
                        setMessages(state.messages)

                        const uiBarService = yield* FileUploadUIBarService
                        setUiBar(uiBarService.render())
                    }),
                    catch: () => new Error("Failed to initialize chat")
                })
            )
        }
        init()
    }, [])

    // Handle sending messages
    const handleSendMessage = async (content: string) => {
        try {
            await Effect.runPromise(
                Effect.try({
                    try: () => Effect.gen(function* (_) {
                        const service = yield* ChatService
                        const result: MessageApi = yield* service.sendMessage(content, attachedFiles.map(f => f.file))
                        const state = yield* service.getState()
                        setMessages(state.messages)
                    }),
                    catch: () => new Error("Failed to send message")
                })
            )
            // Clear attachments after sending
            setAttachedFiles([])
        } catch (err) {
            setError("Failed to send message")
            console.error(err)
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        const newFiles: DisplayFile[] = Array.from(files).map(file => ({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            file
        }))

        setAttachedFiles(prev => [...prev, ...newFiles])

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleRemoveFile = (fileId: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
    }

    return (
        <div className="flex flex-col h-full border rounded-lg bg-background">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <MessageItem
                        key={msg.id}
                        message={{
                            id: msg.id,
                            content: msg.text,
                            sender: msg.sender,
                            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
                            attachments: msg.attachments
                        }}
                    />
                ))}
                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}
            </div>
            <div className="border-t">
                <div className="px-1 py-1">
                    {attachedFiles.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1 p-1 bg-muted/30 rounded-md">
                            {attachedFiles.map(file => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-1 bg-background px-1 py-0.5 rounded border"
                                >
                                    <div
                                        className="group relative cursor-help"
                                        aria-label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`}
                                    >
                                        <FileIcon className="h-3 w-3 text-muted-foreground" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => handleRemoveFile(file.id)}
                                    >
                                        <XIcon className="h-2 w-2" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="relative w-full">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        <InputArea onSubmitAction={handleSendMessage} />
                        <PaperclipIcon
                            className="absolute right-10 top-1.5 h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        />
                    </div>
                </div>
                {uiBar && (
                    <div className="border-t p-4">
                        {uiBar}
                    </div>
                )}
            </div>
        </div>
    )
} 