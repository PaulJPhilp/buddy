"use client"

import { SendIcon } from "lucide-react"
import { useState } from "react"
import { Textarea } from "../../../../src/components/components/ui/textarea"

interface InputAreaProps {
    onSubmitAction: (text: string) => void
}

export function InputArea({ onSubmitAction }: InputAreaProps) {
    const [text, setText] = useState("")

    const handleSubmit = () => {
        if (!text.trim()) return
        onSubmitAction(text)
        setText("")
    }

    return (
        <div className="relative w-full">
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
                className="min-h-[40px] max-h-[200px] pr-10 px-1 py-0.5"
            />
            <SendIcon
                onClick={handleSubmit}
                className="absolute right-3 top-1.5 h-4 w-4 cursor-pointer text-primary hover:text-primary/80 transition-colors"
                style={{ opacity: text.trim() ? 1 : 0.5 }}
            />
        </div>
    )
} 