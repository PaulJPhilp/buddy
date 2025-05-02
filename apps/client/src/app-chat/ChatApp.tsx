"use client"

import { Effect } from "effect"
import { FileIcon, PaperclipIcon, XIcon } from "lucide-react"
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { InputArea } from "../components/InputArea"
import { MessageItem } from "../components/MessageItem"
import { ChatService } from "./ChatService"
import type { MessageApi } from "./ChatServiceApi"
import { createFileUploadUIBarService } from "./components/FileUploadUIBar"
import { UIBarService } from "./services/UIBarService"
import { Button } from "/Users/paul/Projects/buddy/src/components/components/ui/button"

interface AttachedFile extends File {
    id: string
}

interface ChatAppProps {
    uiBarService?: Effect.Effect<never, never, UIBarService>
}

export function ChatApp({ uiBarService }: ChatAppProps) {
    const [messages, setMessages] = useState<MessageApi[]>([])
    const [error, setError] = useState<string | null>(null)
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    const [uiBar, setUiBar] = useState<React.ReactNode>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Handle file selection from UIBar
    const handleUIBarFileSelect = useCallback((files: File[]) => {
        const newFiles: AttachedFile[] = files.map(file => ({
            ...file,
            id: `${file.name}-${Date.now()}`
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

                        const fileUploadBar = createFileUploadUIBarService(handleUIBarFileSelect)
                        const bar: UIBarService = yield* fileUploadBar
                        setUiBar(bar.render())
                    }),
                    catch: () => new Error("Failed to initialize chat")
                })
            )
        }
        init()
    }, [handleUIBarFileSelect])

    // Handle sending messages
    const handleSendMessage = async (content: string) => {
        try {
            await Effect.runPromise(
                Effect.try({
                    try: () => Effect.gen(function* (_) {
                        const service = yield* ChatService
                        const result: MessageApi = yield* service.sendMessage(content, attachedFiles)
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

        const newFiles: AttachedFile[] = Array.from(files).map(file => ({
            ...file,
            id: `${file.name}-${Date.now()}`
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
        <div className="flex flex-col h-full">
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
                <div className="p-4">
                    {attachedFiles.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md">
                            {attachedFiles.map(file => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-2 bg-background px-2 py-1 rounded border"
                                >
                                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm truncate max-w-[200px]">
                                        {file.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleRemoveFile(file.id)}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <PaperclipIcon className="h-4 w-4" />
                        </Button>
                        <InputArea onSubmit={handleSendMessage} />
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