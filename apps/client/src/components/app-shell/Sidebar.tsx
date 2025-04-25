"use client"

import { Button } from "@/components/ui/button";
import { Home, MessageCircle, Settings } from "lucide-react";

interface SidebarProps {
    isOpen: boolean; // Define prop type
}

export function Sidebar({ isOpen }: SidebarProps) { // Accept isOpen prop
    console.log("Sidebar isOpen prop:", isOpen); // Log received prop
    return (
        <div className="flex-1 p-2 space-y-2">
            {/* Navigation Items */}
            <Button
                variant="ghost"
                className="w-full justify-start"
                size={isOpen ? "default" : "icon"}
            >
                <Home className="h-5 w-5" />
                {isOpen && <span className="ml-2">Home</span>}
            </Button>

            <Button
                variant="ghost"
                className="w-full justify-start"
                size={isOpen ? "default" : "icon"}
            >
                <MessageCircle className="h-5 w-5" />
                {isOpen && <span className="ml-2">Chat</span>}
            </Button>

            <Button
                variant="ghost"
                className="w-full justify-start"
                size={isOpen ? "default" : "icon"}
            >
                <Settings className="h-5 w-5" />
                {isOpen && <span className="ml-2">Settings</span>}
            </Button>
        </div>
    )
} 