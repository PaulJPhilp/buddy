"use client"

interface SidebarProps {
    isOpen: boolean
    onToggleAction: () => void
}

export function Sidebar({ isOpen, onToggleAction }: SidebarProps) {
    return (
        <div className={`flex-1 overflow-hidden hover:overflow-y-auto flex flex-col ${!isOpen ? 'hidden' : ''}`} />
    )
} 