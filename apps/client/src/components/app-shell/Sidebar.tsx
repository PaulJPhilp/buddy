"use client"

import { ChevronLeft, ChevronRight, Home, MessageCircle, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
    isOpen: boolean
    onToggleAction: () => void
}

export function Sidebar({ isOpen, onToggleAction }: SidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            href: "/",
            label: "Home",
            icon: <Home className="h-4 w-4" />,
            isActive: pathname === "/"
        },
        {
            href: "/chat",
            label: "Chat",
            icon: <MessageCircle className="h-4 w-4" />,
            isActive: pathname === "/chat"
        },
        {
            href: "/settings",
            label: "Settings",
            icon: <Settings className="h-4 w-4" />,
            isActive: pathname === "/settings"
        }
    ]

    return (
        <div className="flex-1 overflow-hidden hover:overflow-y-auto flex flex-col">
            <nav className="flex-1 flex flex-col gap-1 p-1">
                {links.map((link) => (
                    <Button
                        key={link.href}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start",
                            link.isActive && "bg-accent text-accent-foreground",
                            !isOpen && "px-0 justify-center"
                        )}
                        size={isOpen ? "sm" : "icon"}
                        asChild
                    >
                        <Link href={link.href}>
                            {link.icon}
                            {isOpen && <span className="ml-1 text-xs truncate">{link.label}</span>}
                        </Link>
                    </Button>
                ))}
            </nav>

            {/* Collapse/Expand Button */}
            <Button
                variant="ghost"
                size="icon"
                className="mx-1 mb-1"
                onClick={onToggleAction}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
        </div>
    )
} 