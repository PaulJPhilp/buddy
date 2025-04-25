"use client"

import * as React from "react"

interface InputAreaProps {
    onSubmit?: (message: string) => void
}

export function InputArea({ onSubmit }: InputAreaProps) {
    const [message, setMessage] = React.useState("")

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (message.trim() && onSubmit) {
            onSubmit(message.trim())
            setMessage("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Send
            </button>
        </form>
    )
} 