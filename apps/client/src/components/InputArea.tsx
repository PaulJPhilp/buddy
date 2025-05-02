"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

interface InputAreaProps {
    onSubmit: (text: string) => void
}

export function InputArea({ onSubmit }: InputAreaProps) {
    const [text, setText] = useState("")

    const handleSubmit = () => {
        if (!text.trim()) return
        onSubmit(text)
        setText("")
    }

    return (
        <div className="flex gap-2">
            <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                    }
                }}
                placeholder="Type a message..."
                className="min-h-[40px] max-h-[200px]"
            />
            <Button onClick={handleSubmit} disabled={!text.trim()}>Send</Button>
        </div>
    )
} 