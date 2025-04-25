"use client"

import { Menu } from "lucide-react"
import { Button } from "../ui/button"
import { useToast } from "../ui/use-toast"

interface TopToolbarProps {
    onToggleSidebar: () => void
}

export function TopToolbar({ onToggleSidebar }: TopToolbarProps) {
    const { toast } = useToast()

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast({
                title: "Copied!",
                description: "Text copied to clipboard"
            })
        } catch (err) {
            console.error("Failed to copy:", err)
            toast({
                title: "Copy failed",
                description: "Your browser doesn't support clipboard operations",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="h-14 border-b bg-muted/40 flex items-center px-4">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="mr-4"
            >
                <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Buddy</h1>
        </div>
    )
} 